import { IdentityProvider, SAMLAssertResponse, ServiceProvider } from 'saml2-js';
import { ActionSpec } from '../../@types/logger';
import { ArrayElement } from '../../@types/utilitytypes';
import { ISettings } from '../models/settings/fields';
import Settings from '../models/settings/Settings';
import User from '../models/user/User';
import syncMailingLists from '../services/mailer/syncMailingLists';
import { fetchSAMLBundle } from '../services/multisaml';
import * as permissions from '../services/permissions';
import { BadRequestError, InternalServerError } from '../types/errors';

async function _handleLogin(saml_response: SAMLAssertResponse, relayState: Record<string, string>): Promise<ActionSpec> {
  // Receives the IDP's response after an authentication request.
  const name_id = saml_response.user.name_id;
  const assertAttributes = saml_response.user.attributes;

  // IDP did not send enough data, probably forgot to set up mappers.
  if (!assertAttributes.email || !assertAttributes.firstName || !assertAttributes.lastName) {
    throw new BadRequestError('Missing SAML fields.');
  }

  let token: string;

  try {
    const groups: any = {};

    // Update the groups this user is in in the database
    for (const group of assertAttributes.groups || []) {
      // Remove the leading /
      groups[group.substring(1)] = true;
    }

    const userInfo = await User.findOneAndUpdate({
      samlNameID: name_id,
    }, {
      email: assertAttributes.email[0].toLowerCase(),
      firstName: assertAttributes.firstName[0],
      lastName: assertAttributes.lastName[0],
      groups: groups,
    }, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    console.log(assertAttributes);

    token = permissions.createJwt({
      id: userInfo._id,
      samlNameID: name_id,
      samlSessionIndex: saml_response.user.session_index,
      roles: userInfo.roles,
    });

    // Trigger a mailing list sync on login
    // We don't really need to wait for this, so we'll run it async
    syncMailingLists(undefined, true, userInfo.email)
    .then(() => {
      console.log(`Synced mailing list for ${userInfo.email}`);
    })
    .catch((e) => {
      console.log(`Unable to sync mailing list for ${userInfo.email}`, e);
    });

  } catch (err) {
    console.log(err);
    throw new InternalServerError('Error logging user in.', err);
  }

  if (relayState.redirect) {
    const samlInfo = await Settings.findOne({}, 'saml');
    const redirectURL = new URL(relayState.redirect);
    if (samlInfo.saml.permittedRedirectHosts.indexOf(redirectURL.host) !== -1) {
      redirectURL.searchParams.set('token', token);
      return {
        action: 'redirect',
        data: redirectURL.toString(),
      };
    }
    throw new BadRequestError('Redirect URL host not permitted.');
  } else {
    return {
      action: 'respond',
      data: {
        token,
      },
    };
  }
}

function _handleLogoutRequest(sp: ServiceProvider, idp: IdentityProvider, saml_response: SAMLAssertResponse): Promise<ActionSpec> {
  return new Promise<ActionSpec>((resolve, reject) => {
    //definition is wrong for this type
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const name_id = saml_response.name_id;

    // remote slo logout, revoke all tokens issued before now
    User.findOneAndUpdate({
      samlNameID: name_id,
    }, {
      lastLogout: Date.now(),
    }).catch((err) => {
      console.log(err);
      console.log('Unable to revoke past sessions.');
    }).finally(() => {
      sp.create_logout_response_url(idp, {
        in_response_to: saml_response.response_header.id,
      }, (error: Error | null, response_url: string) => {
        if (error) {
          return reject(error);
        }

        return resolve({
          action: 'redirect',
          data: response_url,
        });
      });
    });


  });

}

function _getProviderByName(settings: ISettings, providerName: string): ArrayElement<ISettings['saml']['providers']> | undefined {
  for (const provider of settings['saml']['providers']) {
    if (provider['name'] === providerName) {
      return provider;
    }
  }
  return;
}

export const handleACS = (providerName: string, requestBody: Record<string, unknown>): Promise<ActionSpec> => {
  return new Promise<ActionSpec>((resolve, reject) => {
    const options = { request_body: requestBody };
    fetchSAMLBundle(providerName.toLowerCase()).then(({ sp, idp }) => {
      sp.post_assert(idp, options, async (err, saml_response) => {
        if (err != null) {
          return reject(new InternalServerError('Internal server error.', err, false));
        }

        console.log(saml_response);

        let relayState = {} as Record<string, string>;

        if (requestBody.RelayState) {
          try {
            relayState = JSON.parse(requestBody.RelayState as string);
          } catch (ignored) {
            // do nothing, invalid relay state
          }
        }
        try {
          if (saml_response.type == 'logout_request') {
            /*
            logout_request is called when a logout is generated from another application.
            We need to destroy the user's session on our end and redirect back to the IDP.
             */
            return resolve(await _handleLogoutRequest(sp, idp, saml_response));

          } else if (saml_response.type == 'logout_response') {
            const samlInfo = await Settings.findOne({}, 'saml');

            const provider = _getProviderByName(samlInfo, providerName);

            return resolve({
              action: 'redirect',
              data: provider.logout_redirect_url,
            });
          } else {
            return resolve(await _handleLogin(saml_response, relayState));
          }
        } catch (err) {
          return reject(err);
        }
      });
    }).catch((err) => {
      return reject(err);
    });

  });
};

export const handleLogin = async (providerName: string, redirectTo?: string): Promise<Record<string, string>> => {
  return new Promise<Record<string, string>>((resolve, reject) => {
    fetchSAMLBundle(providerName.toLowerCase()).then(({ sp, idp }) => {
      const relayState = {} as Record<string, string>;

      if (redirectTo) {
        relayState['redirect'] = redirectTo;
      }
      sp.create_login_request_url(idp, {
        relay_state: JSON.stringify(relayState),
      }, (err: Error | null, login_url: string) => {
        if (err != null)
          return reject(new InternalServerError('Internal server error.', err, false));

        return resolve({
          loginUrl: login_url,
        });
      });
    }).catch((err) => {
      return reject(err);
    });
  });
};

export const handleLogout = async (providerName: string, token: string): Promise<Record<string, string>> => {
  return new Promise<Record<string, string>>((resolve, reject) => {
    if (!token) {
      return reject(new BadRequestError('No token provided.'));
    }

    fetchSAMLBundle(providerName.toLowerCase()).then(({ sp, idp }) => {
      const tokenInfo = permissions.verifyToken(token);

      sp.create_logout_request_url(idp, {
        name_id: tokenInfo.samlNameID,
        session_index: tokenInfo.samlSessionIndex,
      }, (err: Error | null, logout_url: string) => {
        if (err != null)
          return reject(new InternalServerError('Internal server error.', err, false));

        return resolve({
          logoutUrl: logout_url,
        });
      });
    });
  });
};

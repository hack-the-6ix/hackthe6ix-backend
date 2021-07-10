import axios from 'axios';
import { ArrayElement } from '../../@types/utilitytypes';
import { ISettings } from '../models/settings/fields';
import Settings from '../models/settings/Settings';
import { fields } from '../models/user/fields';
import User from '../models/user/User';

import { getCircularReplacer, log } from '../services/logger';

import syncMailingLists from '../services/mailer/syncMailingLists';
import { fetchClient } from '../services/multiprovider';
import * as permissions from '../services/permissions';

import { BadRequestError, ForbiddenError, InternalServerError } from '../types/errors';

let settingsCache = {} as ISettings;
let settingsTime = 0;

const _getCachedSettings = async (): Promise<ISettings> => {
  if (settingsTime + parseInt(process.env.AUTH_SETTINGS_CACHE_EVICT) > Date.now()) {
    return settingsCache;
  }

  const settings = await Settings.findOne({}, 'openID');

  settingsCache = settings;
  settingsTime = Date.now();

  return settings;
};

const _getProviderByName = (settings: ISettings, providerName: string): ArrayElement<ISettings['openID']['providers']> | undefined => {
  for (const provider of settings['openID']['providers']) {
    if (provider['name'] === providerName) {
      return provider;
    }
  }
  return;
};

const _getUserData = async (url: string, token: string): Promise<Record<string, any>> => {
  const response = await axios({
    method: 'GET',
    url: url,
    headers: {
      Authorization: 'Bearer ' + token,
    },
  });

  return response.data;
};

const _issueLocalToken = async (assertAttributes: Record<string, any>): Promise<string> => {
  const groups: any = {};

  // Update the groups this user is in in the database
  // Ensure that we set all the groups the user is not in to FALSE and not NULL
  for (const group of Object.keys(fields.FIELDS.groups.FIELDS) || []) {
    //                                              Assertion includes group with leading /
    groups[group] = (assertAttributes.groups || []).indexOf(`/${group}`) !== -1;
  }

  const userInfo = await User.findOneAndUpdate({
    idpLinkID: assertAttributes.sub,
  }, {
    email: assertAttributes.email.toLowerCase(),
    firstName: assertAttributes.given_name,
    lastName: assertAttributes.family_name,
    groups: groups,
  }, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });

  const token = permissions.createJwt({
    id: userInfo._id,
    idpLinkID: assertAttributes.sub,
    roles: userInfo.roles,
  });

  return token;
};

const _refreshToken = async (client_id: string, client_secret: string, url: string, refreshToken: string): Promise<{
  token: string,
  refreshToken: string
}> => {
  const params = new URLSearchParams();
  params.append('client_id', client_id);
  params.append('client_secret', client_secret);
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  const response = await axios.post(url, params);

  return {
    token: response.data.access_token,
    refreshToken: response.data.refresh_token,
  };
};

export const handleCallback = async (providerName: string, code: string, stateText: string, ip?: string): Promise<{
  token: string,
  refreshToken: string,
  redirectTo: string
}> => {
  try {
    const client = await fetchClient(providerName);
    const settings = await _getCachedSettings();

    const provider = _getProviderByName(settings, providerName);

    const state = JSON.parse(stateText);
    const redirectTo = state.redirectTo;

    const accesstoken = await client.getToken({
      code: code,
      redirect_uri: state.callbackURL,
    });

    const userData = await _getUserData(provider.userinfo_url, accesstoken.token.access_token);

    const localToken = await _issueLocalToken(userData);

    // Trigger a mailing list sync on login
    // We don't really need to wait for this, so we'll run it async
    syncMailingLists(undefined, true, userData.email)
        .then(() => {
          log.debug(`Synced mailing list for ${userData.email}`);
        })
        .catch((e) => {
          log.warn(`Unable to sync mailing list for ${userData.email}`, e);
        });

    // Log the login event
    const logPayload = JSON.stringify({
      ip: ip || 'N/A',
      user: userData,
    }, getCircularReplacer(), 2);
    log.info(`[ LOGIN ]`, logPayload);

    return {
      token: localToken,
      refreshToken: accesstoken.token.refresh_token,
      redirectTo: redirectTo
    }
  }
  catch(err) {
    if(err.output?.statusCode === 400){
      throw new ForbiddenError('Invalid code.', err, false);
    } else {
      throw new InternalServerError('Unable to initialize the login provider.', err, false);
    }
  }
};

export const handleLoginRequest = async (providerName: string, redirectTo: string, callbackURL: string): Promise<{
  url: string
}> => {
  const state = {} as Record<string, string>;

  if (redirectTo) {
    state['redirectTo'] = redirectTo as string;
  }

  try {
    const client = await fetchClient(providerName);

    if (!callbackURL) {
      const settings = await _getCachedSettings();
      callbackURL = _getProviderByName(settings, providerName).callback_url;
    }

    // store this so that frontend can be certain of the callback url used for the session
    state['callbackURL'] = callbackURL;

    const redirectURL = client.authorizeURL({
      redirect_uri: callbackURL,
      scope: 'profile',
      state: JSON.stringify(state),
    });

    return {
      url: redirectURL
    }
  }
  catch(err) {
    throw new InternalServerError('Unable to initialize the login provider.', err, false)
  }
};

export const handleRefresh = async (providerName: string, refreshToken: string): Promise<{
  token: string,
  refreshToken: string
}> => {
  const settings = await _getCachedSettings();
  const provider = _getProviderByName(settings, providerName);

  try {
    const newTokens = await _refreshToken(provider.client_id, provider.client_secret, provider.token_url, refreshToken);

    const userData = await _getUserData(provider.userinfo_url, newTokens['token']);

    const token = await _issueLocalToken(userData);

    return {
      token: token,
      refreshToken: newTokens['refreshToken'],
    };
  } catch (err) {
    throw new BadRequestError("Unable to refresh token", err, false);
  }
};

export const handleLogout = async (providerName: string, refreshToken: string): Promise<Record<string, never>> => {
  const tokenInfo = permissions.decodeToken(refreshToken);
  const settings = await _getCachedSettings();
  const provider = _getProviderByName(settings, providerName);

  if (!refreshToken) {
    throw new BadRequestError('No refresh token provided.');
  }

  try {
    await User.findOneAndUpdate({
      idpLinkID: tokenInfo.sub,
    }, {
      lastLogout: Date.now(),
    });
  } catch (err) {
    log.warn(`Unable to revoke past sessions for user with link ID ${tokenInfo.sub}.`, err);
  }

  try {
    const params = new URLSearchParams();
    params.append('refresh_token', refreshToken);

    await axios({
      url: provider.logout_url,
      method: 'POST',
      data: params,
      auth: {
        username: encodeURIComponent(provider.client_id).replace(/%20/g, '+'),
        password: provider.client_secret
      }
    });
  } catch(err) {
    log.warn(`Unable to log out of IDP session for user with link ID ${tokenInfo.sub}.`, err);
  }

  return {};
};

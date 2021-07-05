import axios from 'axios';
import express, { NextFunction, Request, Response, Router } from 'express';

import passport from 'passport';
import OAuthStrategy, { VerifyCallback } from 'passport-oauth2';
import { getProviderByName } from '../controller/AuthController';
import Settings from '../models/settings/Settings';
import { fields } from '../models/user/fields';
import User from '../models/user/User';
import syncMailingLists from '../services/mailer/syncMailingLists';
import * as permissions from '../services/permissions';

const router: Router = express.Router();

router.use(passport.initialize());

const getUserData = async (url: string, token: string): Promise<Record<string, any>> => {
  const response = await axios({
    method: 'GET',
    url: url,
    headers: {
      Authorization: 'Bearer ' + token,
    },
  });

  return response.data;
};

async function _refreshToken(client_id: string, client_secret: string, url: string, refreshToken: string): Promise<{
  token: string,
  refreshToken: string
}> {
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
}

const issueLocalToken = async (assertAttributes: Record<string, any>): Promise<string> => {
  const groups: any = {};

  // Update the groups this user is in in the database
  // Ensure that we set all the groups the user is not in to FALSE and not NULL
  for (const group of Object.keys(fields.FIELDS.groups.FIELDS) || []) {
    //                                              Assertion includes group with leading /
    groups[group] = assertAttributes.groups.indexOf(`/${group}`) !== -1;
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

  console.log(assertAttributes);

  const token = permissions.createJwt({
    id: userInfo._id,
    idpLinkID: assertAttributes.sub,
    roles: userInfo.roles,
  });

  return token;
};

//TODO: This will get nothing when the server is first initialized, add hot reloading/JIT check?
Settings.findOne({}, 'openID').then((settings) => {
  for (const provider of settings['openID']['providers']) {
    passport.use(provider.name, new OAuthStrategy({
      authorizationURL: provider.authorization_url,
      tokenURL: provider.token_url,
      clientID: provider.client_id,
      clientSecret: provider.client_secret,
      callbackURL: provider.callback_url,
    }, function(token: string, refreshToken: string, profile: any, done: VerifyCallback) {
      getUserData(provider.userinfo_url, token).then((userInfo) => {
        done(null, {
          user: userInfo,
          token: token,
          refreshToken: refreshToken,
        });
      });
    }));
  }
}).catch((err) => {
  console.log('Unable to fetch provider configuration!');
});

// TODO: These will fail if there is a request before the server initializes, respond better
router.get('/:provider/callback', (req: Request, res: Response, next: NextFunction) => {
  return passport.authenticate(req.params.provider, async function(err: any, data: any) {
    if (err) {
      console.log(err);
      return res.send({
        error: 'Error',
      });
    }

    let state = {} as Record<string, string>;

    console.log('query', req.query);

    try {
      state = JSON.parse(req.query.state as string);
    } catch (ignored) {
      // ignore
      console.log('ignored', ignored);
    }

    console.log('statue', state);

    const settings = await Settings.findOne({}, 'openID');

    const assertAttributes = data.user;

    const token = await issueLocalToken(assertAttributes);

    // Trigger a mailing list sync on login
    // We don't really need to wait for this, so we'll run it async
    syncMailingLists(undefined, true, assertAttributes.email)
    .then(() => {
      console.log(`Synced mailing list for ${assertAttributes.email}`);
    })
    .catch((e) => {
      console.log(`Unable to sync mailing list for ${assertAttributes.email}`, e);
    });

    console.log(data);
    console.log('issued token', token);

    if (state.redirect) {
      const redirectURL = new URL(state.redirect);
      if (settings['openID'].permittedRedirectHosts.indexOf(redirectURL.host) !== -1) {
        redirectURL.searchParams.set('token', token);
        redirectURL.searchParams.set('refreshToken', data.refreshToken);
        // return {
        //   action: 'redirect',
        //   data: redirectURL.toString(),
        // };

        return res.redirect(redirectURL.toString());
      } else {
        return res.json({
          error: 'Host not in allowed redirect hosts!',
        });
      }
    }

    return res.json({
      status: 'OK',
    });
  })(req, res, next);
});

router.get('/:provider/login', (req: Request, res: Response, next: NextFunction) => {
  const state = {} as Record<string, string>;

  if (req.query.redirectTo) {
    state['redirect'] = req.query.redirectTo as string;
  }

  console.log(state);

  return passport.authenticate(req.params.provider, {
    session: false,
    scope: ['profile'],
    state: JSON.stringify(state),
  })(req, res, next);
});

router.post('/:provider/refresh', async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.body.refreshToken;
  const settings = await Settings.findOne({}, 'openID');
  const provider = getProviderByName(settings, req.params.provider);

  try {
    const newTokens = await _refreshToken(provider.client_id, provider.client_secret, provider.token_url, refreshToken);

    const userData = await getUserData(provider.userinfo_url, newTokens['token']);

    const token = await issueLocalToken(userData);

    return res.json({
      status: 200,
      message: {
        token: token,
        refreshToken: newTokens['refreshToken'],
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      error: 'Unable to refresh tokens.',
    });
  }
});

router.post('/:provider/logout', async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.refreshToken) {
    return res.json({
      error: 'No refresh token given',
    });
  }
  const tokenInfo = permissions.decodeToken(req.body.refreshToken);

  try {
    await User.findOneAndUpdate({
      idpLinkID: tokenInfo.sub,
    }, {
      lastLogout: Date.now(),
    });
  } catch (err) {
    console.log(err);
    console.log('Unable to revoke past sessions.');
  }

  // TODO: Request logout to IDP

});

// TODO: Add global logout support

export default router;

import express, { NextFunction, Request, Response, Router } from 'express';

import passport from 'passport';
import OAuthStrategy, { VerifyCallback } from 'passport-oauth2';
import { logResponse } from '../services/logger';
import {
  getUserData,
  handleLogout,
  handleRefresh,
  issueLocalToken, pushTokenset,   retrieveTokenset
} from '../controller/AuthController';
import Settings from '../models/settings/Settings';
import syncMailingLists from '../services/mailer/syncMailingLists';

const router: Router = express.Router();

router.use(passport.initialize());

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
  console.log('Unable to fetch provider configuration!', err);
});

router.get('/:provider/callback', (req: Request, res: Response, next: NextFunction) => {
  try {
    return passport.authenticate(req.params.provider, async function(err: any, data: any) {
      if (err) {
        console.log(err);
        return res.send({
          error: 'Error',
        });
      }

      let state = {} as Record<string, string>;

      try {
        state = JSON.parse(req.query.state as string);
      } catch (ignored) {
        // ignore
      }

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

      const tokensetID = await pushTokenset(token, data.refreshToken);

      if (state.redirect) {
        const redirectURL = new URL(state.redirect);
        if (settings['openID'].permittedRedirectHosts.indexOf(redirectURL.host) !== -1) {
          redirectURL.searchParams.set('tokensetID', tokensetID);

          return res.redirect(redirectURL.toString());
        } else {
          return res.json({
            error: 'Host not in allowed redirect hosts!',
          });
        }
      }
      else {
        if(process.env.NODE_ENV === 'development'){
          console.log("Authentication successful but no redirect, printing tokens: ", {
            localToken: token,
            kcToken: data.token,
            refreshToken: data.refreshToken
          });
        }
      }

      return res.json({
        status: 200,
        message: "Authentication succeeded but no redirect URL provided.",
        tokensetID: tokensetID
      });

    })(req, res, next);
  }
  catch(err) {
    return res.status(400).json({
      status: 400,
      error: 'Unable to initialize authentication.'
    });
  }
});

router.get('/:provider/login', (req: Request, res: Response, next: NextFunction) => {
  const state = {} as Record<string, string>;

  if (req.query.redirectTo) {
    state['redirect'] = req.query.redirectTo as string;
  }

  try {
    return passport.authenticate(req.params.provider, {
      session: false,
      scope: ['profile'],
      state: JSON.stringify(state),
    })(req, res, next);
  }
  catch(err) {
    return res.status(400).json({
      status: 400,
      error: 'Unable to initialize authentication.'
    });
  }

});

router.post('/:provider/refresh',  (req: Request, res: Response) => {
  logResponse(
      req,
      res,
      handleRefresh(req.params.providerName, req.body.refreshToken)
  )
});

router.post('/:provider/logout', (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    handleLogout(req.params.providerName, req.body.refreshToken),
    true
  )
});

router.get('/:provider/tokenset', (req:Request, res:Response) => {
  logResponse(
      req,
      res,
      retrieveTokenset(req.query.tokensetID as string)
  )
})

export default router;

import express, { Request, Response, Router } from 'express';

import User from '../models/user/User';
import syncMailingLists from '../services/mailer/syncMailingLists';
import { fetchSAMLBundle, fetchSP } from '../services/multisaml';

import * as permissions from '../services/permissions';

const router: Router = express.Router();

// Endpoint to retrieve metadata
router.get('/:provider/metadata.xml', async (req: Request, res: Response) => {
  const sp = await fetchSP(req.params.provider.toLowerCase());
  res.type('application/xml');
  res.send(sp.create_metadata());
});

// Starting point for login
router.get('/:provider/login', async (req: Request, res: Response) => {
  const { sp, idp } = await fetchSAMLBundle(req.params.provider.toLowerCase());
  sp.create_login_request_url(idp, {}, (err: Error | null, login_url: string) => {
    if (err != null)
      return res.send(500).json({
        status: 500,
        message: 'Internal Server Error',
      });

    return res.json({
      loginUrl: login_url,
    });
  });
});

// Assert endpoint for when login completes
router.post('/:provider/acs', async (req: Request, res: Response) => {
  const options = { request_body: req.body };
  const { sp, idp } = await fetchSAMLBundle(req.params.provider.toLowerCase());
  sp.post_assert(idp, options, async (err, saml_response) => {
    if (err != null) {
      console.log(err);
      return res.send(500).json({
        status: 500,
        message: 'Internal Server Error',
      });
    }

    console.log(saml_response);

    if (saml_response.type == 'logout_request') {
      /*
      logout_request is called when a logout is generated from another application.
      We need to destroy the user's session on our end and redirect back to the IDP.
       */

      //definition is wrong for this type
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const name_id = saml_response.name_id;
      // const session_index = saml_response.user.session_index;

      // remote slo logout, revoke all tokens issued before now
      try {
        await User.findOneAndUpdate({
          samlNameID: name_id,
        }, {
          lastLogout: Date.now(),
        });

      } catch (e) {
        console.log(e);
        console.log('Unable to revoke past sessions.');
      }

      sp.create_logout_response_url(idp, {
        in_response_to: saml_response.response_header.id,
      }, (error: Error | null, response_url: string) => {
        return res.redirect(response_url);
      });

    } else if (saml_response.type == 'logout_response') {
      // finished logging out of all applications
      // res.redirect("/finishLogout");
      return res.json({
        status: 'OK',
      });
    } else {
      // Receives the IDP's response after an authentication request.
      const name_id = saml_response.user.name_id;
      const assertAttributes = saml_response.user.attributes;

      // IDP did not send enough data, probably forgot to set up mappers.
      if (!assertAttributes.email || !assertAttributes.firstName || !assertAttributes.lastName) {
        throw Error('Missing SAML fields.');
      }

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

        const token = permissions.createJwt({
          id: userInfo._id,
          samlNameID: name_id,
          samlSessionIndex: saml_response.user.session_index,
          roles: userInfo.roles,
        });

        // Trigger a mailing list sync
        syncMailingLists(undefined, true, userInfo.email)
        .then(() => {
          console.log(`Synced mailing list for ${userInfo.email}`);
        })
        .catch((e) => {
          console.log(`Unable to sync mailing list for ${userInfo.email}`, e);
        });

        return res.json({
          token: token,
        });
      } catch (e) {
        console.log('Error logging user in.');
        console.log(e);
      }

    }
  });
});

// Starting point for logout
router.post('/:provider/logout', async (req: Request, res: Response) => {
  if (!req.body.token) {
    return res.status(400).json({
      status: 400,
      message: 'Bad request',
    });
  }

  const { sp, idp } = await fetchSAMLBundle(req.params.provider.toLowerCase());

  const tokenInfo = permissions.verifyToken(req.body.token);

  sp.create_logout_request_url(idp, {
    name_id: tokenInfo.samlNameID,
    session_index: tokenInfo.samlSessionIndex,
  }, (err: Error | null, logout_url: string) => {
    if (err != null)
      return res.send(500).json({
        status: 500,
        message: 'Internal Server Error',
      });

    return res.json({
      logoutUrl: logout_url,
    });
  });
});
export default router;

/**
 * Model dependent API endpoints
 */

import express, { Request, Response } from 'express';
import { getObject } from '../controller/ModelController';
import { logResponse } from '../services/logger';
import { isHacker } from '../services/permissions';
import { ErrorMessage } from '../types/types';

const actionRouter = express.Router();

/**
 * (Hacker)
 *
 * Get hacker profile
 */
actionRouter.get('/profile', isHacker,(req: Request, res: Response) => {
  getObject(req.executor,
    "user",
    {
      filter: {
        _id: req.executor._id
      },
      size: "1"
    },
    (error: ErrorMessage, data: any) => {

      let result: any;

      if (!error) {
        // We only want the first result, if any
        result = data[0];

        if (!result) {
          error = {
            code: 500,
            message: "Unable to fetch user profile"
          }
        }
      }

      logResponse(req, res)(error, result);
    }
  );
});

/**
 * TODO: Add endpoint to submit application
 *
 *       /submit -> validates submission and locks application
 */

/**
 * TODO: Add endpoint to RSVP
 *
 *       /rsvp -> triggers sequence of events to reserve spot and invite to discord
 */

/**
 * TODO: Add endpoint for discord verification
 *       Make this a separate model and link it back to the user object
 *
 *       /verify -> given an email, determine if it can be verified and return roles to give + name
 *                  When a user RSVPs, create a DiscordObj for them
 *
 *       DiscordObj
 *       |-Full Name
 *       |-roles
 *       |-discord username
 *       |-discord ID
 *       |-time of verification
 */

/**
 * TODO: Add team apis
 *
 *       /create -> create a new team and join it
 *       /join -> join an existing team
 *       /leave -> leave team
 *
 *       TeamObj
 *       |-team code
 *       |-team member IDs
 *       |-inject team member names (virtual field?)
 */

/**
 * TODO: Add endpoint for application statistics that is cached
 */


/**
 * TODO: Add endpoint to submit code for badge
 *       To be done later once plan is finalized
 */

/**
 * TODO: Add endpoint to sync mailing lists
 */

/**
 * TODO: Add endpoint to release admission statuses
 */

/**
 * TODO: Add endpoint to assign admission status (admitted, rejected, waitlisted, etc)
 */

export default actionRouter;

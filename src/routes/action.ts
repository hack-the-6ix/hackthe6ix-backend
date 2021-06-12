/**
 * Model dependent API endpoints
 */

import express, { Request, Response } from 'express';
import { fetchUser, updateApplication, updateResume } from '../controller/UserController';
import { logResponse } from '../services/logger';
import { isHacker } from '../services/permissions';
import mongoose from '../services/mongoose_service'
  ;
const actionRouter = express.Router();

// Application endpoints

/**
 * (Hacker)
 *
 * Get hacker profile
 */
actionRouter.get('/profile', isHacker, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    fetchUser(req.executor),
  );
});

/**
 * (Hacker)
 *
 * Submit/Save hacker application
 */
actionRouter.post('/updateapp', isHacker, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    updateApplication(
      req.executor,
      req.body.submit,
      req.body.application,
    ),
  );
});

/**
 * (Hacker)
 *
 * Submit resume
 */
actionRouter.put('/updateResume', isHacker, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    updateResume(
      req.executor,
      (req as any)?.files?.resume,
      mongoose
    ),
  );
});

/**
 * TODO: Add endpoint to RSVP
 *
 *       /rsvp -> triggers sequence of events to reserve spot and invite to discord
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

// Post application endpoints

/**
 * TODO: Add endpoint to submit code for badge
 *       To be done later once plan is finalized
 */

// Admin endpoints

/**
 * TODO: Add endpoint for application statistics that is cached
 */


/**
 * TODO: Add endpoint to sync mailing lists
 */

/**
 * TODO: Add endpoint to release admission statuses
 */

/**
 * TODO: Add endpoint to assign admission status based on score (admitted, rejected, waitlisted, etc)
 */

/**
 * TODO: Endpoint to fetch a random application to review
 *
 *       Actually, just keep an array of scores and compute the average at the end.
 *       If two people coincidentally get the same user, then let multiple people evaluate
 *       and take the average.
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


export default actionRouter;

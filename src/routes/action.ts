/**
 * Model dependent API endpoints
 */

import express, { Request, Response } from 'express';
import { createTeam, getTeam, joinTeam, leaveTeam } from '../controller/TeamController';
import {
  fetchUser,
  getEnumOptions,
  updateApplication,
  updateResume,
} from '../controller/UserController';
import { logResponse } from '../services/logger';
import mongoose from '../services/mongoose_service';
import { isHacker, isOrganizer } from '../services/permissions';
import { getStatistics } from '../services/statistics';

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
      mongoose,
    ),
  );
});

/**
 * (Hacker)
 *
 * Fetch hacker application enum options
 */
actionRouter.get('/applicationEnums', isHacker, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    getEnumOptions(),
  );
});

/**
 * (Hacker)
 *
 * Create team
 */
actionRouter.post('/createTeam', isHacker, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    createTeam(
      req.executor,
    ),
  );
});

/**
 * (Hacker)
 *
 * Join team
 */
actionRouter.post('/joinTeam', isHacker, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    joinTeam(
      req.executor,
      req.body.teamCode,
    ),
  );
});

/**
 * (Hacker)
 *
 * Leave team
 */
actionRouter.post('/leaveTeam', isHacker, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    leaveTeam(
      req.executor,
    ),
  );
});

/**
 * (Hacker)
 *
 * Get team
 */
actionRouter.get('/getTeam', isHacker, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    getTeam(
      req.executor,
    ),
  );
});

/**
 * TODO: Add endpoint to RSVP
 *
 *       /rsvp -> triggers sequence of events to reserve spot and invite to discord
 */


// Post application endpoints

/**
 * TODO: Add endpoint to submit code for badge
 *       To be done later once plan is finalized
 */

// Admin endpoints

/**
 * (Organizer)
 *
 * Statistics
 */
actionRouter.get('/getStatistics', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    getStatistics(req?.query?.update.toString().toLowerCase() === 'true')
  )
});

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

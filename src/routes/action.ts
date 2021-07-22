/**
 * Model dependent API endpoints
 */

import express, { Request, Response } from 'express';
import { createTeam, getTeam, joinTeam, leaveTeam } from '../controller/TeamController';
import {
  advanceWaitlist,
  assignAdmissionStatus,
  fetchUser,
  getCandidate,
  getEnumOptions,
  getRanks,
  gradeCandidate,
  releaseApplicationStatus,
  rsvp,
  updateApplication,
  updateResume,
} from '../controller/UserController';
import { logResponse } from '../services/logger';
import sendAllTemplates from '../services/mailer/sendAllTemplates';
import sendTemplateEmail from '../services/mailer/sendTemplateEmail';
import syncMailingLists from '../services/mailer/syncMailingLists';
import verifyMailingList from '../services/mailer/verifyMailingList';
import mongoose from '../services/mongoose_service';
import { isAdmin, isHacker, isOrganizer } from '../services/permissions';
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
    true,
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
    true,
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
    true,
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
    true,
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
    true,
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
 * (Hacker)
 *
 * Confirm whether or not they will be attending.
 */
actionRouter.post('/rsvp', isHacker, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    rsvp(
      req.executor,
      req.body.rsvp,
    ),
    true,
  );
});


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
    getStatistics(req?.query?.update?.toString()?.toLowerCase() === 'true'),
  );
});

/**
 * (Admin)
 *
 * Sync mailing lists
 */
actionRouter.post('/syncMailingLists', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    syncMailingLists(
      req.body.mailingLists,
      req.body.forceUpdate,
      req.body.email,
    ),
    true,
  );
});

/**
 * (Admin)
 *
 * Verify mailing lists
 */
actionRouter.post('/verifyMailingList', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    verifyMailingList(
      req.executor,
    ),
    true,
  );
});

/**
 * (Admin)
 *
 * Send singular email
 */
actionRouter.post('/sendEmail', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    sendTemplateEmail(
      req.body.email,
      req.body.templateName,
      req.body.tags,
    ),
    true,
  );
});

/**
 * (Admin)
 *
 * Send an email using every available template to the requesting user
 */
actionRouter.post('/templateTest', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    sendAllTemplates(
      req.executor,
    ),
    true,
  );
});

/**
 * (Admin)
 *
 * Set application released status to true for all users who have been either waitlisted, accepted, or rejected
 */
actionRouter.post('/releaseApplicationStatus', isAdmin, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    releaseApplicationStatus(),
    true,
  );
});

/**
 * (Organizer)
 *
 * Get a list of applied users in descending order of computed score
 */
actionRouter.get('/getRanks', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    getRanks(),
    true,
  );
});

/**
 * (Admin)
 *
 * Change the status of the top waitlisted users to accepted until the number of accepted users reaches
 * the cap.
 */
actionRouter.post('/advanceWaitlist', isAdmin, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    advanceWaitlist(),
    true,
  );
});

/**
 * (Admin)
 *
 * Assign the application status to users using the grading algorithm.
 */
actionRouter.post('/assignApplicationStatus', isAdmin, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    assignAdmissionStatus(),
    true,
  );
});

/**
 * (Organizer)
 *
 * Fetch a random applicant to review
 */
actionRouter.get('/getCandidate', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    getCandidate(req.executor, req.query.category as string),
  );
});

/**
 * (Organizer)
 *
 * Assign a grade to an applicant
 */
actionRouter.post('/gradeCandidate', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    gradeCandidate(
      req.executor,
      req.body.candidateID,
      req.body.grade,
    ),
    true,
  );
});


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

/**
 * Model dependent API endpoints
 */

import express, { Request, Response } from 'express';
import assignAdmissionStatus from '../controller/applicationStatus/assignApplicationStatus';
import getRanks from '../controller/applicationStatus/getRanks';
import { createAPIToken } from '../controller/AuthController';
import { fetchUserByDiscordID, verifyDiscordUser } from '../controller/DiscordController';
import { recordJoin, recordLeave } from '../controller/MeetingController';
import { createTeam, getTeam, joinTeam, leaveTeam } from '../controller/TeamController';
import {
  fetchUser,
  getCandidate,
  getEnumOptions,
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
    getRanks(
      req.query.usePersonalScore === 'true',
    ),
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
    assignAdmissionStatus(
      req.body.legit,
      req.body.waitlistOver,
      req.body.waitlistDeadline,
    ),
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
 * (Organizer)
 *
 * Associate a user on Discord
 */
actionRouter.post('/verifyDiscord', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    verifyDiscordUser(req.body.email, req.body.discordID, req.body.discordUsername),
  );
});

/**
 * (Organizer)
 *
 * Associate a user on Discord
 */
actionRouter.get('/getUserByDiscordID', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    fetchUserByDiscordID(req.query.discordID as string),
  );
});


/**
 * (Organizer)
 *
 * Create an API token for programmatic access
 */
actionRouter.post('/createAPIToken', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    createAPIToken(req.executor, req.body.groups, req.body.description),
  );
});


/**
 * (Organizer)
 *
 * Record someone joining a meeting
 */
actionRouter.post('/recordMeetingJoin', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    recordJoin(req.body.meetingID, req.body.userID, req.body.time || Date.now()),
  );
});

/**
 * (Organizer)
 *
 * Record someone leaving a meeting
 */
actionRouter.post('/recordMeetingLeave', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    recordLeave(req.body.meetingID, req.body.userID, req.body.time || Date.now()),
  );
});
export default actionRouter;

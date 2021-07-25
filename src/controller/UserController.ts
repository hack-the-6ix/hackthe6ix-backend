import { Mongoose } from 'mongoose';
import { systemUser } from '../consts';
import Team from '../models/team/Team';
import { enumOptions } from '../models/user/enums';
import { fields, IApplication, IUser } from '../models/user/fields';
import User from '../models/user/User';
import { canConfirm, isConfirmationOpen } from '../models/validator';
import sendTemplateEmail from '../services/mailer/sendTemplateEmail';
import syncMailingLists from '../services/mailer/syncMailingLists';
import { WriteCheckRequest } from '../types/checker';
import {
  BadRequestError,
  DeadlineExpiredError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  RSVPRejectedError,
  SubmissionDeniedError,
} from '../types/errors';
import { MailTemplate } from '../types/mailer';
import { IRSVP } from '../types/types';
import { writeGridFSFile } from './GridFSController';
import { editObject, getObject } from './ModelController';
import { testCanUpdateApplication, validateSubmission } from './util/checker';
import { fetchUniverseState, getModels } from './util/resources';


/**
 * Fetch a sanitized user profile of the requester
 */
export const fetchUser = async (requestUser: IUser) => {
  const data = await getObject(
    requestUser,
    'user',
    {
      filter: {
        _id: requestUser._id,
      },
      size: '1',
    },
  );

  if (!data || data.length !== 1) {
    throw new NotFoundError('User not found');
  }

  return data[0] as IUser;
};

/**
 * Updates a user's hacker application and optionally marks it as submitted
 *
 * @param requestUser
 * @param submit
 * @param hackerApplication
 */
export const updateApplication = async (requestUser: IUser, submit: boolean, hackerApplication: IApplication) => {

  const hackerApplicationFields = getModels()['user'].rawFields.FIELDS.hackerApplication;

  if (!hackerApplication) {
    throw new BadRequestError('Application must be truthy!');
  }

  const universeState = await fetchUniverseState();

  const writeRequest: WriteCheckRequest<any, IUser> = {
    requestUser: requestUser,
    targetObject: requestUser,
    submissionObject: {
      hackerApplication: hackerApplication,
    } as IUser,
    universeState: universeState,
    fieldValue: undefined,
  };

  // We will pass in our own writeRequest, so user can be null
  await testCanUpdateApplication(null, writeRequest);

  // If the user intends to submit, we will verify that all required fields are correctly filled
  if (submit) {
    const invalidFields: string[][] = validateSubmission(hackerApplication, hackerApplicationFields, writeRequest, '');

    if (invalidFields.length > 0) {
      throw new SubmissionDeniedError(invalidFields);
    }
  }

  // We will update the fields as requested
  // NOTE: The check for whether a user is eligible to submit (i.e. if it's within the deadline, etc. is done within the write check)
  const result = await editObject(
    requestUser,
    'user',
    {
      _id: requestUser._id,
    },
    {
      hackerApplication: hackerApplication,
    },
  );

  if (!result || result.length !== 1 || result[0] != requestUser._id.toString()) {
    throw new InternalServerError('Unable to update application', JSON.stringify(result));
  }

  // Lastly, if the user intends to submit we will amend their user object with the new status
  // We will directly interface with the User model since this update will be done with "admin permissions"
  const statusUpdateResult = await User.findOneAndUpdate({
    _id: requestUser._id,
  }, {
    'status.applied': !!submit,
    'hackerApplication.lastUpdated': new Date().getTime(),
  });

  if (!statusUpdateResult) {
    throw new InternalServerError('Unable to update status');
  }

  if (submit) {
    await syncMailingLists(undefined, true, requestUser.email);
    await sendTemplateEmail(requestUser.email, MailTemplate.applied);
  }

  return 'Success';
};

/**
 * Update resume on file. Only pdf files under 5MB will be allowed.
 *
 * Reference: https://stackoverflow.com/questions/16482233/store-file-in-mongos-gridfs-with-expressjs-after-upload
 *
 * @param requestUser
 * @param expressFile - express fileupload file object
 * @param mongoose - instance of mongoose to extract connection from
 */
export const updateResume = async (requestUser: IUser, expressFile: any, mongoose: Mongoose) => {
  if (!expressFile) {
    throw new BadRequestError('Invalid file');
  }

  // Make sure user is allowed to edit their app
  await testCanUpdateApplication(requestUser);

  // Ensure file is within limit
  // NOTE: There is another limit set when express-fileupload is initialized in index.ts
  if (expressFile.size > 5000000) {
    throw new ForbiddenError('File exceeds 5MB');
  }

  // Ensure file type is correct
  if (expressFile.mimetype !== 'application/pdf') {
    throw new ForbiddenError('Invalid file type! Must be PDF');
  }

  const filename = `${requestUser._id}-resume.pdf`;

  await writeGridFSFile(filename, mongoose, expressFile);

  // Save new resume id to DB
  await User.findOneAndUpdate({
    _id: requestUser._id,
  }, {
    'hackerApplication.resumeFileName': filename,
  });

  return 'Success';
};

/**
 * Gets the valid enum values for the hacker application
 */
export const getEnumOptions = async () => enumOptions;

/**
 * Updates the user's RSVP state
 *
 * @param requestUser
 * @param rsvp
 */
export const rsvp = async (requestUser: IUser, rsvp: IRSVP) => {

  const universeState = await fetchUniverseState();
  const writeRequest = {
    requestUser: requestUser,
    targetObject: requestUser,
    submissionObject: {} as any,
    universeState: universeState,
    fieldValue: undefined as any,
  };

  if (!isConfirmationOpen(writeRequest)) {
    throw new DeadlineExpiredError('The RSVP deadline has passed!');
  }

  if (requestUser.status.statusReleased && requestUser.status.accepted && !requestUser.status.declined) {

    const isAttending = !!rsvp.attending;

    await User.findOneAndUpdate({
      _id: requestUser._id,
    }, {
      'status.confirmed': isAttending,
      'status.declined': !isAttending,
    });

    /**
     * TODO: Invite them to discord
     */

    await syncMailingLists(undefined, true, requestUser.email);

    if (isAttending) {
      await sendTemplateEmail(requestUser.email, MailTemplate.confirmed);
    } else {
      await sendTemplateEmail(requestUser.email, MailTemplate.declined);
    }

    return 'Success';
  } else {
    throw new RSVPRejectedError();
  }
};

/**
 * Fetch a random applicant that hasn't been graded yet. Note that it is possible
 * for a candidate to be fetched by multiple reviewers simultaneously if the stars
 * align. We handle this by averaging out the scores.
 *
 * @param requestUser
 * @param category - application score category to filter by (only results matching this category
 *                   will be available). If omitted, all categories are considered.
 */
export const getCandidate = async (requestUser: IUser, category?: string) => {
  const criteria: any = { $or: [] };

  if (category) {
    const query: any = {
      'status.applied': true,
    };

    // We have an exception for the portfolio question, which is that the user must
    // not be a first time hacker
    if (category === 'portfolio') {
      query['hackerApplication.hackathonsAttended'] = {
        $ne: enumOptions.hackathonsAttended[0],
      };
    }

    query[`internal.applicationScores.${category}.score`] = -1;

    criteria['$or'].push(query);
  } else {

    // We'll review this user as long as one of their category is ungraded
    for (const c in fields.FIELDS.internal.FIELDS.applicationScores.FIELDS) {
      const query: any = {
        'status.applied': true,
      };

      query[`internal.applicationScores.${c}.score`] = -1;
      criteria['$or'].push(query);
    }
  }

  const userCount = await User.countDocuments(criteria);

  if (userCount > 0) {
    const offset = 1 + Math.floor(Math.random() * userCount);

    return (await getObject(requestUser, 'user', {
      filter: criteria,
      size: '1',
      page: offset.toString(),
    }))[0];
  } else {
    throw new NotFoundError('No applications to review');
  }
};

/**
 * Adds the reviewer's assessment of this user's application to their profile.
 *
 * @param requestUser
 * @param targetUserID
 * @param grade
 */
export const gradeCandidate = async (requestUser: IUser, targetUserID: string, grade: any) => {

  if (!targetUserID) {
    throw new BadRequestError('Invalid candidate ID');
  }

  if (!grade) {
    throw new BadRequestError('Invalid grade');
  }

  const user: IUser = await User.findOne({
    _id: targetUserID,
  });

  if (!user) {
    throw new NotFoundError('Candidate not found');
  }

  if (!user.status.applied || user.status.accepted || user.status.waitlisted || user.status.rejected) {
    throw new ForbiddenError('Candidate is not eligible to be graded');
  }

  const changes: any = {};

  for (const category in grade) {

    if (category in user.internal.applicationScores) {
      const score = parseInt(grade[category]);

      if (!isNaN(score)) {
        changes[`internal.applicationScores.${category}.score`] = score;
        changes[`internal.applicationScores.${category}.reviewer`] = requestUser._id.toString();
      } else {
        throw new BadRequestError(`Could not parse score ${grade[category]} for category "${category}`);
      }
    } else {
      throw new ForbiddenError(`Grading category "${category}" not found!`);
    }
  }

  await User.findOneAndUpdate(
    {
      _id: targetUserID,
    },
    changes,
  );
  return 'Success';
};


/**
 * Set application released status to true for all users who have been either waitlisted, accepted, or rejected
 */
export const releaseApplicationStatus = async () => {
  const filter = {
    'status.statusReleased': false,
    $or: [
      {
        'status.waitlisted': true,
      },
      {
        'status.accepted': true,
      },
      {
        'status.rejected': true,
      },
    ],
  };

  const usersModified = (await User.find(filter)).map((u: IUser) => u._id.toString());

  await User.updateMany(filter, {
    'status.statusReleased': true,
  });

  await syncMailingLists(null, true);

  return usersModified;
};

/**
 * Export a list of users who have applied in descending order by grade
 *
 * @param usePersonalApplicationScore - when true, users are sorted by their individual scores,
 *                                      without any adjustment from their team
 */
export const getRanks = async (usePersonalApplicationScore?: boolean) => {
  const sortCriteria = usePersonalApplicationScore
    ? 'computedApplicationScore'
    : 'computedFinalApplicationScore';

  const users = await Promise.all((await User.find({
    'status.applied': true,
  })).map(async (user: IUser) => {
    // We will inject the team score at this point
    // This isn't done at the user object level to prevent recursive dependencies

    const jsonUser: IUser = user.toJSON() as IUser;
    const teamCode = jsonUser?.hackerApplication?.teamCode;

    let teamScore = -1;

    if (teamCode) {
      const team = await Team.findOne({ code: teamCode });

      if (team?.teamScore !== undefined) {
        teamScore = team.teamScore;
      }
    }

    jsonUser.internal.computedFinalApplicationScore = Math.max(teamScore, jsonUser.internal.computedApplicationScore);

    return jsonUser;
  }));

  return users
  .sort((a: IUser, b: IUser) => {
    const diff = b.internal[sortCriteria] - a.internal[sortCriteria];

    if (diff === 0) {
      // If the scores are the same, the tiebreaker is whoever submitted earlier
      return a.hackerApplication.lastUpdated - b.hackerApplication.lastUpdated;
    } else {
      return diff;
    }
  });
};

/**
 * Runs the grading algorithm to assign admission states
 *
 * NOTE: Once people are marked "accepted", their spot cannot be revoked (at least not easily), so
 *       be very careful running this!
 *
 * @param legit - when true, we write the changes to disk
 */
export const assignAdmissionStatus = async (legit?: boolean) => {

  const universeState = await fetchUniverseState();

  const userCanConfirm = (user: IUser) => canConfirm()({
    requestUser: systemUser,
    targetObject: user,
    universeState: universeState,
    fieldValue: undefined,
    submissionObject: undefined,
  });

  // A user is in a "dead state" if this predicate is false
  const userEligible = (user: IUser) =>
    (!(user.status.accepted || user.status.waitlisted) || userCanConfirm(user) || user.status.confirmed) && // Users who have confirmed, can confirm, or haven't been assigned a state can still potentially attend
    !user.status.rejected && !user.status.declined; // If a user is rejected or declined, they're out

  const rawRankedUsers = await getRanks();

  const rankedUsers = rawRankedUsers.filter(userEligible);

  const dead: IUser[] = rawRankedUsers.filter((user: IUser) => !userEligible(user));
  const accepted: IUser[] = [];
  const rejected: IUser[] = [];
  const waitlisted: IUser[] = [];

  let budgetAccepted = universeState.private.maxAccepted;
  let budgetWaitlisted = universeState.private.maxWaitlist;

  // First pass is to check how many slots we have left to allocate
  for (const user of rankedUsers) {
    if (user.status.accepted) {
      budgetAccepted--;
    }
    if (user.status.waitlisted) {
      budgetWaitlisted--;
    }
  }

  // TODO: Add function to dynamically update the running budget
  // TODO: Only write to database if legit is true
  // Remember to increment the waitlist budget if the user is moved to accepted

  const acceptUser = async (user: IUser, personalDeadline?: number) => {

  };
  const rejectUser = async (user: IUser) => {
  };
  const waitlistUser = async (user: IUser) => {
  };

  // Now, we will do a second pass and accept + waitlist as many people as we can
  // At this point, all the users should either be eligible to confirm (we'll leave them alone),
  // confirmed (we'll leave them alone), waitlisted (we'll try to admit them if possible), or
  // not assigned a score (we'll try to give them a state).
  for (const user of rankedUsers) {
    // We don't watch to touch people who are currently accepted or confirmed
    if (!user.status.accepted && !user.status.confirmed) {

      if (user.status.waitlisted) {
        // Try to move people from waitlisted -> accepted

        if (budgetAccepted > 0) {
          // TODO: Set a new personal deadline one week from now, or whatever the admin specifies
          await acceptUser(user, -1);
        }

      } else {
        // This user has not been assigned a state
        // Try to accept or waitlist people who haven't been assigned a state

        if (budgetAccepted > 0) {
          await acceptUser(user);
        } else if (budgetWaitlisted > 0) {
          await waitlistUser(user);
        } else {
          await rejectUser(user);
        }
      }
    }
  }

  await syncMailingLists(null, true);

  return { dead, accepted, rejected, waitlisted };
};

import { Mongoose } from 'mongoose';
import { enumOptions, IApplication, IUser } from '../models/user/fields';
import User from '../models/user/User';
import { isConfirmationOpen } from '../models/validator';
import { sendTemplateEmail } from '../services/mailer';
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
import { Templates } from '../types/mailer';
import { IRSVP } from '../types/types';
import { writeGridFSFile } from './GridFSController';
import { editObject, getObject } from './ModelController';
import { testCanUpdateApplication, validateSubmission } from './util/checker';
import { fetchUniverseState, getModels } from './util/resources';

/**
 * TODO: When a user changes states (e.g. goes from not applied -> applied, we need to update their mailing list status)
 *       However, be sure to only update based on the public facing status
 */

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
  if (submit) {
    // We will directly interface with the User model since this update will be done with "admin permissions"
    const statusUpdateResult = await User.findOneAndUpdate({
      _id: requestUser._id,
    }, {
      'status.applied': true,
    });

    if (!statusUpdateResult) {
      throw new InternalServerError('Unable to update status');
    }

    await sendTemplateEmail(requestUser, Templates.applied);
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

  if (requestUser.status.accepted && !requestUser.status.declined) {
    /**
     * TODO: Invite them to discord
     */

    const isAttending = !!rsvp.attending;

    await User.findOneAndUpdate({
      _id: requestUser._id,
    }, {
      'status.confirmed': isAttending,
      'status.declined': !isAttending,
    });

    if (isAttending) {
      await sendTemplateEmail(requestUser, Templates.confirmed);
    } else {
      await sendTemplateEmail(requestUser, Templates.declined);
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
 */
export const getCandidate = async (requestUser: IUser) => {
  const criteria = {
    $or: [
      {
        'status.applied': true,
        'internal.applicationScores': {
          $size: 0,
        },
      },
      {
        'status.applied': true,
        'internal.applicationScores': null as any,
      },
    ],
  };

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

  const parsedGrade = parseInt(grade);

  if (grade === undefined || isNaN(parsedGrade)) {
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

  if (user?.internal?.reviewers.indexOf(requestUser._id.toString()) !== -1) {
    throw new ForbiddenError('You have already graded this candidate!');
  }

  await User.findOneAndUpdate({
    _id: targetUserID,
  }, {
    $push: {
      'internal.applicationScores': parsedGrade,
      'internal.reviewers': requestUser._id.toString(),
    },
  });
  return 'Success';
};

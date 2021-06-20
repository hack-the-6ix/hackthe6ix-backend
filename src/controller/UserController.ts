import Grid from 'gridfs-stream';
import { Mongoose } from 'mongoose';
import stream from 'stream';
import { enumOptions, IApplication, IUser } from '../models/user/fields';
import User from '../models/user/User';
import { isConfirmationOpen } from '../models/validator';
import { sendTemplateEmail } from '../services/mailer';
import { Templates } from '../types/mailer';
import {
  BadRequestError,
  DeadlineExpiredError,
  ForbiddenError,
  InternalServerError,
  IRSVP,
  NotFoundError,
  RSVPRejectedError,
  SubmissionDeniedError,
  WriteCheckRequest,
} from '../types/types';
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

  return data[0];
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

  const gfs = Grid(mongoose.connection.db, mongoose.mongo);
  const filename = `${requestUser._id}-resume.pdf`;

  // Delete existing resume
  await new Promise((resolve, reject) => {
    gfs.exist({ filename: filename }, (err: any, found: any) => {
      if (err) {
        return reject(err);
      }

      gfs.remove({ filename: filename }, (err: any) => {
        if (err) {
          return reject(err);
        }

        resolve('Success!');
      });
    });
  });

  const fileReadStream = new stream.PassThrough();
  fileReadStream.end(Buffer.from(expressFile.data));

  // Save new resume
  const gridWriteStream = gfs.createWriteStream({
    filename: filename,
  });
  fileReadStream.pipe(gridWriteStream);

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

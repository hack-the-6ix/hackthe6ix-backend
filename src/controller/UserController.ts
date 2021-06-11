import Grid from 'gridfs-stream';
import mongoose from 'mongoose';
import stream from 'stream';
import { database } from '../consts';
import { IApplication, IUser } from '../models/user/fields';
import User from '../models/user/User';
import { canUpdateApplication, isApplicationOpen, isApplied } from '../models/validator';
import {
  AlreadySubmittedError,
  BadRequestError,
  DeadlineExpiredError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  SubmissionDeniedError,
  WriteCheckRequest,
} from '../types/types';
import { editObject, getObject } from './ModelController';
import { validateSubmission } from './util/checker';
import { fetchUniverseState, getModels } from './util/resources';

// We have to make another mongoose connection for gridFS to work
mongoose.connect(database, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

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
 * Throws an error if the user cannot update their application.
 */
const testCanUpdateApplication = async (writeRequest: WriteCheckRequest<any, any>) => {
  if (!canUpdateApplication()(writeRequest)) {
    if (isApplied(writeRequest)) {
      throw new AlreadySubmittedError('You have already applied!');
    } else if (!isApplicationOpen(writeRequest)) {
      throw new DeadlineExpiredError('The submission deadline has passed!');
    }
    {
      throw new ForbiddenError('User is not eligible to submit');
    }
  }
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

  const writeRequest: any = {
    requestUser: requestUser,
    targetObject: requestUser,
    submissionObject: {
      hackerApplication: hackerApplication,
    },
    universeState: universeState,
    fieldValue: undefined,
  };

  await testCanUpdateApplication(writeRequest);

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
 */
export const updateResume = async (requestUser: IUser, expressFile: any) => {

  if (!expressFile) {
    throw new BadRequestError('Invalid file');
  }

  const universeState = await fetchUniverseState();

  const writeRequest: any = {
    requestUser: requestUser,
    targetObject: requestUser,
    submissionObject: {},
    universeState: universeState,
    fieldValue: undefined,
  };

  // Make sure user is allowed to edit their app
  await testCanUpdateApplication(writeRequest);

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

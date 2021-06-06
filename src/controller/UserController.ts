import { IApplication, IUser } from '../models/user/fields';
import { BadRequestError, InternalServerError } from '../types/types';
import { editObject, getObject } from './ModelController';

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

  if (!data) {
    throw new InternalServerError('Unable to fetch user');
  }

  return data[0];
};

/**
 * Validates a submitted application against all the required fields in the application
 */
const validateApplication = (application: IApplication) => {

  /**
   * TODO: Implement this
   */

  return { success: true, errors: [] as string[] };
};

export const updateApplication = async (requestUser: IUser, submit: boolean, application: IApplication) => {

  if (!application) {
    throw new BadRequestError('Application must be truthy!');
  }

  // If the user intends to submit, we will verify that all required fields are correctly filled
  if (submit) {
    const validationResult = validateApplication(application);

    if (!validationResult.success) {
      throw new BadRequestError(`Submission is invalid: ${validationResult.errors.join(', ')}`);
    }
  }

  // We will update the fields as requested
  // NOTE: The check for whether a user is eligible to submit (i.e. if it's within the deadline, etc. is done within the write check)
  await editObject(
    requestUser,
    'user',
    {
      _id: requestUser._id,
    },
    {
      hackerApplication: application,
    },
  );

  // Lastly, if the user intends to submit we will amend their user object with the new status
  if (submit) {
    // TODO: Implement this too
  }

  return 'Success';
};

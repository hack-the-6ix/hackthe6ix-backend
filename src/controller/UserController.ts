import { hackerApplication, IApplication, IUser } from '../models/user/fields';
import User from '../models/user/User';
import { BadRequestError, InternalServerError, NotFoundError } from '../types/types';
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

  if (!data || data.length !== 1) {
    throw new NotFoundError('User not found');
  }

  return data[0];
};

/**
 * Validates a submitted application against all the required fields in the application
 */
const validateApplication = (application: IApplication, applicationFields: any) => {

  /**
   * TODO: Implement this
   *       Recursively go through all the fields to ensure the conditions are satisfied
   */

  return { success: true, errors: [] as string[] };
};

/**
 * Updates a user's hacker application and optionally marks it as submitted
 *
 * @param requestUser
 * @param submit
 * @param application
 */
export const updateApplication = async (requestUser: IUser, submit: boolean, application: IApplication) => {

  if (!application) {
    throw new BadRequestError('Application must be truthy!');
  }

  // If the user intends to submit, we will verify that all required fields are correctly filled
  if (submit) {
    validateApplication(application, hackerApplication);
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
      hackerApplication: application,
    },
  );

  if (!result || result.length !== 1 || result[0] != requestUser._id) {
    throw new InternalServerError("Unable to update application", JSON.stringify(result));
  }

  // Lastly, if the user intends to submit we will amend their user object with the new status
  if (submit) {
    // We will directly interface with the User model since this update will be done with "admin permissions"
    const statusUpdateResult = await User.findOneAndUpdate({
      _id: requestUser._id
    }, {
      "status.applied": true
    });

    if (!statusUpdateResult) {
      throw new InternalServerError("Unable to update status");
    }
  }

  return 'Success';
};
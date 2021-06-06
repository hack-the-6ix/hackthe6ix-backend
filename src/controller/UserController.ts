import { IApplication, IUser } from '../models/user/fields';
import { Callback, ErrorMessage } from '../types/types';
import { editObject } from './ModelController';

/**
 * Validates a submitted application against all the required fields in the application
 */
const validateApplication = (application: IApplication) => {

  /**
   * TODO: Implement this
   */

  return { success: true, errors: [] as string[] };
};

export const updateApplication = async (requestUser: IUser, submit: boolean, application: IApplication, callback: Callback) => {

  if (!application) {
    return callback({
      status: 400,
      message: "Bad Request - Application is empty"
    });
  }

  // If the user intends to submit, we will verify that all required fields are correctly filled
  if (submit) {
    const validationResult = validateApplication(application);

    if (!validationResult.success) {
      return callback({
        status: 400,
        message: `Bad Request - Submission is invalid: ${ validationResult.errors.join(', ') }`
      });
    }
  }

  // We will update the fields as requested
  // NOTE: The check for whether a user is eligible to submit (i.e. if it's within the deadline, etc. is done within the write check)
  await editObject(
    requestUser,
    "user",
    {
      _id: requestUser._id
    },
    {
      hackerApplication: application
    },
    (error: ErrorMessage, data: any) => {
      if (error) {
        return callback(error);
      }

    }
  );

  // Lastly, if the user intends to submit we will amend their user object with the new status
  if (submit) {
    // TODO: Implement this too
  }

  return callback(null, "Success");
};

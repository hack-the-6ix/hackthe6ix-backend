import { IUser } from '../../models/user/fields';
import { canUpdateApplication, isApplicationOpen, isApplied } from '../../models/validator';
import {
  CreateCheckRequest,
  DeleteCheckRequest,
  ReadCheckRequest,
  WriteCheckRequest,
} from '../../types/checker';
import { AlreadySubmittedError, DeadlineExpiredError, ForbiddenError } from '../../types/errors';

/**
 * Evaluates checkerFunction if it's executable, otherwise returns if it is strictly true.
 */
export const evaluateChecker = (checkerFunction: any, request: ReadCheckRequest<any> | WriteCheckRequest<any, any> | CreateCheckRequest<any, any> | DeleteCheckRequest<any>) => {
  try {
    return checkerFunction(request);
  } catch (e) {
    if (e.toString().includes('is not a function')) {
      return checkerFunction === true;
    }

    throw e;
  }
};

/**
 * Runs a writeCheck and submitCheck (if available) against some field/dictionary/thing
 */
const submissionChecker = (context: any, request: WriteCheckRequest<any, any>) =>
  context.submitCheck
    ? evaluateChecker(context.submitCheck, request)
    : evaluateChecker(context.writeCheck, request);

/**
 * Validates a submitted application against all the required fields in the application. This checker
 * will verify that ALL of the fields in submissionFields have their write condition and submit condition (if applicable) satisfied
 *
 * @param submission - subset of submission object
 * @param submissionFields - subset of submission fields
 * @param request
 * @param path - current path up to this point
 * @param name - optionally specify the name of the current level (most useful for nested dictionaries)
 * @return array of errors
 */
export const validateSubmission = (submission: any, submissionFields: any, request: WriteCheckRequest<any, any>, path: string, name?: string): string[][] => {

  let errors: string[][] = [];

  if (submissionChecker(submissionFields, request)) {

    for (const k of Object.keys(submissionFields.FIELDS)) {
      const fieldMetadata = submissionFields.FIELDS[k];

      // Virtual fields cannot be overwritten, so we do not check them
      if (fieldMetadata.FIELDS !== undefined) {
        // More recursion
        errors = [
          ...errors,
          ...validateSubmission(
            submission[k],
            fieldMetadata,
            request,
            `${path}/${k}`,
            k,
          ),
        ];

      } else {
        // This is a normal field
        if (!submissionChecker(fieldMetadata, { ...request, fieldValue: submission[k] })) {
          errors.push([`${path}/${k}`, fieldMetadata?.caption || k]);
        }
      }

    }

  } else {
    // Failed at a nest
    errors.push([`${path}/`, name]);
  }

  return errors;
};

export const escapeStringRegexp = (x: string) => {
  return x
  .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
  .replace(/-/g, '\\x2d');
};

/**
 * Throws an error if the user cannot update their application.
 */
export const testCanUpdateApplication = async (requestUser: IUser) => {
  if (!canUpdateApplication(requestUser)) {
    if (isApplied(requestUser)) {
      throw new AlreadySubmittedError('You have already applied!');
    } else if (!isApplicationOpen(requestUser)) {
      throw new DeadlineExpiredError('The submission deadline has passed!');
    } else {
      throw new ForbiddenError('User is not eligible to submit');
    }
  }
};

/**
 * Throws an error if the user cannot update their application.
 */
export const testCanUpdateTeam = async (requestUser: IUser) => {
  if (!isApplicationOpen(requestUser)) {
    throw new DeadlineExpiredError('The submission deadline has passed!');
  }
};

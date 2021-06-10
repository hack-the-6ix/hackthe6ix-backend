import {
  CreateCheckRequest,
  DeleteCheckRequest,
  ReadCheckRequest,
  WriteCheckRequest,
} from '../../types/types';

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
  (context.virtual || evaluateChecker(context.writeCheck, request)) && // We will skip the write check if a field is virtual
  (context.submitCheck === undefined || evaluateChecker(context.submitCheck, request));

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
            k
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

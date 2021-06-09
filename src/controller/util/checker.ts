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
const submissionChecker = (context: any, request: WriteCheckRequest<any, any>) => evaluateChecker(context.writeCheck, request) && (context.submitCheck === undefined || evaluateChecker(context.submitCheck, request));

/**
 * Validates a submitted application against all the required fields in the application. This checker
 * will verify that ALL of the fields in submissionFields have their write condition and submit condition (if applicable) satisfied
 *
 * @return array of errors
 */
export const validateSubmission = (submission: any, submissionFields: any, request: WriteCheckRequest<any, any>, path: string): string[] => {

  let errors: string[] = [];

  if (submissionChecker(submissionFields, request)) {

    for (const k of Object.keys(submissionFields.FIELDS)) {
      const fieldMetadata = submissionFields.FIELDS[k];

      if (fieldMetadata.FIELDS !== undefined) {
        // More recursion
        errors = [
          ...errors,
          ...validateSubmission(
            submission[k],
            fieldMetadata,
            request,
            `${path}/${k}`,
          ),
        ];

      } else {
        // This is a normal field
        if (!submissionChecker(fieldMetadata, { ...request, fieldValue: submission[k] })) {
          errors.push(`${path}/${k}`);
        }
      }
    }

  } else {
    // Failed at a nest
    errors.push(`${path}/`);
  }

  return errors;
};

export const escapeStringRegexp = (x: string) => {
  return x
  .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
  .replace(/-/g, '\\x2d');
};

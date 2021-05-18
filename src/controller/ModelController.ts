import userFields from '../models/user/fields';
import User from '../models/user/User';
import { getInTextSearchableFields } from '../models/util';
import { Callback, ReadCheckRequest, UniverseState, WriteCheckRequest } from '../types/types';

const models = {
  user: {
    mongoose: User,
    rawFields: userFields,
  },
};

/**
 * Evaluates checkerFunction if it's executable, otherwise returns if it is strictly true.
 */
const evaluateChecker = (checkerFunction: any, request: ReadCheckRequest | WriteCheckRequest<any>) => {
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
 * Recursively traverses the schema fields + permission checker and the object in parallel
 * to filter out data that should not appear in the output.
 *
 * @param rawField - fields interlaced with read/write checkers at each level
 * @param object
 * @param request
 */
const cleanObject = (rawFields: any, object: any, request: ReadCheckRequest) => {

  const out: any = {};

  if (!rawFields || !object) {
    throw Error('Field or object is not truthy!');
  }

  // If the user cannot read fields at this level, we don't need to check any further
  if (evaluateChecker(rawFields.readCheck, request)) {

    for (const k of Object.keys(rawFields.FIELDS)) {

      const fieldMetadata = rawFields.FIELDS[k];

      if (fieldMetadata) {
        if (fieldMetadata.FIELDS !== undefined) {
          // This is another nested dictionary, so we can recurse
          out[k] = cleanObject(fieldMetadata, object[k], request);

        } else {
          // This is just a regular field, so we'll check to make sure we have access to that field

          if (evaluateChecker(fieldMetadata.readCheck, request)) {

            // Handle read interceptor
            if (!fieldMetadata.readInterceptor) {
              out[k] = object[k];
            } else {
              out[k] = fieldMetadata.readInterceptor({
                fieldValue: object[k],
                ...request,
              });
            }
          }
        }
      }
    }
  }

  return out;
};

export const escapeStringRegexp = (x: string) => {
  return x
  .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
  .replace(/-/g, '\\x2d');
};

/**
 * Fetch an object with mongo query
 *
 * WARNING: Only allow admins/trusted users to access this function. It may be possible to have
 *          arbitrary code execution if care is not taken.
 *
 * @param requestUser
 * @param objectTypeName
 * @param query - { page: number, size: number, sortField?: string, sortCriteria?: string, text?: string, filter?: any }
 * @param callback
 */
export const getObject = async (requestUser: any, objectTypeName: string, query: any, callback: Callback) => {

  // Fetch metadata about the universe first that might be necessary for making validation decisions
  // e.g. whether applications are currently open, etc.
  const universeState: UniverseState = {
    globalApplicationOpen: true,
  };

  // Since this function can handle any model type, we must fetch the mongoose schema first
  const objectModel: any = (models as any)[objectTypeName];

  if (objectModel === undefined) {
    return callback({
      code: 400,
      message: 'Invalid Object Type',
    });
  }

  // Sanitize data before sending it out into the world
  try {

    if (!query) {
      return callback({
        code: 400,
        message: 'Invalid request! Must specify page and size!',
      });
    }

    if (!query.page || query.page <= 0) {
      return callback({
        code: 400,
        message: 'Invalid request! Page must be >= 1!',
      });
    }

    if (!query.size || query.size <= 0) {
      return callback({
        code: 400,
        message: 'Invalid request! Size must be >= 1!',
      });
    }

    const page = parseInt(query.page);
    const size = parseInt(query.size);

    const filters: any = query.filter || {};
    const and: { [k: string]: RegExp }[] = [];
    const or: { [k: string]: RegExp }[] = [];

    // Sort
    const sort: any = {};
    if (query.sortField && query.sortCriteria) {
      sort[query.sortField] = query.sortCriteria;
    }

    // In text search
    const text = query.text;
    if (text) {
      const regex = new RegExp(escapeStringRegexp(text), 'i'); // filters regex chars, sets to case insensitive

      const inTextSearchFields = getInTextSearchableFields(objectModel.rawFields);

      // Apply regex against fields with in text search
      for (const f of inTextSearchFields) {
        const textQuery: any = {};

        textQuery[f] = regex;

        or.push(textQuery);
      }
    }

    if (or && or.length) {
      if ('$or' in filters) {
        filters['$or'].concat(or);
      } else {
        filters['$or'] = or;
      }
    }

    if (and && and.length) {
      if ('$and' in filters) {
        filters['$and'].concat(and);
      } else {
        filters['$and'] = and;
      }
    }

    const results = await objectModel.mongoose.find(filters)
    .sort(sort)
    .skip((page - 1) * size)
    .limit(size);

    const out: any[] = [];

    // Perform all the traversals async
    const cleanedResults = await Promise.all(results.map(async (result: any) =>
      /**
       * TODO: Check if this acc runs async
       * @param result
       */

      cleanObject(objectModel.rawFields, result, {
        requestUser: requestUser,
        targetObject: result,
        universeState: universeState,
      }),
    ));

    for (const cleanedResult of cleanedResults) {
      // Only push it into the output if there is any data left
      if (cleanedResult && Object.keys(cleanedResult).length > 0) {
        out.push(cleanedResult);
      }
    }

    return callback(null, out);
  } catch (e) {
    return callback({
      code: 500,
      message: 'An error occurred',
      stacktrace: e.toString(),
    });
  }
};

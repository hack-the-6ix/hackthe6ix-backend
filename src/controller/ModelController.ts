import { fields as settingsFields } from '../models/settings/fields';
import Settings from '../models/settings/Settings';
import { fields as userFields, IUser } from '../models/user/fields';
import User from '../models/user/User';
import { getInTextSearchableFields } from '../models/util';
import {
  Callback,
  CreateCheckRequest,
  CreateDeniedException,
  DeleteCheckRequest,
  DeleteDeniedException,
  ReadCheckRequest,
  UniverseState,
  WriteCheckRequest,
  WriteDeniedException,
} from '../types/types';

const models = {
  user: {
    mongoose: User,
    rawFields: userFields,
  },
  settings: {
    mongoose: Settings,
    rawFields: settingsFields,
  },
};

/**
 * Fetch metadata about the universe first that might be necessary for making validation decisions
 * e.g. whether applications are currently open, etc.
 *
 * TODO: Update this with actual state
 */
const fetchUniverseState = async (): Promise<UniverseState> => {
  return {
    globalApplicationOpen: true,
  };
};

/**
 * Evaluates checkerFunction if it's executable, otherwise returns if it is strictly true.
 */
export const evaluateChecker = (checkerFunction: any, request: ReadCheckRequest | WriteCheckRequest<any> | CreateCheckRequest<any> | DeleteCheckRequest) => {
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
 * WARNING: Only allow admins/trusted users to have unfiltered access this function. It may be possible to have
 *          arbitrary code execution if care is not taken.
 *
 * @param requestUser
 * @param objectTypeName
 * @param query - { page?: number, size?: number, sortField?: string, sortCriteria?: 'asc' | 'desc', text?: string, filter?: any }
 * @param callback
 */
export const getObject = async (
  requestUser: IUser,
  objectTypeName: string,
  query: {
    page?: string,
    size?: string,
    sortField?: string,
    sortCriteria?: 'asc' | 'desc',
    text?: string,
    filter?: any
  }, callback: Callback) => {

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
        message: 'Invalid request! Must specify page and size in query!',
      });
    }

    // Default to page 1
    if (query.page === undefined) {
      query.page = "1";
    }

    // Default to a query size of 10k
    if (query.size === undefined) {
      query.size = "10000";
    }

    const page = query.page ? parseInt(query.page) : -1;
    const size = query.size ? parseInt(query.size) : -1;

    if (page <= 0 || !page) {
      return callback({
        code: 400,
        message: 'Invalid request! Page must be >= 1!',
      });
    }

    if (size <= 0 || !size) {
      return callback({
        code: 400,
        message: 'Invalid request! Size must be >= 1!',
      });
    }

    const filters: any = query.filter || {};
    const and: { [k: string]: RegExp }[] = [];
    const or: { [k: string]: RegExp }[] = [];

    // Sort
    const sort: any = {};

    if (query.sortCriteria && !['asc', 'desc'].includes(query.sortCriteria)) {
      return callback({
        code: 400,
        message: 'Invalid sort criteria! Must be asc or desc!!',
      });
    }

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
        universeState: await fetchUniverseState(),
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

const validateObjectEdit = (rawFields: any, changes: any, request: WriteCheckRequest<any>) => {
  if (!rawFields || !changes) {
    throw Error('Field or object is not truthy!');
  }

  // If the user cannot write fields at this level, we don't need to check any further
  // We also cannot write to virtual fields
  if (evaluateChecker(rawFields.writeCheck, request) && !rawFields.virtual) {
    for (const k of Object.keys(changes)) {
      const fieldMetadata = rawFields.FIELDS[k];

      if (fieldMetadata) {
        if (fieldMetadata.FIELDS !== undefined) {
          // Nested object; Recurse
          validateObjectEdit(fieldMetadata, changes[k], request);

        } else {
          // Top level field

          if (!evaluateChecker(fieldMetadata.writeCheck, { ...request, fieldValue: changes[k] })) {
            // Validation failed for this field
            throw new WriteDeniedException(`Write check failed at field: ${JSON.stringify(fieldMetadata)} with policy ${fieldMetadata.writeCheck}`);
          }

        }
      } else {
        // Invalid field
        throw new WriteDeniedException(`Invalid field: ${k}`);
      }
    }

    return true;
  } else {
    // Validation Failed
    throw new WriteDeniedException(`Write check failed at level: ${JSON.stringify(changes)} with policy ${rawFields.writeCheck}`);
  }
};

/**
 * Fetch an object with mongo query
 *
 * WARNING: Only allow admins/trusted users to have unfiltered access this function. It may be possible to have
 *          arbitrary code execution if care is not taken.
 *
 * @param requestUser
 * @param objectTypeName
 * @param filter - filter map (same format as query selector for find())
 * @param changes - map of fields to update
 * @param callback
 */
export const editObject = async (requestUser: IUser, objectTypeName: string, filter: any, changes: any, callback: Callback) => {

  // Since this function can handle any model type, we must fetch the mongoose schema first
  const objectModel: any = (models as any)[objectTypeName];

  if (objectModel === undefined) {
    return callback({
      code: 400,
      message: 'Invalid Object Type',
    });
  }

  if (filter === undefined) {
    return callback({
      code: 400,
      message: 'Invalid filter',
    });
  }

  if (changes === undefined) {
    return callback({
      code: 400,
      message: 'Invalid changes',
    });
  }

  try {
    const amendedIDs: string[] = [];

    // Validate the proposed amendments
    const results = await objectModel.mongoose.find(filter);

    await Promise.all(results.map(async (result: any) =>
      validateObjectEdit(objectModel.rawFields, changes, {
        requestUser: requestUser,
        targetObject: result,
        universeState: await fetchUniverseState(),
        fieldValue: undefined,
      }),
    ));

    // Keep track of IDs that were affected
    for (const o of Object.keys(results)) {
      amendedIDs.push(results[o]._id);
    }

    // Changes accepted and are made
    await objectModel.mongoose.updateMany(
      filter,
      changes,
    );

    return callback(null, amendedIDs);

  } catch (e) {
    if (e instanceof WriteDeniedException) {
      return callback({
        code: 401,
        message: 'Write check violation!',
        stacktrace: e.toString(),
      });
    } else {
      return callback({
        code: 500,
        message: 'An error occurred',
        stacktrace: e.toString(),
      });
    }
  }
};


const validateObjectDelete = (rawFields: any, request: DeleteCheckRequest) => {
  if (!rawFields) {
    throw Error('Field is not truthy!');
  }

  // For delete operations, we only check the top level
  if (!evaluateChecker(rawFields.deleteCheck, request)) {
    throw new DeleteDeniedException(`Write check failed with policy ${rawFields.deleteCheck}`);
  }

  return true;
};

/**
 * Fetch an object with mongo query
 *
 * WARNING: Only allow admins/trusted users to have unfiltered access this function. It may be possible to have
 *          arbitrary code execution if care is not taken.
 *
 * @param requestUser
 * @param objectTypeName
 * @param filter - filter map (same format as query selector for find())
 * @param callback
 */
export const deleteObject = async (requestUser: IUser, objectTypeName: string, filter: any, callback: Callback) => {
  // Since this function can handle any model type, we must fetch the mongoose schema first
  const objectModel: any = (models as any)[objectTypeName];

  if (objectModel === undefined) {
    return callback({
      code: 400,
      message: 'Invalid Object Type',
    });
  }

  if (filter === undefined) {
    return callback({
      code: 400,
      message: 'Invalid filter',
    });
  }

  try {
    const amendedIDs: string[] = [];

    // Validate the proposed amendments
    const results = await objectModel.mongoose.find(filter);

    await Promise.all(results.map(async (result: any) =>
      validateObjectDelete(objectModel.rawFields, {
        requestUser: requestUser,
        targetObject: result,
        universeState: await fetchUniverseState(),
      }),
    ));

    // Keep track of IDs that were affected
    for (const o of Object.keys(results)) {
      amendedIDs.push(results[o]._id);
    }

    // Changes accepted and are made
    await objectModel.mongoose.deleteMany(
      filter,
    );

    return callback(null, amendedIDs);

  } catch (e) {
    if (e instanceof DeleteDeniedException) {
      return callback({
        code: 401,
        message: 'Delete check violation!',
        stacktrace: e.toString(),
      });
    } else {
      return callback({
        code: 500,
        message: 'An error occurred',
        stacktrace: e.toString(),
      });
    }
  }
};

const validateObjectCreate = (rawFields: any, parameters: any, request: CreateCheckRequest<any>) => {
  if (!rawFields || !parameters) {
    throw Error('Field or object is not truthy!');
  }

  // If the user cannot create the object, we don't need to go any further
  if (evaluateChecker(rawFields.createCheck, request)) {

    // Call the edit checker to validate the fields
    validateObjectEdit(rawFields, parameters, {
      ...request,
      targetObject: {}, // The object doesn't exist yet, so we cannot rely on any validation metrics that rely on existing values
    });

  } else {
    throw new CreateDeniedException(`Create check failed with policy ${rawFields.createCheck}`);
  }
};

/**
 * Fetch an object with mongo query
 *
 * WARNING: Only allow admins/trusted users to have unfiltered access this function. It may be possible to have
 *          arbitrary code execution if care is not taken.
 *
 * @param requestUser
 * @param objectTypeName
 * @param parameters - initial parameters to initialize the object
 * @param callback
 * @param additionalObjectModels - any additional models to inject (basically only used for testing)
 */
export const createObject = async (requestUser: IUser, objectTypeName: string, parameters: any, callback: Callback, additionalObjectModels?: any) => {
  // Since this function can handle any model type, we must fetch the mongoose schema first
  const objectModel: any = ({
    ...models,
    ...(additionalObjectModels || {})
  } as any)[objectTypeName];

  if (objectModel === undefined) {
    return callback({
      code: 400,
      message: 'Invalid Object Type',
    });
  }

  if (parameters === undefined) {
    return callback({
      code: 400,
      message: 'Invalid parameters',
    });
  }

  try {

    // Validate the proposed object fields
    validateObjectCreate(objectModel.rawFields, parameters, {
      requestUser: requestUser,
      universeState: await fetchUniverseState(),
      fieldValue: undefined,
    });

    const newObject = await objectModel.mongoose.create(parameters);

    return callback(null, newObject._id);

  } catch (e) {
    if (e instanceof WriteDeniedException) {
      return callback({
        code: 401,
        message: 'Write check violation!',
        stacktrace: e.toString(),
      });
    } else if (e instanceof CreateDeniedException) {
      return callback({
        code: 401,
        message: 'Create check violation!',
        stacktrace: e.toString(),
      });
    } else {
      return callback({
        code: 500,
        message: 'An error occurred',
        stacktrace: e.toString(),
      });
    }
  }
};

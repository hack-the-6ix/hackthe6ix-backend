import { IUser } from '../models/user/fields';
import { getInTextSearchableFields } from '../models/util';
import {
  BadRequestError,
  CreateCheckRequest,
  CreateDeniedError,
  DeleteCheckRequest,
  DeleteDeniedError,
  ReadCheckRequest,
  WriteCheckRequest,
  WriteDeniedError,
} from '../types/types';
import { fetchUniverseState, getModels } from './util';

/**
 * Evaluates checkerFunction if it's executable, otherwise returns if it is strictly true.
 */
export const evaluateChecker = (checkerFunction: any, request: ReadCheckRequest<any> | WriteCheckRequest<any, any> | CreateCheckRequest<any> | DeleteCheckRequest<any>) => {
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
const cleanObject = (rawFields: any, object: any, request: ReadCheckRequest<any>) => {

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

          if (evaluateChecker(fieldMetadata.readCheck, request)) {
            // This is another nested dictionary, so we can recurse
            out[k] = cleanObject(fieldMetadata, object[k], request);
          }

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
  }) => {

  // Since this function can handle any model type, we must fetch the mongoose schema first
  const objectModel: any = (getModels() as any)[objectTypeName];

  if (objectModel === undefined) {
    throw new BadRequestError('Invalid Object Type');
  }

  // Sanitize data before sending it out into the world
  if (!query) {
    throw new BadRequestError('Must specify page and size in query!');
  }

  // Default to page 1
  if (query.page === undefined) {
    query.page = '1';
  }

  // Default to a query size of 10k
  if (query.size === undefined) {
    query.size = '10000';
  }

  const page = query.page ? parseInt(query.page) : -1;
  const size = query.size ? parseInt(query.size) : -1;

  if (page <= 0 || !page) {
    throw new BadRequestError('Page must be >= 1!');
  }

  if (size <= 0 || !size) {
    throw new BadRequestError('Size must be >= 1!');
  }

  const filters: any = query.filter || {};
  const and: { [k: string]: RegExp }[] = [];
  const or: { [k: string]: RegExp }[] = [];

  // Sort
  const sort: any = {};

  if (query.sortCriteria && !['asc', 'desc'].includes(query.sortCriteria)) {
    throw new BadRequestError('Invalid sort criteria! Must be asc or desc!!');
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

  return out;
};

const validateObjectEdit = (rawFields: any, changes: any, request: WriteCheckRequest<any, any>) => {
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
            throw new WriteDeniedError(`Write check failed at field: ${JSON.stringify(fieldMetadata)} with policy ${fieldMetadata.writeCheck}`);
          }

        }
      } else {
        // Invalid field
        throw new WriteDeniedError(`Invalid field: ${k}`);
      }
    }

    return true;
  } else {
    // Validation Failed
    throw new WriteDeniedError(`Write check failed at level: ${JSON.stringify(changes)} with policy ${rawFields.writeCheck}`);
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
 */
export const editObject = async (requestUser: IUser, objectTypeName: string, filter: any, changes: any) => {

  // Since this function can handle any model type, we must fetch the mongoose schema first
  const objectModel: any = (getModels() as any)[objectTypeName];

  if (objectModel === undefined) {
    throw new BadRequestError('Invalid Object type');

  }

  if (filter === undefined) {
    throw new BadRequestError('Invalid filter');
  }

  if (changes === undefined) {
    throw new BadRequestError('Invalid changes');
  }

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

  return amendedIDs;
};


const validateObjectDelete = (rawFields: any, request: DeleteCheckRequest<any>) => {
  if (!rawFields) {
    throw Error('Field is not truthy!');
  }

  // For delete operations, we only check the top level
  if (!evaluateChecker(rawFields.deleteCheck, request)) {
    throw new DeleteDeniedError(`Write check failed with policy ${rawFields.deleteCheck}`);
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
 */
export const deleteObject = async (requestUser: IUser, objectTypeName: string, filter: any) => {
  // Since this function can handle any model type, we must fetch the mongoose schema first
  const objectModel: any = (getModels() as any)[objectTypeName];

  if (objectModel === undefined) {
    throw new BadRequestError('Invalid Object Type');
  }

  if (filter === undefined) {
    throw new BadRequestError('Invalid filter');
  }

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

  return amendedIDs;
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
    throw new CreateDeniedError(`Create check failed with policy ${rawFields.createCheck}`);
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
 */
export const createObject = async (requestUser: IUser, objectTypeName: string, parameters: any) => {
  // Since this function can handle any model type, we must fetch the mongoose schema first
  const objectModel: any = (getModels() as any)[objectTypeName];

  if (objectModel === undefined) {
    throw new BadRequestError('Invalid Object Type');
  }

  if (parameters === undefined) {
    throw new BadRequestError('Invalid parameters');
  }

  // Validate the proposed object fields
  validateObjectCreate(objectModel.rawFields, parameters, {
    requestUser: requestUser,
    universeState: await fetchUniverseState(),
    fieldValue: undefined,
  });

  const newObject = await objectModel.mongoose.create(parameters);

  return newObject._id;
};

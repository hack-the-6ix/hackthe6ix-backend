import * as User from '../models/user/User';
import { Callback } from '../types/types';

const mongooseModels = {
  'user': User,
};

// TODO: Add strict type for requester (object)
export const getObject = async (requester: any, objectTypeName: string, query: any, callback: Callback) => {

  const objectType: any = (mongooseModels as any)[objectTypeName];

  if (objectType === undefined) {
    // Invalid object type

    return callback({
      code: 400,
      message: "Invalid Object Type"
    })
  }

  try {
    const obj = await objectType.find(query);


    /**
     * TODO: Go through and check every field to see if the request has access to it
     */

  } catch (e) {
    return callback({
      code: 500,
      message: e.toString() // TODO: Check if this is secure
    })
  }

};

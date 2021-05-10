import { IUser } from '../models/user/fields';
import * as User from '../models/user/User';
import { Callback } from '../types/types';

const mongooseModels = {
  'user': User,
};

// TODO: Add strict type for requester (object)
export const getObject = async (requester: IUser, objectTypeName: string, query: any, callback: Callback) => {

  // TODO: WE can optimize this by checking if the user even has permission to run this query in the first place

  // TODO: Add pagination, sort, and limit support

  const objectModel: any = (mongooseModels as any)[objectTypeName];

  if (objectModel === undefined) {
    // Invalid object type

    return callback({
      code: 400,
      message: "Invalid Object Type"
    })
  }

  try {
    const obj = await objectModel.find(query);


    /**
     * TODO: Go through and check every field to see if the request has access to it (async)
     */

  } catch (e) {
    return callback({
      code: 500,
      message: e.toString() // TODO: Check if this is secure
    })
  }

};

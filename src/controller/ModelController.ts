import * as userFields from '../models/user/fields';
import * as User from '../models/user/User';
import { Callback } from '../types/types';

const models = {
  'user': {
    'mongoose': User,
    'raw': userFields
  },
};

// TODO: Add strict type for requester (object)
export const getObject = async (requester: IUser, objectTypeName: string, query: any, callback: Callback) => {

  // TODO: WE can optimize this by checking if the user even has permission to run this query in the first place

  // TODO: Add pagination, sort, and limit support

  // TODO: Since organizers do not have an account in the mongo database (only for hackers), we should
  //       generate a "fake" user object for the purposes of creating a WriteCheckRequest
  //
  //       For organizers, use the saml id as the fake mongo _id

  const objectModel: any = (models as any)[objectTypeName];

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

    /**
     * TODO: Go through and verify enums
     */

  } catch (e) {
    return callback({
      code: 500,
      message: e.toString() // TODO: Check if this is secure
    })
  }

};

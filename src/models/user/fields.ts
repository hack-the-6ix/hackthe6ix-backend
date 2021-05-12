import { ReadCheckRequest, WriteCheckRequest } from '../../types/types';
import { userOrAdmin } from './user-states';
import * as mongoose from 'mongoose';
import Document from 'mongoose';
import { userOrAdmin } from './permissions';

const userOrAdmin = (requestUser: any, targetUser: any) => requestUser._id == targetUser._id ||
  requestUser.jwt.roles.admin;

/**
 * TODO: The requestUser.jwt.roles.admin; above is temporary. Change it to match whatever we end up
 *       doing.
 *
 *       We can fetch the request user's profile from their ID using the jwt and inject the jwt data
 *       into that object too so that we can easily access permissions.
 */

// TODO: Add way to fetch valid values for enums

/**
 * Each field has a read and write verifier/validator function that gets called when a read/write
 * operation is attempted. If for any reason one of
 */

// Main application
const hackerApplication = {
  gender: {
    type: String,
    required: true,
    writeCheck: (request: WriteCheckRequest<string>) => ['Male', 'Female', 'Other', 'Prefer not to say'].indexOf(request.value) != -1,
    caption: 'Gender',
    inTextSearch: true,
  },

  pronouns: {
    type: String,
    required: true,
    writeCheck: (request: WriteCheckRequest<string>) => ['He/Him', 'She/Her', 'They/Them', 'Other', 'Prefer not to say'].indexOf(request.value) != -1,
    caption: 'Pronouns',
    inTextSearch: true,
  },

  ethnicity: {
    type: String,
    required: true,
    writeCheck: (request: WriteCheckRequest<string>) => ['Banana'].indexOf(request.value) != -1,
    caption: 'Ethnicity',
    inTextSearch: true,
  },

  wantSwag: {
    type: Boolean,
    required: true,
    caption: 'I live in Canada and want to receive HT6 swag',
  },
};

// User application state
const status = {
  applied: {
    type: Boolean,
    required: true,
    caption: 'Applied',
  },
};

export default {

  /**
   * NOTE: READ/WRITE RULES ARE TESTED OUTSIDE IN.
   *       THIS MEANS THAT IF AN "OUTER" RULE FAILS, WE STOP AND DO NOT
   *       CHECK ANY OF THE INNER ONES
   *
   * Omitted readCheck/writeCheck rules will default to false to be safe (aka always reject)
   */
  writeCheck: (request: WriteCheckRequest<any>) => userOrAdmin(request.requestUser, request.targetUser),
  readCheck: (request: ReadCheckRequest) => userOrAdmin(request.requestUser, request.targetUser),

  // Root fields
  fields: {
    firstName: {
      type: String,
      required: true,
      writeCheck: (request: WriteCheckRequest<string>) => request.value.length <= 50,
      readCheck: (request: ReadCheckRequest) => userOrAdmin(request.requestUser, request.targetUser),
      caption: 'First Name',
      inTextSearch: true,
    },

    lastName: {
      type: String,
      required: true,
      writeCheck: (request: WriteCheckRequest<string>) => request.value.length <= 50,
      caption: 'Last Name',
      inTextSearch: true,
    },

    email: {
      type: String,
      required: true,
      writeCheck: (request: WriteCheckRequest<string>) => request.value.length <= 50,
      caption: 'Email',
      inTextSearch: true,
    },

    lastLogout: {
      type: Number,
      required: true,
      default: 0,
    },

    samlNameID: {
      type: String,
      required: true,
      index: true,
    },

    status: status,

    hackerApplication: hackerApplication,
  }


};

export interface IUser extends mongoose.Document {
  firstName: string,
  lastName: string,
  email: string,
  lastLogout: number,
  samlNameID: string
}

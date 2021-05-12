import { ReadCheckRequest, WriteCheckRequest } from '../../types/types';
import { inEnum, maxLength, userOrAdmin } from './validator';

const userOrAdmin = (requestUser: any, targetUser: any) => requestUser._id == targetUser._id ||
  requestUser.jwt.roles.admin;

/**
 * TODO: The requestUser.jwt.roles.admin; above is temporary. Change it to match whatever we end up
 *       doing.
 *
 *       We can fetch the request user's profile from their ID using the jwt and inject the jwt data
 *       into that object too so that we can easily access permissions.
 */

/**
 * Each field has a read and write verifier/validator function that gets called when a read/write
 * operation is attempted. If for any reason one of
 */

/**
 * TODO: Add interceptor for admission status
 */

// Main application
const hackerApplication = {
  fields: {
    gender: {
      type: String,
      required: true,
      caption: 'Gender',
      inTextSearch: true,

      writeCheck: inEnum(['Male', 'Female', 'Other', 'Prefer not to say']),
      readCheck: true,
    },

    pronouns: {
      type: String,
      required: true,
      caption: 'Pronouns',
      inTextSearch: true,

      writeCheck: inEnum(['He/Him', 'She/Her', 'They/Them', 'Other', 'Prefer not to say']),
      readCheck: true,
    },

    ethnicity: {
      type: String,
      required: true,
      caption: 'Ethnicity',
      inTextSearch: true,

      writeCheck: inEnum(['Banana']),
      readCheck: true,
    },

    wantSwag: {
      type: Boolean,
      required: true,
      caption: 'I live in Canada and want to receive HT6 swag',
    },
  },
};

// User application state
const status = {
  fields: {
    applied: {
      type: Boolean,
      required: true,
      caption: 'Applied',

      writeCheck: false,
      readCheck: true,
    },
  },
};

export default {

  /**
   * NOTE: READ/WRITE RULES ARE TESTED OUTSIDE IN.
   *       THIS MEANS THAT IF AN "OUTER" RULE FAILS, WE STOP AND DO NOT
   *       CHECK ANY OF THE INNER ONES
   *
   * WARNING: THESE RULES CASCADE ACROSS ALL OTHER FIELDS IN THIS MODEL!
   *          CHANGING THEM MAY SIGNIFICANTLY ALTER THE SECURITY OF THE SYSTEM!
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
      caption: 'First Name',
      inTextSearch: true,

      writeCheck: maxLength(64),
      readCheck: true,
    },

    lastName: {
      type: String,
      required: true,
      caption: 'Last Name',
      inTextSearch: true,

      writeCheck: maxLength(64),
      readCheck: true,
    },

    email: {
      type: String,
      required: true,
      caption: 'Email',
      inTextSearch: true,

      writeCheck: maxLength(64),
      readCheck: true,
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
  },


};

export interface IUser extends mongoose.Document {
  firstName: string,
  lastName: string,
  email: string,
  lastLogout: number,
  samlNameID: string
}

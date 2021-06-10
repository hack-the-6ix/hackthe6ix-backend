import mongoose from 'mongoose';
import {
  CreateCheckRequest,
  DeleteCheckRequest,
  ReadCheckRequest,
  WriteCheckRequest,
} from '../../types/types';
import {
  canSubmitApplication,
  inEnum,
  isAdmin,
  isOrganizer,
  isUserOrOrganizer,
  maxLength,
  maxWordLength,
  minLength,
  minWordLength,
  validatePostalCode,
} from '../validator';
import { maskStatus } from './interceptors';

// Main application
export const hackerApplication = {
  writeCheck: canSubmitApplication(),
  readCheck: true,

  FIELDS: {

    /* About You */
    emailConsent: {
      type: Boolean,
      caption: 'Email consent',

      writeCheck: true,
      readCheck: true,
    },

    gender: {
      type: String,
      caption: 'Gender',
      inTextSearch: true,

      writeCheck: inEnum(['Male', 'Female', 'Other', 'Prefer not to say']),
      readCheck: true,
    },

    pronouns: {
      type: String,
      caption: 'Pronouns',
      inTextSearch: true,

      writeCheck: inEnum(['He/Him', 'She/Her', 'They/Them', 'Other', 'Prefer not to say']),
      readCheck: true,
    },

    /**
     * TODO: Update list of ethnicities
     */
    ethnicity: {
      type: String,
      caption: 'Ethnicity',
      inTextSearch: true,

      writeCheck: inEnum(['Banana']),
      readCheck: true,
    },

    /**
     * TODO: Update list of timezones
     */
    timezone: {
      type: String,
      caption: 'Timezone',
      inTextSearch: true,

      writeCheck: inEnum(['Banana']),
      readCheck: true,
    },

    wantSwag: {
      type: Boolean,
      caption: 'I live in Canada and want to receive HT6 swag',

      writeCheck: true,
      readCheck: true,
    },

    /* Address */

    addressLine1: {
      type: String,
      caption: 'Address Line 1',
      inTextSearch: true,

      writeCheck: maxLength(64),
      submitCheck: (request: WriteCheckRequest<string, IUser>) => request.submissionObject.hackerApplication.wantSwag ? minLength(1)(request) : !request.fieldValue, // If they want swag they gotta fill the field, otherwise it should be falsy
      readCheck: true,
    },

    addressLine2: {
      type: String,
      caption: 'Address Line 2',
      inTextSearch: true,

      writeCheck: maxLength(64),
      submitCheck: (request: WriteCheckRequest<string, IUser>) => request.submissionObject.hackerApplication.wantSwag ? true : !request.fieldValue, // If they want swag they can do whatever they want, otherwise it should be falsy
      readCheck: true,
    },

    city: {
      type: String,
      caption: 'City',
      inTextSearch: true,

      writeCheck: maxLength(64),
      submitCheck: (request: WriteCheckRequest<string, IUser>) => request.submissionObject.hackerApplication.wantSwag ? minLength(1)(request) : !request.fieldValue, // If they want swag they gotta fill the field, otherwise it should be falsy
      readCheck: true,
    },

    /**
     * TODO: Upload list of provinces
     */
    province: {
      type: String,
      caption: 'Province',
      inTextSearch: true,

      writeCheck: (request: WriteCheckRequest<string, IUser>) => request.submissionObject.hackerApplication.wantSwag ? inEnum(['Banana'])(request) : !request.fieldValue, // If they want swag they gotta fill the field, otherwise it should be falsu,
      readCheck: true,
    },

    postalCode: {
      type: String,
      caption: 'Postal Code',
      inTextSearch: true,

      writeCheck: maxLength(6),
      submitCheck: (request: WriteCheckRequest<string, IUser>) => request.submissionObject.hackerApplication.wantSwag ? validatePostalCode()(request) : !request.fieldValue, // If they want swag they gotta have a valid postal code, otherwise it should be falsy
      readCheck: true,
    },

    /* Your experience */
    school: {
      type: String,
      caption: 'School',
      inTextSearch: true,

      writeCheck: maxLength(64),
      submitCheck: minLength(1),
      readCheck: true,
    },

    program: {
      type: String,
      caption: 'Program',
      inTextSearch: true,

      writeCheck: maxLength(64),
      submitCheck: minLength(1),
      readCheck: true,
    },

    /**
     * TODO: Update years of study enum
     */
    yearsOfStudy: {
      type: String,
      caption: 'Years of study',
      inTextSearch: true,

      writeCheck: inEnum(['Banana']),
      readCheck: true,
    },

    /**
     * TODO: Update this
     */
    hackathonsAttended: {
      type: String,
      caption: 'Hackathons attended',
      inTextSearch: true,

      writeCheck: inEnum(['Banana']),
      readCheck: true,
    },

    /*
     The main purpose of this field is to fill in the indicator on the frontend
     to let the user know they already submitted a resume.
     */
    resumeFileName: {
      type: String,
      caption: 'Resume',
      inTextSearch: true,

      readCheck: true,
      submitCheck: minLength(1),
      virtual: true,
    },

    resumeSharePermission: {
      type: Boolean,
      caption: 'I allow Hack the 6ix to distribute my resume to its event sponsors',

      writeCheck: true,
      readCheck: true,
    },

    githubLink: {
      type: String,
      caption: 'GitHub',
      inTextSearch: true,

      writeCheck: maxLength(256),
      readCheck: true,
    },

    portfolioLink: {
      type: String,
      caption: 'Portfolio',
      inTextSearch: true,

      writeCheck: maxLength(256),
      readCheck: true,
    },

    linkedinLink: {
      type: String,
      caption: 'LinkedIn',
      inTextSearch: true,

      writeCheck: maxLength(256),
      readCheck: true,
    },

    projectEssay: {
      type: String,
      caption: 'Project Essay',
      inTextSearch: true,

      writeCheck: maxWordLength(2056),
      submitCheck: minWordLength(50),
      readCheck: true,
    },

    /* At HT6 */
    requestedWorkshops: {
      type: String,
      caption: 'Requested Workshops',
      inTextSearch: true,

      writeCheck: maxWordLength(2056),
      readCheck: true,
    },

    accomplishEssay: {
      type: String,
      caption: 'Accomplishment Essay',
      inTextSearch: true,

      writeCheck: maxWordLength(2056),
      submitCheck: minWordLength(50),
      readCheck: true,
    },

    mlhCOC: {
      type: Boolean,
      caption: 'MLH COC',

      writeCheck: true,
      submitCheck: (request: WriteCheckRequest<boolean, IUser>) => request.fieldValue,
      readCheck: true,
    },

    mlhEmail: {
      type: Boolean,
      caption: 'MLH COC',

      writeCheck: true,
      readCheck: true,
    },

    mlhData: {
      type: Boolean,
      caption: 'MLH Data',

      writeCheck: true,
      readCheck: true,
    },
  },
};

// Internal FIELDS; Only organizers can access them
const internal = {

  writeCheck: (request: WriteCheckRequest<any, IUser>) => isOrganizer(request.requestUser),
  readCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),

  FIELDS: {

    notes: {
      type: String,
      default: '',
      caption: 'Organizer Notes',

      writeCheck: true,
      readCheck: true,
    },

    applicationScore: {
      type: Number,
      default: -1,
      caption: 'Application score',

      writeCheck: true,
      readCheck: true,
    },

    reviewer: {
      type: String,
      default: '',
      caption: 'Application Reviewer Email',

      writeCheck: true,
      readCheck: true,
    },

  },

};

// User application state
const status = {

  // Only organizers can modify statuses
  writeCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),
  readCheck: true,

  FIELDS: {
    // Only admins can read this field
    statusReleased: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Status Released',

      writeCheck: true,
      readCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),
    },

    applied: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Applied',

      writeCheck: true,
      readCheck: true,
    },

    accepted: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Accepted',

      writeCheck: true,
      readCheck: true,

      readInterceptor: maskStatus<boolean>(false),
    },

    rejected: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Rejected',

      writeCheck: true,
      readCheck: true,

      readInterceptor: maskStatus<boolean>(false),
    },

    waitlisted: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Waitlisted',

      writeCheck: true,
      readCheck: true,

      readInterceptor: maskStatus<boolean>(false),
    },

    confirmed: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Confirmed',

      writeCheck: true,
      readCheck: true,

      readInterceptor: maskStatus<boolean>(false),
    },

    checkedIn: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Checked In',

      writeCheck: true,
      readCheck: true,

      readInterceptor: maskStatus<boolean>(false),
    },
  },
};

// User roles state
// **
//  These are VIRTUAL fields which are derived from "groups" and include all
//  roles this user has access to (even if the SAML assertion didn't explicitly
//  list all of them, e.g. admin has organizer access implicitly)
// **
const roles = {

  writeCheck: false,
  readCheck: true,
  virtual: true,

  FIELDS: {
    hacker: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Hacker',
      virtual: true,
      readCheck: true,
    },

    admin: {
      type: Boolean,
      required: true,
      default: false,
      virtual: true,
      caption: 'Admin',

      readCheck: true,
    },

    organizer: {
      type: Boolean,
      required: true,
      default: false,
      virtual: true,
      caption: 'Organizer',

      readCheck: true,
    },

    volunteer: {
      type: Boolean,
      required: true,
      default: false,
      virtual: true,
      caption: 'Volunteer',

      readCheck: true,
    },
  },
};

// User groups state
// **
//  These are directly passed in by Keycloak and may not reflect all the
//  roles a user has. Please use the "roles" field fro that
// **
const groups = {

  writeCheck: false,
  readCheck: false,

  FIELDS: {
    hacker: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Hacker',
    },

    admin: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Admin',
    },

    organizer: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Organizer',
    },

    volunteer: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Volunteer',
    },
  },
};

export const fields = {

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
  writeCheck: (request: WriteCheckRequest<any, IUser>) => isUserOrOrganizer(request.requestUser, request.targetObject),
  readCheck: (request: ReadCheckRequest<IUser>) => isUserOrOrganizer(request.requestUser, request.targetObject),

  deleteCheck: (request: DeleteCheckRequest<IUser>) => isAdmin(request.requestUser),
  createCheck: (request: CreateCheckRequest<any, IUser>) => isAdmin(request.requestUser),

  // Root FIELDS
  FIELDS: {
    lastLogout: {
      type: Number,
      required: true,
      caption: 'Last logout',
      default: 0,

      readCheck: false,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser),
    },

    samlNameID: {
      type: String,
      required: true,
      caption: 'SAML Name ID',
      index: true,

      readCheck: false,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser),
    },

    firstName: {
      type: String,
      required: true,
      caption: 'First Name',
      inTextSearch: true,

      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser) && maxLength(64)(request),
      readCheck: true,
    },

    lastName: {
      type: String,
      required: true,
      caption: 'Last Name',
      inTextSearch: true,

      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser) && maxLength(64)(request),
      readCheck: true,
    },

    email: {
      type: String,
      required: true,
      caption: 'Email',
      inTextSearch: true,

      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser) && maxLength(64)(request),
      readCheck: true,
    },

    rsvpDeadline: {
      type: Number,
      required: true,
      caption: 'RSVP Deadline',
      default: -1,

      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser),
      readCheck: true,
    },

    // Some hackers are special and want to apply after the global deadline
    personalApplicationDeadline: {
      type: Number,
      required: true,
      caption: 'Personal Application Deadline',
      default: -1,

      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser),
      readCheck: true,
    },

    roles: roles,
    groups: groups,
    status: status,
    hackerApplication: hackerApplication,
    internal: internal,
  },
};

export interface IUser extends mongoose.Document {
  lastLogout: number,
  samlNameID: string,
  firstName: string,
  lastName: string,
  email: string,
  rsvpDeadline: number,
  personalApplicationDeadline: number,
  roles: { // Virtual field with all "lesser" roles populated
    hacker: boolean,
    admin: boolean,
    organizer: boolean,
    volunteer: boolean
  },
  groups: { // Raw group from KEYCLOAK
    hacker: boolean,
    admin: boolean,
    organizer: boolean,
    volunteer: boolean
  },
  status: {
    statusReleased: boolean,
    applied: boolean,
    accepted: boolean,
    rejected: boolean,
    waitlisted: boolean,
    confirmed: boolean,
    checkedIn: boolean,
  },
  hackerApplication: IApplication,
  internal: {
    notes: string,
    applicationScore: number,
    reviewer: string
  }
}

export interface IApplication {
  emailConsent: boolean,
  gender: string,
  pronouns: string,
  ethnicity: string,
  timezone: string
  wantSwag: boolean,
  addressLine1: string,
  addressLine2: string,
  city: string,
  province: string,
  postalCode: string,
  school: string,
  program: string,
  yearsOfStudy: string,
  hackathonsAttended: string,
  resumeFileName: string,
  resumeSharePermission: boolean,
  githubLink: string,
  portfolioLink: string,
  linkedinLink: string,
  projectEssay: string,
  requestedWorkshops: string,
  accomplishEssay: string,
  mlhCOC: boolean,
  mlhEmail: boolean,
  mlhData: boolean
}

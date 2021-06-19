import mongoose from 'mongoose';
import {
  CreateCheckRequest,
  DeleteCheckRequest,
  ReadCheckRequest,
  WriteCheckRequest,
} from '../../types/types';
import {
  canUpdateApplication,
  inEnum,
  isAdmin,
  isConfirmationOpen,
  isOrganizer,
  isUserOrOrganizer,
  maxLength,
  minLength,
  minWordLength,
  validatePostalCode,
} from '../validator';
import { maskStatus } from './interceptors';

export const enumOptions = {
  gender: ['Male', 'Female', 'Non-Binary', 'Other', 'Prefer not to say'],
  pronouns: ['He/Him', 'She/Her', 'They/Them', 'Other', 'Prefer not to say'],
  ethnicity: [
    'Black/People of African Descent',
    'Arab / Middle Eastern',
    'East Asian (e.g. China, Japan, Korea)',
    'Indigenous Person of Canada',
    'Latinx',
    'Southeast Asian (e.g. India, Pakistan, Sri Lanka)',
    'West Asian (e.g. Afghanistan, Iran)',
    'White / People of European Descent, other, prefer not to answer"',
    'Other',
  ],
  timezone: [
    'MIT - Midway Islands Time (GMT-11:00)',
    'HST - Hawaii Standard Time (GMT-10:00)',
    'AST - Alaska Standard Time (GMT-9:00)',
    'PST - Pacific Standard Time (GMT-8:00)',
    'PNT - Phoenix Standard Time (GMT-7:00)',
    'MST - Mountain Standard Time (GMT-7:00)',
    'CST - Central Standard Time (GMT-6:00)',
    'EST - Eastern Standard Time (GMT-5:00)',
    'IET - Indiana Eastern Standard Time (GMT-5:00)',
    'PRT - Puerto Rico and US Virgin Islands Time (GMT-4:00)',
    'CNT - Canada Newfoundland Time (GMT-3:30)',
    'AGT - Argentina Standard Time (GMT-3:00)',
    'BET - Brazil Eastern Time (GMT-3:00)',
    'CAT - Central African Time (GMT-1:00)',
    'GMT - Greenwich Mean Time (GMT)',
    'UTC - Universal Coordinated Time (GMT)',
    'ECT - European Central Time (GMT+1:00)',
    'EET - Eastern European Time (GMT+2:00)',
    'ART - (Arabic) Egypt Standard Time (GMT+2:00)',
    'EAT - Eastern African Time (GMT+3:00)',
    'MET - Middle East Time (GMT+3:30)',
    'NET - Near East Time (GMT+4:00)',
    'PLT - Pakistan Lahore Time (GMT+5:00)',
    'IST - India Standard Time (GMT+5:30)',
    'BST - Bangladesh Standard Time (GMT+6:00)',
    'VST - Vietnam Standard Time (GMT+7:00)',
    'CTT - China Taiwan Time (GMT+8:00)',
    'JST - Japan Standard Time (GMT+9:00)',
    'ACT - Australia Central Time (GMT+9:30)',
    'AET - Australia Eastern Time (GMT+10:00)',
    'SST - Solomon Standard Time (GMT+11:00)',
    'NST - New Zealand Standard Time (GMT+12:00)',
  ],
  province: [
    'Alberta',
    'British Columbia',
    'Manitoba',
    'New Brunswick',
    'Newfoundland and Labrador',
    'Nova Scotia',
    'Ontario',
    'Prince Edward Island',
    'Quebec',
    'Saskatchewan',
    'Northwest Territories',
    'Nunavut',
    'Yukon',
  ],
  yearsOfStudy: [
    'High School',
    'Undergraduate Year 1',
    'Undergraduate Year 2',
    'Undergraduate Year 3',
    'Undergraduate Year 4+',
    'Graduate School',
    'Recent Graduate',
  ],
  hackathonsAttended: [
    'This is my first one',
    '1',
    '2-3',
    '4-5',
    '6+',
  ],
};

// Main application
export const hackerApplication = {
  writeCheck: canUpdateApplication(),
  readCheck: true,

  FIELDS: {

    // We will set the team code internally
    teamCode: {
      type: String,
      caption: 'Team Code',
      inTextSearch: true,

      readCheck: true,
      writeCheck: false,
      submitCheck: true,
    },


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

      writeCheck: inEnum(enumOptions.gender),
      readCheck: true,
    },

    pronouns: {
      type: String,
      caption: 'Pronouns',
      inTextSearch: true,

      writeCheck: inEnum(enumOptions.pronouns),
      readCheck: true,
    },

    ethnicity: {
      type: String,
      caption: 'Ethnicity',
      inTextSearch: true,

      writeCheck: inEnum(enumOptions.ethnicity),
      readCheck: true,
    },

    timezone: {
      type: String,
      caption: 'Timezone',
      inTextSearch: true,

      writeCheck: inEnum(enumOptions.timezone),
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
      submitCheck: (request: WriteCheckRequest<string, IUser>) => request.submissionObject.hackerApplication.wantSwag
        ? minLength(1)(request) && maxLength(64)(request)
        : !request.fieldValue, // If they want swag they gotta fill the field, otherwise it should be falsy
      readCheck: true,
    },

    addressLine2: {
      type: String,
      caption: 'Address Line 2',
      inTextSearch: true,

      writeCheck: maxLength(64),
      submitCheck: (request: WriteCheckRequest<string, IUser>) => request.submissionObject.hackerApplication.wantSwag
        ? maxLength(64)(request)
        : !request.fieldValue, // If they want swag they can do whatever they want, otherwise it should be falsy
      readCheck: true,
    },

    city: {
      type: String,
      caption: 'City',
      inTextSearch: true,

      writeCheck: maxLength(64),
      submitCheck: (request: WriteCheckRequest<string, IUser>) => request.submissionObject.hackerApplication.wantSwag
        ? minLength(1)(request) && maxLength(64)(request)
        : !request.fieldValue, // If they want swag they gotta fill the field, otherwise it should be falsy
      readCheck: true,
    },

    province: {
      type: String,
      caption: 'Province',
      inTextSearch: true,

      writeCheck: (request: WriteCheckRequest<string, IUser>) => request.submissionObject.hackerApplication.wantSwag
        ? inEnum(enumOptions.province)(request)
        : !request.fieldValue, // If they want swag they gotta fill the field, otherwise it should be falsu,
      readCheck: true,
    },

    postalCode: {
      type: String,
      caption: 'Postal Code',
      inTextSearch: true,

      writeCheck: maxLength(7),
      submitCheck: (request: WriteCheckRequest<string, IUser>) => request.submissionObject.hackerApplication.wantSwag
        ? validatePostalCode()(request)
        : !request.fieldValue, // If they want swag they gotta have a valid postal code, otherwise it should be falsy
      readCheck: true,
    },

    /* Your experience */
    school: {
      type: String,
      caption: 'School',
      inTextSearch: true,

      writeCheck: maxLength(64),
      submitCheck: (request: WriteCheckRequest<string, IUser>) => minLength(1)(request) && maxLength(64)(request),
      readCheck: true,
    },

    program: {
      type: String,
      caption: 'Program',
      inTextSearch: true,

      writeCheck: maxLength(64),
      submitCheck: (request: WriteCheckRequest<string, IUser>) => minLength(1)(request) && maxLength(64)(request),
      readCheck: true,
    },

    yearsOfStudy: {
      type: String,
      caption: 'Years of study',
      inTextSearch: true,

      writeCheck: inEnum(enumOptions.yearsOfStudy),
      readCheck: true,
    },

    hackathonsAttended: {
      type: String,
      caption: 'Hackathons attended',
      inTextSearch: true,

      writeCheck: inEnum(enumOptions.hackathonsAttended),
      readCheck: true,
    },

    // The user cannot directly edit this field, but they can view it
    // We will set this when the user updates their application
    resumeFileName: {
      type: String,
      caption: 'Resume',
      inTextSearch: true,

      readCheck: true,
      writeCheck: false,
      submitCheck: (request: WriteCheckRequest<any, IUser>) => request.targetObject?.hackerApplication?.resumeFileName?.length > 0,
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

      writeCheck: maxLength(2056),
      submitCheck: (request: WriteCheckRequest<string, IUser>) => minWordLength(50)(request) && maxLength(2056)(request),
      readCheck: true,
    },

    /* At HT6 */
    requestedWorkshops: {
      type: String,
      caption: 'Requested Workshops',
      inTextSearch: true,

      writeCheck: maxLength(2056),
      readCheck: true,
    },

    accomplishEssay: {
      type: String,
      caption: 'Accomplishment Essay',
      inTextSearch: true,

      writeCheck: maxLength(2056),
      submitCheck: (request: WriteCheckRequest<string, IUser>) => minWordLength(50)(request) && maxLength(2056)(request),
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

    computedApplicationScore: {
      type: [Number],
      default: -1,
      caption: 'Computed Application score',

      virtual: true,
      readCheck: true,
    },

    applicationScores: {
      type: [Number],
      default: -1,
      caption: 'Application scores',

      writeCheck: true,
      readCheck: true,
    },

    reviewers: {
      type: [String],
      default: '',
      caption: 'Application Reviewer Emails',

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

    declined: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Declined',

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

    // Intercepted fields (virtual fields, but we populate them)
    canApply: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Can Apply',

      virtual: true,
      readCheck: true,

      readInterceptor: (request: ReadCheckRequest<IUser>) => canUpdateApplication()({
        ...request,
        fieldValue: undefined,
        submissionObject: undefined,
      }),
    },
    canConfirm: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Can Confirm',

      virtual: true,
      readCheck: true,

      readInterceptor: (request: ReadCheckRequest<IUser>) => isConfirmationOpen({
        ...request,
        fieldValue: undefined,
        submissionObject: undefined,
      }),
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

    fullName: {
      type: String,
      required: true,
      virtual: true,
      caption: 'Full Name',
      inTextSearch: true,

      readCheck: true,
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

    personalRSVPDeadline: {
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

export interface IRoles { // Virtual field with all "lesser" roles populated
  hacker: boolean,
  admin: boolean,
  organizer: boolean,
  volunteer: boolean
}

export interface IStatus {
  statusReleased?: boolean,
  applied?: boolean,
  accepted?: boolean,
  rejected?: boolean,
  waitlisted?: boolean,
  confirmed?: boolean,
  declined?: boolean,
  checkedIn?: boolean,

  // Intercepted fields (since they require universe state)
  canApply?: boolean,
  canConfirm?: boolean
}

export interface IUser extends mongoose.Document {
  lastLogout: number,
  samlNameID: string,
  fullName: string,
  firstName: string,
  lastName: string,
  email: string,
  personalRSVPDeadline?: number,
  personalApplicationDeadline?: number,
  roles: IRoles,
  groups: IRoles, // Raw group from KEYCLOAK
  status: IStatus,
  hackerApplication: IApplication,
  internal: {
    notes?: string,
    computedApplicationScore?: number,
    applicationScores?: number[],
    reviewers?: string[]
  }
}

export interface IApplication {
  teamCode: string,
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

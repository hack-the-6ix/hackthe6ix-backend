import mongoose from 'mongoose';
import { ReadCheckRequest, WriteCheckRequest } from '../../types/types';
import { maskStatus } from './interceptors';
import { inEnum, isAdmin, isUserOrAdmin, maxLength, minLength, multiInEnum } from './validator';

/**
 * TODO: The requestUser.jwt.roles.isAdmin; above is temporary. Change it to match whatever we end up
 *       doing.
 *
 *       We can fetch the request user's profile from their ID using the jwt and inject the jwt data
 *       into that object too so that we can easily access permissions.
 */

/**
 * TODO: Validate submission
 */

// Main application
const hackerApplication = {

  /**
   * TODO: Add a dynamic way to check for whether or not this user can submit
   */

  writeCheck: (request: WriteCheckRequest<any>) => isAdmin(request.requestUser) || (!request.targetObject.status.applied && request.universeState.globalApplicationOpen),
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
    },

    /* Address */

    addressLine1: {
      type: String,
      caption: 'Address Line 1',
      inTextSearch: true,

      writeCheck: maxLength(64),
      readCheck: true,
    },

    addressLine2: {
      type: String,
      caption: 'Address Line 2',
      inTextSearch: true,

      writeCheck: maxLength(64),
      readCheck: true,
    },

    city: {
      type: String,
      caption: 'City',
      inTextSearch: true,

      writeCheck: maxLength(64),
      readCheck: true,
    },

    /**
     * TODO: Upload list of provinces
     */
    province: {
      type: String,
      caption: 'Province',
      inTextSearch: true,

      writeCheck: inEnum(['Banana']),
      readCheck: true,
    },

    /**
     * TODO: Add postal code validator
     */
    postalCode: {
      type: String,
      caption: 'Postal Code',
      inTextSearch: true,

      writeCheck: maxLength(64),
      readCheck: true,
    },

    /* Your experience */
    school: {
      type: String,
      caption: 'School',
      inTextSearch: true,

      writeCheck: maxLength(64),
      readCheck: true,
    },

    program: {
      type: String,
      caption: 'Program',
      inTextSearch: true,

      writeCheck: maxLength(64),
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

    /**
     * TODO: Update this? Idk what we're doing for resume this year
     */
    resumeLink: {
      type: String,
      caption: 'Resume',
      inTextSearch: true,

      writeCheck: maxLength(256),
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
      caption: 'Proud project',
      inTextSearch: true,

      writeCheck: (request: WriteCheckRequest<string>) => minLength(50)(request) && maxLength(2056)(request),
      readCheck: true,
    },

    /* At HT6 */
    requestedWorkshops: {
      type: [String],
      caption: 'Requested workshop',

      // Cannot select anything other than 3 workshops
      writeCheck: (request: WriteCheckRequest<string[]>) => maxLength(3)(request) && multiInEnum(['banana'])(request),
      readCheck: true,
    },

    attendingEssay: {
      type: String,
      caption: 'Accomplishment',
      inTextSearch: true,

      writeCheck: (request: WriteCheckRequest<string>) => minLength(50)(request) && maxLength(2056)(request),
      readCheck: true,
    },

    mlhCOC: {
      type: Boolean,
      caption: 'MLH COC',

      writeCheck: true,
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

  writeCheck: (request: WriteCheckRequest<any>) => isAdmin(request.requestUser),
  readCheck: (request: ReadCheckRequest) => isAdmin(request.requestUser),

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
  writeCheck: (request: ReadCheckRequest) => isAdmin(request.requestUser),
  readCheck: true,

  FIELDS: {
    // Only admins can read this field
    statusReleased: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Status Released',

      writeCheck: true,
      readCheck: (request: ReadCheckRequest) => isAdmin(request.requestUser),
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
const roles = {

  // Only organizers can modify statuses
  writeCheck: (request: ReadCheckRequest) => isAdmin(request.requestUser),
  readCheck: true,

  FIELDS: {
    hacker: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Hacker',

      writeCheck: true,
      readCheck: true,
    },

    admin: {
      type: Boolean,
      required: true,
      default: false,
      caption: 'Admin',

      writeCheck: true,
      readCheck: true,
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
  writeCheck: (request: WriteCheckRequest<any>) => isUserOrAdmin(request.requestUser, request.targetObject),
  readCheck: (request: ReadCheckRequest) => isUserOrAdmin(request.requestUser, request.targetObject),

  deleteCheck: (request: WriteCheckRequest<any>) => isAdmin(request.requestUser),
  createCheck: (request: WriteCheckRequest<any>) => isAdmin(request.requestUser),

  // Root FIELDS
  FIELDS: {
    lastLogout: {
      type: Number,
      required: true,
      caption: 'Last logout',
      default: 0,

      readCheck: false,
      writeCheck: (request: WriteCheckRequest<string>) => isAdmin(request.requestUser),
    },

    samlNameID: {
      type: String,
      required: true,
      caption: 'SAML Name ID',
      index: true,

      readCheck: false,
      writeCheck: (request: WriteCheckRequest<string>) => isAdmin(request.requestUser),
    },

    firstName: {
      type: String,
      required: true,
      caption: 'First Name',
      inTextSearch: true,

      writeCheck: (request: WriteCheckRequest<string>) => isAdmin(request.requestUser) && maxLength(64)(request),
      readCheck: true,
    },

    lastName: {
      type: String,
      required: true,
      caption: 'Last Name',
      inTextSearch: true,

      writeCheck: (request: WriteCheckRequest<string>) => isAdmin(request.requestUser) && maxLength(64)(request),
      readCheck: true,
    },

    email: {
      type: String,
      required: true,
      caption: 'Email',
      inTextSearch: true,

      writeCheck: (request: WriteCheckRequest<string>) => isAdmin(request.requestUser) && maxLength(64)(request),
      readCheck: true,
    },

    rsvpDeadline: {
      type: Number,
      required: true,
      caption: 'RSVP Deadline',
      default: -1,

      writeCheck: (request: WriteCheckRequest<string>) => isAdmin(request.requestUser),
      readCheck: true,
    },

    // Some hackers are special and want to apply after the global deadline
    personalApplicationDeadline: {
      type: Number,
      required: true,
      caption: 'Personal Application Deadline',
      default: -1,

      writeCheck: (request: WriteCheckRequest<string>) => isAdmin(request.requestUser),
      readCheck: true,
    },

    roles: roles,
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
  roles: {
    hacker: boolean,
    admin: boolean
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
  hackerApplication: {
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
    resumeLink: string,
    githubLink: string,
    portfolioLink: string,
    linkedinLink: string,
    projectEssay: string,
    requestedWorkshops: string[],
    attendingEssay: string,
    mlhCOC: boolean,
    mlhEmail: boolean,
    mlhData: boolean

  },
  internal: {
    notes: string,
    applicationScore: number,
    reviewer: string
  }
}

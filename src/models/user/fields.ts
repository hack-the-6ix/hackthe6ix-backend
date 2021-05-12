import { ReadCheckRequest, WriteCheckRequest } from '../../types/types';
import { inEnum, maxLength, minLength, multiInEnum } from './validator';

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

/**
 * TODO: Validate submission
 */

// Main application
const hackerApplication = {

  /**
   * TODO: Add write check for submitted application
   */

  writeCheck: false,
  readCheck: true,

  fields: {

    /* About You */
    emailConsent: {
      type: Boolean,
      required: false,
      caption: 'Email consent',

      writeCheck: true,
      readCheck: true,
    },

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
      required: false,
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
      required: true,
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
      required: true,
      caption: 'Timezone',
      inTextSearch: true,

      writeCheck: inEnum(['Banana']),
      readCheck: true,
    },

    wantSwag: {
      type: Boolean,
      required: false,
      caption: 'I live in Canada and want to receive HT6 swag',
    },

    /* Address */

    addressLine1: {
      type: String,
      required: false,
      caption: 'Address Line 1',
      inTextSearch: true,

      writeCheck: maxLength(64),
      readCheck: true,
    },

    addressLine2: {
      type: String,
      required: false,
      caption: 'Address Line 2',
      inTextSearch: true,

      writeCheck: maxLength(64),
      readCheck: true,
    },

    city: {
      type: String,
      required: false,
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
      required: false,
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
      required: false,
      caption: 'Postal Code',
      inTextSearch: true,

      writeCheck: maxLength(64),
      readCheck: true,
    },

    /* Your experience */
    school: {
      type: String,
      required: true,
      caption: 'School',
      inTextSearch: true,

      writeCheck: maxLength(64),
      readCheck: true,
    },

    program: {
      type: String,
      required: true,
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
      required: true,
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
      required: true,
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
      required: false,
      caption: 'Resume',
      inTextSearch: true,

      writeCheck: maxLength(256),
      readCheck: true,
    },

    githubLink: {
      type: String,
      required: false,
      caption: 'GitHub',
      inTextSearch: true,

      writeCheck: maxLength(256),
      readCheck: true,
    },

    portfolioLink: {
      type: String,
      required: false,
      caption: 'Portfolio',
      inTextSearch: true,

      writeCheck: maxLength(256),
      readCheck: true,
    },

    linkedinLink: {
      type: String,
      required: false,
      caption: 'LinkedIn',
      inTextSearch: true,

      writeCheck: maxLength(256),
      readCheck: true,
    },

    projectEssay: {
      type: String,
      required: false,
      caption: 'Proud project',
      inTextSearch: true,

      writeCheck: (request: WriteCheckRequest<string>) => minLength(50)(request) && maxLength(2056)(request),
      readCheck: true,
    },

    /* At HT6 */
    hasTeam: {
      type: Boolean,
      required: false,
      caption: 'Has Team',

      writeCheck: true,
      readCheck: true,
    },

    requestedWorkshops: {
      type: [String],
      required: false,
      caption: 'Requested workshop',

      // Cannot select more than 3 workshops
      writeCheck: (request: WriteCheckRequest<string[]>) => maxLength(3)(request) && multiInEnum(['banana'])(request),
      readCheck: true,
    },

    attendingEssay: {
      type: String,
      required: true,
      caption: 'Accomplishment',
      inTextSearch: true,

      writeCheck: (request: WriteCheckRequest<string>) => minLength(50)(request) && maxLength(2056)(request),
      readCheck: true,
    },

    mlhCOC: {
      type: Boolean,
      required: true,
      caption: 'MLH COC',

      writeCheck: true,
      readCheck: true,
    },

    mlhEmail: {
      type: Boolean,
      required: true,
      caption: 'MLH COC',

      writeCheck: true,
      readCheck: true,
    },

    mlhData: {
      type: Boolean,
      required: true,
      caption: 'MLH Data',

      writeCheck: true,
      readCheck: true,
    },
  },
};

// User application state
const status = {
  writeCheck: false,
  readCheck: true,

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
    samlID: {
      type: String,
      required: true,
      caption: 'SAML ID',
      inTextSearch: true,

      readCheck: true,
      writeCheck: false,
    },

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

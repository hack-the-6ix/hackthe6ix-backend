import mongoose from 'mongoose';
// @ts-ignore
// For some reason, the types screwed with our compilation
import mongooseAutopopulate from 'mongoose-autopopulate';
import { extractUniverse } from '../../controller/util/resources';
import { stringifyUnixTime } from '../../util/date';
import { ISettings } from '../settings/fields';
import { extractFields } from '../util';
import {
  canRSVP,
  canUpdateApplication,
  getApplicationDeadline, getApplicationOpen,
  getRSVPDeadline,
  isApplicationExpired,
  isApplicationOpen,
  isRSVPExpired,
  isRSVPOpen,
} from '../validator';
import computeApplicationScore from './computeApplicationScore';
import { fields, IUser } from './fields';

const schema = new mongoose.Schema(extractFields(fields), {
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
  },
});

/**
 * { A: [B, C] }
 * If you have role A, then you also have roles B and C
 *
 * NOTE: Do NOT rely on this to populate roles that have a "depth" greater than 1
 * e.g. {A: [B], B: [C]}
 *      A is NOT guaranteed to get role C if the execution order maps checks B before A,
 *      so always ensure ALL the aliases of the role are given explicitly.
 */
const roleAliases: any = {
  admin: ['organizer', 'volunteer', 'hacker'],
  organizer: ['volunteer'],
};

/**
 * Roles such as Admin are a superset of other roles like Organizer
 * so admins should have all the permissions organizer has.
 *
 * We will use this virtual field to make that true, since the groups sent
 * from SAML are not guaranteed to satisfy this condition.
 */
schema.virtual('roles').get(function() {
  const out: any = {};
  const groups: any = this.groups?.toJSON() || {}; // Current groups

  for (const group of Object.keys(groups)) {
    out[group] = out[group] || groups[group];

    /**
     * If we are in this group, we are also in its aliases
     */
    if (groups[group]) {
      for (const alias of roleAliases[group] || []) {
        out[alias] = true;
      }
    }
  }

  return out;
});

schema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Application Status
 */
schema.virtual('status.textStatus').get(function() {
  const textStatus = this?.status?.internalTextStatus || '';
  const maskedStatuses = [
    'Accepted',
    'Waitlisted',
    'Rejected',
  ];

  if (!this?.status?.statusReleased && maskedStatuses.indexOf(textStatus) !== -1) {
    return 'Applied';
  }

  return textStatus;
});

schema.virtual('status.internalTextStatus').get(function() {
  if (this?.status?.rsvpExpired) {
    return 'Invitation Expired';
  } else if (this?.status?.applicationExpired) {
    return 'Application Expired';
  } else if (this?.status?.declined) {
    return 'Declined';
  } else if (this.status?.checkedIn) {
    return 'Checked In';
  } else if (this?.status?.confirmed) {
    return 'Confirmed';
  } else if (this?.status?.accepted) {
    return 'Accepted';
  } else if (this?.status?.waitlisted) {
    return 'Waitlisted';
  } else if (this?.status?.rejected) {
    return 'Rejected';
  } else if (this?.status?.applied) {
    return 'Applied';
  }

  return 'Not Applied';
});

schema.virtual('status.canAmendTeam').get(function() {
  return isApplicationOpen(this);
});

schema.virtual('status.canApply').get(function() {
  return canUpdateApplication(this);
});

schema.virtual('status.canRSVP').get(function() {
  return canRSVP(this);
});

schema.virtual('status.isRSVPOpen').get(function() {
  return isRSVPOpen(this);
});

schema.virtual('status.rsvpExpired').get(function() {
  return isRSVPExpired(this);
});

schema.virtual('status.applicationExpired').get(function() {
  return isApplicationExpired(this);
});

/**
 * Application scores
 */
schema.virtual('internal.computedApplicationScore').get(computeApplicationScore);

/**
 * Mail Merge
 */
schema.virtual('mailmerge.FIRST_NAME').get(function() {
  return this.firstName;
});
schema.virtual('mailmerge.LAST_NAME').get(function() {
  return this.lastName;
});
schema.virtual('mailmerge.MERGE_FIRST_NAME').get(function() {
  return this.firstName;
});
schema.virtual('mailmerge.MERGE_LAST_NAME').get(function() {
  return this.lastName;
});
schema.virtual('mailmerge.MERGE_APPLICATION_DEADLINE').get(function() {
  return stringifyUnixTime(this.computedApplicationDeadline);
});
schema.virtual('mailmerge.MERGE_CONFIRMATION_DEADLINE').get(function() {
  return stringifyUnixTime(this.computedRSVPDeadline);
});

/**
 * Computed Deadlines
 */
schema.virtual('computedApplicationOpen', {
  ref: 'Setting',
  localField: 'settingsMapper',
  foreignField: 'settingsMapper',
  justOne: true,
  autopopulate: true,
}).get(function(settings: ISettings) {
  return getApplicationOpen(this, extractUniverse(settings));
});

schema.virtual('computedApplicationDeadline', {
  ref: 'Setting',
  localField: 'settingsMapper',
  foreignField: 'settingsMapper',
  justOne: true,
  autopopulate: true,
}).get(function(settings: ISettings) {
  return getApplicationDeadline(this, extractUniverse(settings));
});

schema.virtual('computedRSVPDeadline', {
  ref: 'Setting',
  localField: 'settingsMapper',
  foreignField: 'settingsMapper',
  justOne: true,
  autopopulate: true,
}).get(function(settings: ISettings) {
  return getRSVPDeadline(this, extractUniverse(settings));
});

schema.plugin(mongooseAutopopulate);


export default mongoose.model<IUser>('User', schema);

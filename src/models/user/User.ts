import mongoose from 'mongoose';
import { extractFields } from '../util';
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
  const groups: any = this.groups || {}; // Current groups

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

schema.virtual('status.textStatus').get(function() {
  if (this?.status?.declined) {
    return 'Declined';
  } else if (this.status?.checkedIn) {
    return 'Checked In';
  } else if (this?.status?.confirmed) {
    return 'Confirmed';
  } else if (this?.status?.accepted && this?.status?.statusReleased) {
    return 'Accepted';
  } else if (this?.status?.waitlisted && this?.status?.statusReleased) {
    return 'Waitlisted';
  } else if (this?.status?.rejected && this?.status?.statusReleased) {
    return 'Rejected';
  } else if (this?.status?.applied) {
    return 'Applied';
  }

  return 'Not Applied';
});

schema.virtual('internal.computedApplicationScore').get(computeApplicationScore);

export default mongoose.model<IUser>('User', schema);

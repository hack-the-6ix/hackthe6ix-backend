import mongoose from 'mongoose';
import { extractFields } from '../util';
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

schema.virtual('internal.computedApplicationScore').get(function() {
  const numReviews = this.internal?.applicationScores?.length;
  let total = 0;

  for (let i = 0; i < numReviews; i++) {
    total += this.internal.applicationScores[i];
  }

  // TODO: Do not assign a score until all the necessary scores are in

  return numReviews ? total / numReviews : -1;
});

export default mongoose.model<IUser>('User', schema);

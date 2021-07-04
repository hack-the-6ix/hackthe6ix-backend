import mongoose from 'mongoose';
import { extractFields } from '../util';
import { enumOptions } from './enums';
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
  const user = this as IUser;
  const applicationScores: any = user.internal.applicationScores;

  // Calculate score in accordance to the agreed on formula
  const firstHackathon = user.hackerApplication?.hackathonsAttended === enumOptions.hackathonsAttended[0];

  // Ensure all categories are graded before performing the calculation
  for (const category of ['accomplish', 'project', 'portfolio']) {
    if (
      (category !== 'portfolio' || !firstHackathon) && // If this is the applicant's first hackathon, we waive the validation for portfolio
      (applicationScores[category]?.score < 0) // Ensure we have all the relevant data on file
    ) {
      return -1;
    }
  }

  const total: number = (user.hackerApplication.requestedWorkshops?.length > 0 ? 1 : 0) +
    applicationScores.accomplish?.score +
    applicationScores.project?.score +
    (!firstHackathon ? applicationScores.portfolio?.score : 0);

  return (total / (firstHackathon ? 9 : 11)) * 100;
});

export default mongoose.model<IUser>('User', schema);

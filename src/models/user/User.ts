import mongoose from 'mongoose';
import { extractFields } from '../util';
import { fields, IUser } from './fields';

const createGridFSModel = require('mongoose-gridfs').createModel; // For some reason the @types for this library wouldn't install :/

const schema = new mongoose.Schema(extractFields(fields), {
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
  },
});

/**
 * TODO: Add computed value to inject team information + add it to the list of fields
 */

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

/**
 * Since the mongo connection needs to be established before the GridFS model
 * can be made, we will have the user call getResumeBucket when they need it
 * (as opposed to constructing it on boot)
 *
 * @param connection
 */
export const getResumeBucket = () => createGridFSModel({
  modelName: 'Resume',
  connection: mongoose.connection,
});

export default mongoose.model<IUser>('User', schema);

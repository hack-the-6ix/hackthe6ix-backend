import mongoose from 'mongoose';
import { extractFields } from '../util';
import { fields, IUser } from './fields';

const schema = new mongoose.Schema(extractFields(fields));

/**
 * TODO: Add computed value to inject team information + add it to the list of fields
 */

export default mongoose.model<IUser>('User', schema);

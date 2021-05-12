import mongoose from 'mongoose';
import { fields, IUser } from './fields';

const schema = new mongoose.Schema(fields.fields);

/**
 * TODO: Write function to recursively fetch all the mongoose fields before injecting it into mongoose.Schema
 */

module.exports = mongoose.model('User', schema);
export default mongoose.model<IUser>('User', schema);

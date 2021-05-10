import mongoose from 'mongoose';
import { fields, IUser } from './fields';

const schema = new mongoose.Schema(fields);

export default mongoose.model<IUser>('User', schema);

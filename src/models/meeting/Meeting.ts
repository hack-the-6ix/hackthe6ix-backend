import mongoose from 'mongoose';
import { extractFields } from '../util';
import { fields, IMeeting } from './fields';

const schema = new mongoose.Schema(extractFields(fields), {
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
  },
});

export default mongoose.model<IMeeting>('Meeting', schema);
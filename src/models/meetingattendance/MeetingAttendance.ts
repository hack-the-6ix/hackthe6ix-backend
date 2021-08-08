import mongoose from 'mongoose';
import { extractFields } from '../util';
import { fields, IMeetingAttendance } from './fields';

const schema = new mongoose.Schema(extractFields(fields), {
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
  },
});

schema.index({
  meetingID: 1,
  userID: 1,
});

export default mongoose.model<IMeetingAttendance>('MeetingAttendance', schema);

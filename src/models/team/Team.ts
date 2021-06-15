import mongoose from 'mongoose';
import { extractFields } from '../util';
import { fields, ITeam } from './fields';

const schema = new mongoose.Schema(extractFields(fields), {
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
  },
});

schema.virtual('memberNames', {
  ref: 'User',
  localField: 'code',
  foreignField: 'hackerApplication.teamCode',
  justOne: false
});

// Hook to auto populate memberNames
const autoPopulateMemberNames = function(next) {
  this.populate('memberNames');
  next();
};

schema.pre('findOne', autoPopulateMemberNames)
      .pre('find', autoPopulateMemberNames);

export default mongoose.model<ITeam>('Team', schema);

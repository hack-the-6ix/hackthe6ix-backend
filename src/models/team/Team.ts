import mongoose from 'mongoose';
import { IUser } from '../user/fields';
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
  justOne: false,
}).get(function(members: IUser[]) {
  return members.map((u: IUser) => u.fullName);
});

schema.virtual('teamScore', {
  ref: 'User',
  localField: 'code',
  foreignField: 'hackerApplication.teamCode',
  justOne: false,
}).get(function(members: IUser[]) {
  let count = 0;
  let total = 0;

  for (const user of members) {
    if (user?.internal?.computedApplicationScore > -1) {
      count++;
      total += user?.internal?.computedApplicationScore;
    } else {
      return -1; // Everyone needs to be graded
    }
  }

  return total / count;
});

// Hook to auto populate memberNames
const autoPopulateMemberNames = function(next: any) {
  this.populate('memberNames');
  this.populate('teamScore');
  next();
};

schema.pre('findOne', autoPopulateMemberNames)
.pre('find', autoPopulateMemberNames);

export default mongoose.model<ITeam>('Team', schema);

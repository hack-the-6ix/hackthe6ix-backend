import mongoose from "mongoose";
import {fields, ITokenset} from './fields';

const schema = new mongoose.Schema(fields, {
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  });

export default mongoose.model<ITokenset>('Tokenset', schema);
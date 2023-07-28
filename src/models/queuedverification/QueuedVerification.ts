import mongoose from 'mongoose';
import { extractFields } from '../util';
import { fields, IQueuedVerification } from './fields';

const schema = new mongoose.Schema(extractFields(fields), {
    toObject: {
        virtuals: true,
    },
    toJSON: {
        virtuals: true,
    },
});

schema.index({
    processed: -1,
    queuedTime: 1
});

export default mongoose.model<IQueuedVerification>('QueuedVerification', schema);

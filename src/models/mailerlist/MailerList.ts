import mongoose from 'mongoose';
import { extractFields } from '../util';
import { fields, IMailerList } from './fields';

const schema = new mongoose.Schema(extractFields(fields), {
    toObject: {
        virtuals: true,
    },
    toJSON: {
        virtuals: true,
    },
});

export default mongoose.model<IMailerList>('MailerList', schema);
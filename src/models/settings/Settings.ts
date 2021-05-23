import mongoose from 'mongoose';
import {fields, ISettings} from './fields';

const schema = new mongoose.Schema(fields);

export default mongoose.model<ISettings>('Setting', schema);

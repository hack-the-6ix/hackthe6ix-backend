import mongoose from 'mongoose';
import { extractFields } from '../util';
import {fields, ISettings} from './fields';

const schema = new mongoose.Schema(extractFields(fields));

export default mongoose.model<ISettings>('Setting', schema);

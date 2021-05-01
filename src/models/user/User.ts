import mongoose from 'mongoose';
import fields from './fields';

const schema = new mongoose.Schema(fields);

module.exports = mongoose.model('User', schema);

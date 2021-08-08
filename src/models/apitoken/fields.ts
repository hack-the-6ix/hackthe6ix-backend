import mongoose from 'mongoose';
import {
  CreateCheckRequest,
  DeleteCheckRequest,
  ReadCheckRequest,
  WriteCheckRequest,
} from '../../types/checker';
import { isOrganizer } from '../validator';

export const fields = {
  createCheck: (request: CreateCheckRequest<any, IAPIToken>) => isOrganizer(request.requestUser),
  readCheck: (request: ReadCheckRequest<IAPIToken>) => isOrganizer(request.requestUser),
  deleteCheck: (request: DeleteCheckRequest<IAPIToken>) => isOrganizer(request.requestUser),
  writeCheck: (request: WriteCheckRequest<any, IAPIToken>) => isOrganizer(request.requestUser),
  FIELDS: {
    token: {
      type: String,
      required: true,
      index: true,
      readCheck: true,
      writeCheck: true,
    },
    description: {
      type: String,
      readCheck: true,
      writeCheck: true,
    },
    internalUserID: {
      type: String,
      readCheck: true,
      writeCheck: true,
    },
  },
};

export interface IAPIToken extends mongoose.Document {
  token: string,
  internalUserID: string
  description?: string,
}

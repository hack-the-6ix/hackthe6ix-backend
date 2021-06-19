import mongoose from 'mongoose';
import { ReadCheckRequest, ReadInterceptRequest } from '../../types/types';
import { IUser } from '../user/fields';
import { isOrganizer } from '../validator';

export const fields = {
  createCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),
  deleteCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),
  writeCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),
  readCheck: (request: ReadCheckRequest<ITeam>) => // Only organizers or team members can access this
    isOrganizer(request.requestUser) ||
    request.targetObject.memberIDs.indexOf(request.requestUser._id) !== -1,

  FIELDS: {
    code: {
      type: String,
      index: true,
      required: true,
      readCheck: true,
      writeCheck: true,
    },
    memberIDs: {
      type: [String],
      readCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),
      writeCheck: true,
    },
    memberNames: {
      type: [String],
      readCheck: true,
      virtual: true,
      readInterceptor: (request: ReadInterceptRequest<IUser[], ITeam>) => request.fieldValue.map((u: IUser) => u.fullName), // Replace the user object with just their full name
    },
  },
};

export interface ITeam extends mongoose.Document {
  code: string,
  memberIDs: string[],
  memberNames: string[]
}

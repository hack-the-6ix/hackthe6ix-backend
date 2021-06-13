import mongoose from "mongoose";
import { ReadCheckRequest, ReadInterceptRequest } from '../../types/types';
import { IUser } from '../user/fields';
import { isOrganizer } from '../validator';

export const fields = {
    readCheck: (request: ReadCheckRequest<ITeam>) => // Only organizers or team members can access this
      isOrganizer(request.requestUser) ||
      request.targetObject.memberIDs.indexOf(request.requestUser._id) !== -1,

    FIELDS: {
      code: {
        type: String,
        index: true,
        required: true,
        readCheck: true
      },
      memberIDs: {
        type: [String],
        readCheck: true
      },
      memberNames: {
        type: [String],
        readCheck: true,
        virtual: true,
        readInterceptor: (request: ReadInterceptRequest<IUser, ITeam>) => request.fieldValue.fullName // Replace the user object with just their full name
      }
    }
};

export interface ITeam extends mongoose.Document {
  code: string,
  memberIDs: string[]
}

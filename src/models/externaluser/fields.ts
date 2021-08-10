import {
  CreateCheckRequest,
  DeleteCheckRequest,
  ReadCheckRequest,
  WriteCheckRequest,
} from '../../types/checker';
import { BasicUser } from '../../types/types';
import discordShared from '../shared/discordShared';
import { isOrganizer } from '../validator';

export const fields = {
  createCheck: (request: CreateCheckRequest<any, IExternalUser>) => isOrganizer(request.requestUser),
  readCheck: (request: ReadCheckRequest<IExternalUser>) => isOrganizer(request.requestUser),
  deleteCheck: (request: DeleteCheckRequest<IExternalUser>) => isOrganizer(request.requestUser),
  writeCheck: (request: WriteCheckRequest<any, IExternalUser>) => isOrganizer(request.requestUser),
  FIELDS: {
    _id: {
      virtual: true,
      readCheck: true,
    },
    firstName: {
      type: String,
      required: true,
      readCheck: true,
      writeCheck: true,
      inTextSearch: true,
    },
    lastName: {
      type: String,
      required: true,
      readCheck: true,
      writeCheck: true,
      inTextSearch: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
      readCheck: true,
      writeCheck: true,
      inTextSearch: true,
    },
    notes: {
      type: String,
      readCheck: true,
      writeCheck: true,
      inTextSearch: true,
    },
    discord: discordShared,
  },
};

export interface IExternalUser extends BasicUser {
  notes: string
}

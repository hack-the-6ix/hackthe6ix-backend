import { ReadCheckRequest, WriteCheckRequest } from '../../types/checker';
import { IExternalUser } from '../externaluser/fields';
import { IUser } from '../user/fields';
import { isOrganizer } from '../validator';

export default {

  readCheck: (request: ReadCheckRequest<IExternalUser>) => isOrganizer(request.requestUser),
  writeCheck: (request: WriteCheckRequest<any, IExternalUser>) => isOrganizer(request.requestUser),

  FIELDS: {
    discordID: {
      type: String,
      index: true,
      readCheck: true,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser),
      inTextSearch: true,
    },
    username: {
      type: String,
      readCheck: true,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser),
      inTextSearch: true,
    },
    verifyTime: {
      type: Number,
      readCheck: true,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser),
    },
    additionalRoles: {
      type: [String],
      readCheck: true,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser),
    },
    suffix: {
      type: String,
      readCheck: true,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser),
      inTextSearch: true,
    },
  },
};

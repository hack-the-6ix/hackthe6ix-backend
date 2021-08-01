import { WriteCheckRequest } from '../../types/checker';
import { IUser } from '../user/fields';
import { isOrganizer } from '../validator';

export default {
    discordID: {
      type: String,
      index: true,
      readCheck: true,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser),
    },
    username: {
      type: String,
      readCheck: true,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser),
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
    }
  }
  
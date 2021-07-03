import { ObjectID } from 'bson';
import { IUser } from './models/user/fields';

export const port = process.env.PORT || 6971;
export const database = process.env.DATABASE || 'mongodb://localhost:27017/ht6backend';
export const timestampFormat = 'MM/DD/YYYY hh:mm a';
export const systemUser = {
  _id: new ObjectID('000000000000000000000000'),
  firstName: 'System',
  lastName: 'System',
  idpLinkID: 'system',
  email: 'system',
  groups: {
    admin: true,
  },
  roles: {
    admin: true,
    organizer: true,
    volunteer: true,
    hacker: true,
  },
} as IUser;

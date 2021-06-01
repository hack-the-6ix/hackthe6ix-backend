import { ObjectID } from 'bson';
import { IUser } from '../../models/user/fields';

export const organizerUser = {
  _id: new ObjectID('5f081f878c60690dd9b9fd57'),
  roles: {
    organizer: true,
  },
} as IUser;

export const newHackerUser = {
  firstName: 'Test',
  lastName: 'Testerson',
  samlNameID: 'wtf',
  email: 'test@test.ca',
  roles: {
    hacker: true,
    admin: false,
  },
};

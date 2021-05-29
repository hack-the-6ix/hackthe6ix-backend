import { ObjectID } from 'bson';
import { IRequestUser } from '../../types/types';

export const organizerUser = {
  _id: new ObjectID('5f081f878c60690dd9b9fd57'),
  jwt: {
    roles: {
      organizer: true,
    },
  },
} as IRequestUser;

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

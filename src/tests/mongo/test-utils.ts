import { ObjectID } from 'bson';
import mongoose from 'mongoose';
import models from '../../controller/models';
import { IUser } from '../../models/user/fields';
import { extractFields } from '../../models/util';

export const adminUser = {
  _id: new ObjectID('5f081f878c60690dd9b9fd50'),
  firstName: 'Admin',
  lastName: 'Admin',
  samlNameID: 'admin',
  email: 'admin@test.ca',
  roles: {
    admin: true,
    organizer: true,
    volunteer: true,
    hacker: true,
  },
} as IUser;

export const organizerUser = {
  _id: new ObjectID('5f081f878c60690dd9b9fd59'),
  firstName: 'Organizer',
  lastName: 'Organizer',
  samlNameID: 'organizer',
  email: 'organizer@test.ca',
  roles: {
    organizer: true,
    volunteer: true,
  },
} as IUser;

export const voluteerUser = {
  _id: new ObjectID('5f081f878c60690dd9b9fd58'),
  firstName: 'Volunteer',
  lastName: 'Volunteer',
  samlNameID: 'volunteer',
  email: 'volunteer@test.ca',
  roles: {
    volunteer: true,
  },
} as IUser;

export const hackerUser = {
  _id: new ObjectID('5f081f878c60690dd9b9fd57'),
  firstName: 'Hacker',
  lastName: 'Hacker',
  samlNameID: 'hacker',
  email: 'hacker@test.ca',
  roles: {
    hacker: true,
  },
  internal: {
    notes: 'This is a bad person',
  },
} as IUser;

export const nopermUser = {
  _id: new ObjectID('5f081f878c60690dd9b9fd17'),
  firstName: 'Noperm',
  lastName: 'Noperm',
  samlNameID: 'noperm',
  email: 'ihavenoperms@test.ca',
  roles: {},
} as IUser;

/**
 * Generate test model using fields from `testFields` and the name `name`
 *
 * @param testFields
 * @param name
 * @param doNotRegister - if true, we will not override the models module
 * @return Test mongoose model
 */
export const generateTestModel = (testFields: any, name: string, doNotRegister?: boolean) => {
  const testSchema = new mongoose.Schema(extractFields(testFields), {
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  });

  const Test = mongoose.model(name, testSchema);

  if (!doNotRegister) {
    (models as any)[name] = {
      mongoose: Test,
      rawFields: testFields
    };
  }

  return Test;
};

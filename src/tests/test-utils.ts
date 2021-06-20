import { ObjectID } from 'bson';
import mongoose from 'mongoose';
import { IUser } from '../models/user/fields';
import { extractFields } from '../models/util';
import { UniverseState } from '../types/types';
import * as dbHandler from './db-handler';

export const adminUser = {
  _id: new ObjectID('5f081f878c60690dd9b9fd50'),
  firstName: 'Admin',
  lastName: 'Admin',
  samlNameID: 'admin',
  email: 'admin@test.ca',
  groups: {
    admin: true,
    organizer: true,
    volunteer: true,
    hacker: true,
  },
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
  groups: {
    organizer: true,
  },
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
  groups: {
    volunteer: true,
  },
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
  groups: {
    hacker: true,
  },
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
  groups: {},
} as IUser;

/**
 * Generate test model using fields from `testFields` and the name `name`
 *
 * @param testFields
 * @param name
 * @return Test mongoose model
 */
export const generateTestModel = (testFields: any, name: string) => {
  const testSchema = new mongoose.Schema(extractFields(testFields), {
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  });

  const Test = mongoose.model(name, testSchema);

  const models: any = {};

  (models as any)[name] = {
    mongoose: Test,
    rawFields: testFields,
  };

  return [Test, models];
};

export const generateMockUniverseState = (applyOffset = 100000, confirmOffset = 100000) => new Promise(
  (resolve) => resolve({
      systemTime: new Date().getTime(),
      public: {
        globalApplicationDeadline: new Date().getTime() + applyOffset,
        globalConfirmationDeadline: new Date().getTime() + confirmOffset,
      },
      private: {
        maxAccepted: 100,
        maxWaitlist: 100,
      },
    } as UniverseState,
  ),
);

export const mockDate = (timestamp: number) => {
  const mockDate = new Date(timestamp);
  const spy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

  return () => spy.mockRestore();
};

export const mockGetMailTemplate = (templateName: string) => ({
  subject: `subject${templateName}`,
  templateID: `ID${templateName}`,
});

export const mockSuccessResponse = () => ({ status: 200, data: {} as any });

export const runBeforeAll = async () => {
  await dbHandler.connect();
};

export const runAfterEach = async () => {
  await dbHandler.clearDatabase();
  jest.clearAllMocks();
};

export const runAfterAll = async () => await dbHandler.closeDatabase();

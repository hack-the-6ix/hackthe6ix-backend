import { ObjectID } from 'bson';
import mongoose from "mongoose";
import { fields, IUser } from '../../models/user/fields';
import { extractFields } from '../../models/util';
import {
  isAdmin,
  isVolunteer,
  isOrganizer,
  isUserOrOrganizer,
  maxLength,
} from '../../models/validator';
import { ReadCheckRequest, WriteCheckRequest } from '../../types/types';

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
    hacker: true
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
    volunteer: true
  },
} as IUser;

export const voluteerUser = {
  _id: new ObjectID('5f081f878c60690dd9b9fd58'),
  firstName: 'Volunteer',
  lastName: 'Volunteer',
  samlNameID: 'volunteer',
  email: 'volunteer@test.ca',
  roles: {
    volunteer: true
  },
} as IUser;

export const hackerUser = {
  _id: new ObjectID('5f081f878c60690dd9b9fd57'),
  firstName: 'Hacker',
  lastName: 'Hacker',
  samlNameID: 'hacker',
  email: 'hacker@test.ca',
  roles: {
    hacker: true
  },
} as IUser;

/**
 * Test model
 */

const testFields = {
  createCheck: (request: ReadCheckRequest) => isVolunteer(request.requestUser),
  deleteCheck: (request: ReadCheckRequest) => isAdmin(request.requestUser),
  readCheck: true,
  writeCheck: true,

  FIELDS: {

    read: {
      writeCheck: false,
      readCheck: true,

      FIELDS: {
        adminOnly: {
          type: Boolean,
          caption: 'Admin read only',

          writeCheck: false,
          readCheck: (request: ReadCheckRequest) => isAdmin(request.requestUser),
        },

        userOnly: {
          type: Boolean,
          caption: 'Hacker read only',

          writeCheck: false,
          readCheck: (request: ReadCheckRequest) => isUserOrOrganizer(request.requestUser, request.targetObject),
        },

        anyone: {
          type: Boolean,
          caption: 'Anyone can read',

          writeCheck: false,
          readCheck: true,
        },
      }
    },

    write: {
      writeCheck: true,
      readCheck: false,

      FIELDS: {
        adminOnly: {
          type: Boolean,
          caption: 'Admin write only',

          readCheck: false,
          writeCheck: (request: WriteCheckRequest<boolean>) => isAdmin(request.requestUser),
        },

        userOnly: {
          type: Boolean,
          caption: 'Hacker write only',

          readCheck: false,
          writeCheck: (request: WriteCheckRequest<boolean>) => isUserOrOrganizer(request.requestUser, request.targetObject),
        },

        anyone: {
          type: Boolean,
          caption: 'Anyone can write',

          readCheck: false,
          writeCheck: true,
        },

        writeCondition: {
          type: String,
          caption: 'Condition',

          readCheck: false,
          writeCheck: (request: WriteCheckRequest<string>) => maxLength(20),
        },
      }
    }

  }
};

const testSchema = new mongoose.Schema(extractFields(testFields), {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

const Test = mongoose.model('Test', testSchema);

export const mockModels = {
  test: {
    mongoose: Test,
    rawFields: testFields
  }
};

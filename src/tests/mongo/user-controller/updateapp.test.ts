import { updateApplication } from '../../../controller/UserController';
import { IUser } from '../../../models/user/fields';
import {
  canSubmitApplication,
  isOrganizer,
  isUserOrOrganizer,
  maxLength,
} from '../../../models/validator';
import { ReadCheckRequest, WriteCheckRequest } from '../../../types/types';
import * as dbHandler from '../db-handler';
import { generateTestModel, hackerUser } from '../test-utils';

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => await dbHandler.connect());

/**
 * Clear all test data after every test.
 */
afterEach(async () => await dbHandler.clearDatabase());

/**
 * Remove and close the db and server.
 */
afterAll(async () => await dbHandler.closeDatabase());

const userTestModel = generateTestModel({
  writeCheck: (request: WriteCheckRequest<any, IUser>) => isUserOrOrganizer(request.requestUser, request.targetObject),
  readCheck: (request: ReadCheckRequest<IUser>) => isUserOrOrganizer(request.requestUser, request.targetObject),

  FIELDS: {
    firstName: {
      type: String,
      readCheck: true,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser) && maxLength(64)(request),
    },
    lastName: {
      type: String,
      readCheck: true,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser) && maxLength(64)(request),
    },
    email: {
      type: String,
      readCheck: true,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser) && maxLength(64)(request),
    },
    internal: {
      readCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),
      writeCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),

      FIELDS: {
        secretNode: {
          type: String,
          readCheck: true,
          writeCheck: true,
        },
      },
    },
    application: {
      readCheck: true,
      writeCheck: canSubmitApplication(),

      FIELDS: {
        optionalField: {
          type: String,
          readCheck: true,
          writeCheck: true,
        },
        optionalField2: {
          type: String,
          readCheck: true,
          writeCheck: true,
        },
        requiredField: {
          type: String,
          readCheck: true,
          writeCheck: (request: WriteCheckRequest<string, any>) => request.fieldValue.length > 0,
        },
        requiredField2: {
          type: String,
          readCheck: true,
          writeCheck: (request: WriteCheckRequest<string, any>) => request.fieldValue.length > 0,
        },
        conditionalField: {
          type: String,
          readCheck: true,
          writeCheck: (request: WriteCheckRequest<string, any>) => request.fieldValue.length < 10,
        },
      },
    },
  },
}, 'user');

describe('Update Application', () => {
  test('Success', async () => {
    await userTestModel.create(hackerUser);

    await updateApplication(
      hackerUser,
      false,
      {
        optionalField2: 'Test',
      } as any,
    );

    const resultObject = await userTestModel.findOne({
      _id: hackerUser._id,
    });

    console.log(resultObject);

    expect(resultObject).toEqual({
      optionalField2: 'Test',
    });
  });
  test('Fail', async () => {

  });

});

describe('Submit Application', () => {

  test('Success', async () => {

  });
  test('Fail', async () => {

  });

});

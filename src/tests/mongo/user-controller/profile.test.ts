import { fetchUser } from '../../../controller/UserController';
import { IUser } from '../../../models/user/fields';
import {
  canSubmitApplication,
  isOrganizer,
  isUserOrOrganizer,
  maxLength,
} from '../../../models/validator';
import { NotFoundError, ReadCheckRequest, WriteCheckRequest } from '../../../types/types';
import * as dbHandler from '../db-handler';
import { adminUser, generateTestModel, hackerUser, organizerUser } from '../test-utils';

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

describe('Get profile', () => {

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
          applicationField: {
            type: String,
            readCheck: true,
            writeCheck: true,
          },
        },
      },
    },
  }, 'user');

  test('Success', async () => {
    await userTestModel.create(adminUser);
    await userTestModel.create(hackerUser);
    await userTestModel.create(organizerUser);

    expect((await userTestModel.find({})).length).toEqual(3);

    const data = await fetchUser(hackerUser);

    // Expect to get the correct user object
    expect(data).toEqual({
      firstName: hackerUser.firstName,
      lastName: hackerUser.lastName,
      email: hackerUser.email,
      application: {
        applicationField: undefined,
      },
    });
  });

  test('Fail', async () => {
    expect(fetchUser({} as IUser)).rejects.toThrow(NotFoundError);
  });
});

import { fetchUser } from '../../../controller/UserController';
import { IUser } from '../../../models/user/fields';
import User from '../../../models/user/User';
import { NotFoundError } from '../../../types/types';
import * as dbHandler from '../db-handler';
import { adminUser, hackerUser, organizerUser } from '../test-utils';

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

  test('Success', async () => {
    await User.create(adminUser);
    await User.create(hackerUser);
    await User.create(organizerUser);

    expect((await User.find({})).length).toEqual(3);

    const data = await fetchUser(hackerUser);

    // Expect to get the correct user object
    expect(data.firstName).toEqual(hackerUser.firstName);

    // No internal fields should be revealed
    expect(Object.keys(data.internal).length).toEqual(0);
  });

  test('Fail', async () => {
    expect(fetchUser({} as IUser)).rejects.toThrow(NotFoundError);
  });
});

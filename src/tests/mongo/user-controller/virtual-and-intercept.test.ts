import User from '../../../models/user/User';
import * as dbHandler from '../../db-handler';
import { hackerUser } from '../../test-utils';

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

jest.mock('../../../controller/util/resources', () => {
  const { getModels } = jest.requireActual('../../../controller/util/resources');
  return {
    fetchUniverseState: jest.fn(),
    getModels: getModels,
  };
});

describe('Interceptor', () => {

});

describe('Virtual', () => {
  describe('Computed Application Score', () => {
    test('No scores', async () => {
      const user = await User.create(hackerUser);
      expect(user.internal.computedApplicationScore).toEqual(-1);
    });

    test('Normal Scores', async () => {
      const scores = [1, 2, 3, 4];
      const user = await User.create({
        ...hackerUser,
        internal: {
          applicationScores: scores,
        },
      });

      let total = 0;
      for (let i = 0; i < scores.length; i++) {
        total += scores[i];
      }

      expect(user.internal.computedApplicationScore).toEqual(total / scores.length);
    });
  });

  describe('Roles', () => {
    test('Admin', async () => {
      const user = await User.create({
        ...hackerUser,
        groups: {
          admin: true,
        },
      });

      expect(user.toJSON().roles).toEqual({
        admin: true,
        organizer: true,
        volunteer: true,
        hacker: true,
      });
    });
    test('Organizer', async () => {
      const user = await User.create({
        ...hackerUser,
        groups: {
          organizer: true,
        },
      });

      expect(user.toJSON().roles).toEqual({
        admin: false,
        organizer: true,
        volunteer: true,
        hacker: false,
      });

    });
    test('Volunteer', async () => {
      const user = await User.create({
        ...hackerUser,
        groups: {
          volunteer: true,
        },
      });

      expect(user.toJSON().roles).toEqual({
        admin: false,
        organizer: false,
        volunteer: true,
        hacker: false,
      });
    });
    test('Hacker', async () => {
      const user = await User.create({
        ...hackerUser,
        groups: {
          hacker: true,
        },
      });

      expect(user.toJSON().roles).toEqual({
        admin: false,
        organizer: false,
        volunteer: false,
        hacker: true,
      });
    });
  });

  test('Full Name', async () => {
    const user = await User.create({
      ...hackerUser,
      firstName: 'Bill',
      lastName: 'Gates',
    });

    expect(user.toJSON().fullName).toEqual('Bill Gates');
  });
});

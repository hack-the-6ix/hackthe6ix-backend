import cloneDeep from 'lodash.clonedeep';
import mongoose from 'mongoose';
import assignApplicationStatus from '../../../controller/applicationStatus/assignApplicationStatus';
import getRanks from '../../../controller/applicationStatus/getRanks';
import { fetchUniverseState } from '../../../controller/util/resources';
import { IUser } from '../../../models/user/fields';
import User from '../../../models/user/User';
import syncMailingLists from '../../../services/mailer/syncMailingLists';
import {
  generateMockUniverseState,
  hackerUser,
  runAfterAll,
  runAfterEach,
  runBeforeAll,
} from '../../test-utils';

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(runBeforeAll);

/**
 * Clear all test data after every test.
 */
afterEach(runAfterEach);

/**
 * Remove and close the db and server.
 */
afterAll(runAfterAll);

jest.mock('../../../controller/util/resources', () => {
  const { getModels } = jest.requireActual('../../../controller/util/resources');
  return {
    fetchUniverseState: jest.fn(),
    getModels: getModels,
  };
});
jest.mock('../../../controller/applicationStatus/getRanks', () => jest.fn((): any => undefined));
jest.mock('../../../services/mailer/syncMailingLists', () => jest.fn((): any => undefined));

describe('Assign Application Status', () => {

  describe('Waitlist deadline', () => {

    test('Default', () => {

    });
    describe('Override', () => {

      test('Success', () => {

      });

      test('Error', () => {

      });

    });

  });

  describe('Legit mode', () => {

    test('Legit', () => {

    });

    test('Not legit', () => {

    });

  });

  describe('Functionality', () => {
    test('Fresh slate', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState(undefined, undefined, 3, 2));

      const users = (await Promise.all([...new Array(10)].map(() => User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        status: {
          applied: true,
        },
      })))).map((u: IUser) => u.toJSON());

      // Some other rando user that should not have their status updated
      const rando = await User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        status: {
          applied: false,
        },
      });

      getRanks.mockReturnValue(cloneDeep(users));

      const { dead, accepted, waitlisted, rejected } = await assignApplicationStatus();

      expect(dead).toEqual([]);
      expect(accepted).toEqual([users[0], users[1], users[2]].map((u: IUser) => ({
        ...u,
        status: {
          ...u.status,
          accepted: true,
          waitlisted: false,
          rejected: false,
        },
      })));
      expect(waitlisted).toEqual([users[3], users[4]].map((u: IUser) => ({
        ...u,
        status: {
          ...u.status,
          waitlisted: true,
          accepted: false,
          rejected: false,
        },
      })));
      expect(rejected).toEqual([users[5], users[6], users[7], users[8], users[9]].map((u: IUser) => ({
        ...u,
        status: {
          ...u.status,
          rejected: true,
          accepted: false,
          waitlisted: false,
        },
      })));
      expect(syncMailingLists).toHaveBeenCalledWith(null, true);
    });

    test('Existing accepted and waitlisted users', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState(undefined, undefined, 3, 2));

      const users = (await Promise.all([
        User.create({
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
          },
        }),
        User.create({
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
            accepted: true,
          },
        }),
        User.create({
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
            accepted: true,
          },
        }),
        User.create({
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
            waitlisted: true,
          },
        }),
        User.create({
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
          },
        }),
        User.create({
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
          },
        }),
      ])).map((u: IUser) => u.toJSON());

      // Some other rando user that should not have their status updated
      const rando = await User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        status: {
          applied: false,
        },
      });

      getRanks.mockReturnValue(cloneDeep(users));

      const { dead, accepted, waitlisted, rejected } = await assignApplicationStatus();

      expect(dead).toEqual([]);
      expect(accepted).toEqual([users[0], users[1], users[2]].map((u: IUser) => ({
        ...u,
        status: {
          ...u.status,
          accepted: true,
          waitlisted: false,
          rejected: false,
        },
      })));
      expect(waitlisted).toEqual([users[3], users[4]].map((u: IUser) => ({
        ...u,
        status: {
          ...u.status,
          waitlisted: true,
          accepted: false,
          rejected: false,
        },
      })));
      expect(rejected).toEqual([users[5]].map((u: IUser) => ({
        ...u,
        status: {
          ...u.status,
          rejected: true,
          accepted: false,
          waitlisted: false,
        },
      })));
      expect(syncMailingLists).toHaveBeenCalledWith(null, true);
    });

    // TODO: Add dead state users (declined, rejected, expired), ensure confirmed users are exempt
    test('Existing rejected and declined users', () => {

    });

    test('Accept waitlisted people', () => {

    });

    test('Waitlist Over', () => {

    });
  });
});

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
  mockDate,
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

  test('Legit mode', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState(undefined, undefined, 1, 1));

    const users = (await Promise.all([...new Array(3)].map(() => User.create({
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

    const { dead, accepted, waitlisted, rejected } = await assignApplicationStatus(true);

    expect(dead).toEqual([]);

    const acceptedExpected = {
      ...users[0],
      status: {
        ...users[0].status,
        accepted: true,
        waitlisted: false,
        rejected: false,
      },
    };
    expect((await User.findOne({ _id: users[0]._id })).status.toJSON()).toEqual(acceptedExpected.status);
    expect(accepted).toEqual([acceptedExpected]);

    const waitlistedExpected = {
      ...users[1],
      status: {
        ...users[1].status,
        accepted: false,
        waitlisted: true,
        rejected: false,
      },
    };
    expect((await User.findOne({ _id: users[1]._id })).status.toJSON()).toEqual(waitlistedExpected.status);
    expect(waitlisted).toEqual([waitlistedExpected]);

    const rejectedExpected = {
      ...users[2],
      status: {
        ...users[2].status,
        accepted: false,
        waitlisted: false,
        rejected: true,
      },
    };
    expect((await User.findOne({ _id: users[2]._id })).status.toJSON()).toEqual(rejectedExpected.status);
    expect(rejected).toEqual([rejectedExpected]);

    expect(syncMailingLists).toHaveBeenCalledWith(null, true);
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

    test('Existing rejected and declined users', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState(undefined, undefined, 3, 2));

      const users = (await Promise.all([
        User.create({ // Accept
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
          },
        }),
        User.create({ // Expired, skip
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
            accepted: true,
          },
          personalConfirmationDeadline: -1,
        }),
        User.create({ // Accept
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
            accepted: true,
          },
        }),
        User.create({ // Declined, Skip
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
            accepted: true,
            declined: true,
          },
        }),
        User.create({ // Waitlist -- we reached acceptance cap
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
          },
        }),
        User.create({ // rejected, Skip
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
            rejected: true,
          },
        }),
        User.create({ // Waitlist
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
            waitlisted: true,
          },
        }),
        User.create({ // Reject
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
          },
        }),
        User.create({ // Reject
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
          },
        }),
        User.create({ // Accept - was already accepted
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
            accepted: true,
            confirmed: true,
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

      expect(dead).toEqual([users[1], users[3]]);
      expect(accepted).toEqual([users[0], users[2], users[9]].map((u: IUser) => ({
        ...u,
        status: {
          ...u.status,
          accepted: true,
          waitlisted: false,
          rejected: false,
        },
      })));
      expect(waitlisted).toEqual([users[4], users[6]].map((u: IUser) => ({
        ...u,
        status: {
          ...u.status,
          waitlisted: true,
          accepted: false,
          rejected: false,
        },
      })));
      expect(rejected).toEqual([users[5], users[7], users[8]].map((u: IUser) => ({
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

    test('Accept waitlisted people', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState(undefined, undefined, 5, 2));

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

      const mockTimestamp = 69696969;

      const restoreDateMock = mockDate(mockTimestamp);
      const { dead, accepted, waitlisted, rejected } = await assignApplicationStatus();
      restoreDateMock();

      expect(dead).toEqual([]);
      const mockAcceptedUsers = [users[0], users[1], users[2], users[3], users[4]].map((u: IUser) => ({
        ...u,
        status: {
          ...u.status,
          accepted: true,
          waitlisted: false,
          rejected: false,
        },
      }));
      mockAcceptedUsers[3].personalConfirmationDeadline = mockTimestamp + 1000 * 60 * 60 * 24 * 7; // Formerly waitlisted user is now given a week to respond
      expect(accepted).toEqual(mockAcceptedUsers);
      expect(waitlisted).toEqual([users[5], users[6]].map((u: IUser) => ({
        ...u,
        status: {
          ...u.status,
          waitlisted: true,
          accepted: false,
          rejected: false,
        },
      })));
      expect(rejected).toEqual([users[7]].map((u: IUser) => ({
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

    test('Waitlist Over', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState(undefined, undefined, 3, 3));

      const mockTimestamp = 69696969;

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
            accepted: true,
            confirmed: true,
          },
        }),
        User.create({
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
            rejected: true,
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
            accepted: true,
            declined: true,
          },
        }),
        User.create({
          ...hackerUser,
          _id: mongoose.Types.ObjectId(),
          status: {
            applied: true,
            accepted: true,
          },
          personalConfirmationDeadline: mockTimestamp + 1000,
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

      const restoreDateMock = mockDate(mockTimestamp);
      const { dead, accepted, waitlisted, rejected } = await assignApplicationStatus(false, true);
      restoreDateMock();

      expect(dead).toEqual([users[8]]);

      expect(accepted).toEqual([users[0], users[5], users[9]].map((u: IUser) => ({
        ...u,
        status: {
          ...u.status,
          accepted: true,
          waitlisted: false,
          rejected: false,
        },
      })));
      expect(waitlisted).toEqual([]);

      // #6 is sent to the beginning since existing rejected users are added to the list first
      expect(rejected).toEqual([users[6], users[1], users[2], users[3], users[4], users[7]].map((u: IUser) => ({
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
  });
});

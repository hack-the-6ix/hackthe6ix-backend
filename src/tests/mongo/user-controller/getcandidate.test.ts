import { mockRandom } from 'jest-mock-random';
import mongoose from 'mongoose';
import { getCandidate } from '../../../controller/UserController';
import { fetchUniverseState } from '../../../controller/util/resources';
import User from '../../../models/user/User';
import { NotFoundError } from '../../../types/errors';
import {
  generateMockUniverseState,
  hackerUser,
  organizerUser,
  runAfterAll,
  runAfterEach,
  runBeforeAll,
} from '../../test-utils';

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
  await runBeforeAll();
  fetchUniverseState.mockReturnValue(generateMockUniverseState());
});

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

describe('Get candidate', () => {
  describe('Failure', () => {
    test('No candidates', async () => {
      const organizer = await User.create(organizerUser);
      await expect(getCandidate((organizer))).rejects.toThrow(NotFoundError);
    });

    test('Candidate not applied', async () => {
      const organizer = await User.create(organizerUser);
      const hacker = await User.create(hackerUser);
      await expect(getCandidate((organizer))).rejects.toThrow(NotFoundError);
    });

    test('Candidate has scores', async () => {
      const organizer = await User.create(organizerUser);
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        internal: {
          applicationScores: [1],
        },
      });
      await expect(getCandidate((organizer))).rejects.toThrow(NotFoundError);
    });
  });

  describe('Success', () => {
    test('Candidate has null scores', async () => {
      const organizer = await User.create(organizerUser);
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        internal: {
          applicationScores: null,
        },
      });

      const candidate = await getCandidate((organizer));
      expect(candidate._id).toEqual(hacker._id);
    });

    test('Candidate has 0 scores', async () => {
      const organizer = await User.create(organizerUser);
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        internal: {
          applicationScores: [],
        },
      });

      const candidate = await getCandidate((organizer));
      expect(candidate._id).toEqual(hacker._id);
    });

    test('Random selection', async () => {

      const organizer = await User.create(organizerUser);
      const hacker1 = await User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        status: { applied: true },
      });
      const hacker2 = await User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        status: { applied: true },
      });
      const hacker3 = await User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        status: { applied: true },
      });

      mockRandom([0.0, 0.9, 0.5, 0.0, 0.9, 0.9, 0.4, 0.2]);

      expect((await getCandidate((organizer)))._id).toEqual(hacker1._id);
      expect((await getCandidate((organizer)))._id).toEqual(hacker3._id);
      expect((await getCandidate((organizer)))._id).toEqual(hacker2._id);
      expect((await getCandidate((organizer)))._id).toEqual(hacker1._id);
      expect((await getCandidate((organizer)))._id).toEqual(hacker3._id);
      expect((await getCandidate((organizer)))._id).toEqual(hacker3._id);
      expect((await getCandidate((organizer)))._id).toEqual(hacker2._id);
      expect((await getCandidate((organizer)))._id).toEqual(hacker1._id);
    });
  });
});

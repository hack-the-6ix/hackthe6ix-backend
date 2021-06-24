import mongoose from 'mongoose';
import { gradeCandidate } from '../../../controller/UserController';
import User from '../../../models/user/User';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../types/errors';
import {
  hackerUser,
  organizerUser,
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

describe('Grade candidate', () => {
  describe('Validation Error', () => {
    test('No target ID', async () => {
      await expect(gradeCandidate(organizerUser, null, 0)).rejects.toThrow(BadRequestError);
    });
    test('Invalid target ID', async () => {
      await expect(gradeCandidate(organizerUser, mongoose.Types.ObjectId(), 0)).rejects.toThrow(NotFoundError);
    });

    test('No grade', async () => {
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        internal: {
          applicationScores: null,
        },
      });

      await expect(gradeCandidate(organizerUser, hacker._id, null)).rejects.toThrow(BadRequestError);
    });

    test('Bad grade', async () => {
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        internal: {
          applicationScores: null,
        },
      });

      await expect(gradeCandidate(organizerUser, hacker._id, 'this is a bad grade')).rejects.toThrow(BadRequestError);
    });
  });

  describe('Not eligible', () => {
    test('Not Applied', async () => {
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
        internal: {
          applicationScores: null,
        },
      });

      await expect(gradeCandidate(organizerUser, hacker._id, 0)).rejects.toThrow(ForbiddenError);
    });

    test('Accept', async () => {
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: true,
          accepted: true,
        },
        internal: {
          applicationScores: null,
        },
      });

      await expect(gradeCandidate(organizerUser, hacker._id, 0)).rejects.toThrow(ForbiddenError);
    });

    test('Waitlisted', async () => {
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: true,
          waitlisted: true,
        },
        internal: {
          applicationScores: null,
        },
      });

      await expect(gradeCandidate(organizerUser, hacker._id, 0)).rejects.toThrow(ForbiddenError);
    });

    test('Rejected', async () => {
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: true,
          rejected: true,
        },
        internal: {
          applicationScores: null,
        },
      });

      await expect(gradeCandidate(organizerUser, hacker._id, 0)).rejects.toThrow(ForbiddenError);
    });

    test('Already graded', async () => {
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        internal: {
          applicationScores: [1],
          reviewers: [organizerUser._id.toString()],
        },
      });

      await expect(gradeCandidate(organizerUser, hacker._id, 0)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Success', () => {
    test('Already graded by other reviewer', async () => {
      const otherGrader = mongoose.Types.ObjectId().toString();
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        internal: {
          applicationScores: [1],
          reviewers: [otherGrader],
        },
      });

      await gradeCandidate(organizerUser, hacker._id, 0);

      const updatedUser = await User.findOne({
        _id: hacker._id,
      });

      expect(updatedUser.toJSON().internal.applicationScores).toEqual([1, 0]);
      expect(updatedUser.toJSON().internal.reviewers).toEqual([otherGrader, organizerUser._id.toString()]);
    });
    test('First grade', async () => {
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
      });

      await gradeCandidate(organizerUser, hacker._id, 0);

      const updatedUser = await User.findOne({
        _id: hacker._id,
      });

      expect(updatedUser.toJSON().internal.applicationScores).toEqual([0]);
      expect(updatedUser.toJSON().internal.reviewers).toEqual([organizerUser._id.toString()]);
    });
  });
});

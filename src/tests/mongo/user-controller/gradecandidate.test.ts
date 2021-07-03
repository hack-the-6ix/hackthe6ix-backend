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

jest.mock('../../../models/user/fields', () => {
  const actualFields = jest.requireActual('../../../models/user/fields');
  const deepcopy = jest.requireActual('deepcopy');

  const updatedFields = deepcopy(actualFields.fields);
  updatedFields.FIELDS.internal.FIELDS.applicationScores = {
    writeCheck: true,
    readCheck: true,

    FIELDS: {
      category1: {
        writeCheck: true,
        readCheck: true,

        FIELDS: {
          score: {
            type: Number,
            default: -1,
          },

          reviewer: {
            type: String,
          },
        },
      },

      category2: {
        writeCheck: true,
        readCheck: true,

        FIELDS: {
          score: {
            type: Number,
            default: -1,
          },

          reviewer: {
            type: String,
          },
        },
      },
    },
  };

  return {
    ...actualFields,
    fields: updatedFields,
  };
});

describe('Grade candidate', () => {
  describe('Validation Error', () => {
    test('No target ID', async () => {
      await expect(gradeCandidate(organizerUser, null, {})).rejects.toThrow(BadRequestError);
    });
    test('Invalid target ID', async () => {
      await expect(gradeCandidate(organizerUser, mongoose.Types.ObjectId(), {})).rejects.toThrow(NotFoundError);
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

      await expect(gradeCandidate(organizerUser, hacker._id, { category1: 'this is a bad grade' })).rejects.toThrow(BadRequestError);
    });

    test('Invalid category', async () => {
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        internal: {
          applicationScores: null,
        },
      });

      await expect(gradeCandidate(organizerUser, hacker._id, { asdsadas: 10 })).rejects.toThrow(ForbiddenError);
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

      await expect(gradeCandidate(organizerUser, hacker._id, {})).rejects.toThrow(ForbiddenError);
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

      await expect(gradeCandidate(organizerUser, hacker._id, {})).rejects.toThrow(ForbiddenError);
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

      await expect(gradeCandidate(organizerUser, hacker._id, {})).rejects.toThrow(ForbiddenError);
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

      await expect(gradeCandidate(organizerUser, hacker._id, {})).rejects.toThrow(ForbiddenError);
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
          applicationScores: {
            category1: {
              score: 69,
              reviewer: otherGrader,
            },
          },
        },
      });

      await gradeCandidate(organizerUser, hacker._id, {
        category1: 100,
        category2: 10,
      });

      const updatedUser = await User.findOne({
        _id: hacker._id,
      });

      expect(updatedUser.toJSON().internal.applicationScores).toEqual({
        category1: {
          score: 100,
          reviewer: organizerUser._id.toString(),
        },
        category2: {
          score: 10,
          reviewer: organizerUser._id.toString(),
        },
      });
    });

    test('First grade', async () => {
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        }
      });

      await gradeCandidate(organizerUser, hacker._id, {
        category1: 100,
        category2: 10,
      });

      const updatedUser = await User.findOne({
        _id: hacker._id,
      });

      expect(updatedUser.toJSON().internal.applicationScores).toEqual({
        category1: {
          score: 100,
          reviewer: organizerUser._id.toString(),
        },
        category2: {
          score: 10,
          reviewer: organizerUser._id.toString(),
        },
      });
    });

    test('Edit partial scores', async () => {
      const otherGrader = mongoose.Types.ObjectId().toString();
      const hacker = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        internal: {
          applicationScores: {
            category1: {
              score: 69,
              reviewer: otherGrader,
            },
            category2: {
              score: 1234,
              reviewer: otherGrader,
            },
          },
        },
      });

      await gradeCandidate(organizerUser, hacker._id, {
        category1: 100,
      });

      const updatedUser = await User.findOne({
        _id: hacker._id,
      });

      expect(updatedUser.toJSON().internal.applicationScores).toEqual({
        category1: {
          score: 100,
          reviewer: organizerUser._id.toString(),
        },
        category2: {
          score: 1234,
          reviewer: otherGrader,
        },
      });
    });
  });
});

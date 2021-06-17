import * as dbHandler from '../db-handler';
import User from '../../models/user/User';
import { getStatistics, statisticsLifetime } from '../../services/statistics';
import { hackerUser, mockDate } from '../test-utils';
import mongoose from 'mongoose';

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

jest.mock('../../controller/util/resources', () => (
  {
    fetchUniverseState: jest.fn(),
    getModels: jest.fn(),
  }
));

describe('Get statistics', () => {
  describe('Cache', () => {

    const generateMockusersA = async () => {
      await User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        status: {
          applied: true,
        },
      });

      await User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        status: {
          accepted: true,
        },
      });
    };

    const generateMockusersB = async () => {
      await User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        status: {
          applied: true,
        },
      });

      await User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        status: {
          applied: true,
        },
      });
    };

    test('Fetch from cache', async () => {
      // If these reads occur within 5 minutes, statisticsB should be identical
      // to statisticsA despite the data changing
      await generateMockusersA();

      let restoreDateMock = mockDate(0);
      const statisticsA = await getStatistics();
      restoreDateMock();

      // Clear db and start again
      await dbHandler.clearDatabase();
      await generateMockusersB();

      // Fast forward 4:59:99 into the future
      restoreDateMock = mockDate(statisticsLifetime - 1);
      const statisticsB = await getStatistics();
      restoreDateMock();

      expect(statisticsA).toEqual(statisticsB);
    });

    test('Cache expired', async () => {
      await generateMockusersA();

      let restoreDateMock = mockDate(0);
      const statisticsA = await getStatistics();
      restoreDateMock();

      // Clear db and start again
      await dbHandler.clearDatabase();
      await generateMockusersB();

      // Fast forward 4:59:99 into the future
      restoreDateMock = mockDate(statisticsLifetime + 1);
      const statisticsB = await getStatistics();
      restoreDateMock();

      expect(statisticsA).not.toEqual(statisticsB);
    });

    test('Force refresh', async () => {
      await generateMockusersA();

      const statisticsA = await getStatistics();

      // Clear db and start again
      await dbHandler.clearDatabase();
      await generateMockusersB();

      const statisticsB = await getStatistics(true);

      expect(statisticsA).not.toEqual(statisticsB);
    });
  });

  describe('Content', () => {
    test('Status', async () => {

    });

    test('Gender', async () => {

    });

    test('Swag', async () => {

    });

    test('Roles', async () => {

    });

    test('Review', async () => {

    });
  });
});

import mongoose from 'mongoose';
import User from '../../models/user/User';
import { getStatistics, statisticsLifetime } from '../../services/statistics';
import * as dbHandler from '../db-handler';
import { hackerUser, mockDate } from '../test-utils';

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

/**
 * Format of cases:
 * cases = [
 *  {...}, # x1
 *  {...}, # x2
 *  {...}, # x3
 * ]
 *
 * n Users are generated with the (n-1)th entry in cases. (where n starts from 0)
 */
const generateUsersFromTestCase = async (cases: any[]) => {
  const promises: any[] = [];

  for (let j = 0; j < cases.length; j++) {
    const payload = cases[j] as any;

    for (let i = 0; i <= j; i++) {
      promises.push(User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        ...payload,
      }));
    }
  }

  await Promise.all(promises);
};

describe('Get statistics', () => {
  describe('Cache', () => {
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
    test('Total', async () => {
      await generateMockusersA();

      const statistics = await getStatistics(true);

      expect(statistics.total).toEqual(2);
    });

    test('Status', async () => {
      // Okay yes this is a bit sketchy, but it works
      const statuses = [
        'applied',
        'accepted',
        'rejected',
        'waitlisted',
        'confirmed',
        'declined',
        'expired',
        'checkedIn',
      ];

      const expectedStatus: any = {};
      const promises: any[] = [];

      for (let i = 0; i < statuses.length; i++) {

        const status: any = {};
        status[statuses[i]] = true;

        for (let k = 0; k < i; k++) {
          promises.push(User.create({
            ...hackerUser,
            _id: mongoose.Types.ObjectId(),
            status: status,
          }));
        }

        expectedStatus[statuses[i]] = i;
      }

      await Promise.all(promises);
      const statistics = await getStatistics(true);
      expect(statistics.hacker.status).toEqual(expectedStatus);
    });

    test('Gender', async () => {
      const cases = ['Male', 'Female', 'Other', 'Non-Binary', 'Prefer not to say'].map((x) => (
        {
          hackerApplication: {
            gender: x,
          },
          status: {
            applied: true
          },
        }
      ));

      // Make sure we only consider applied users
      cases.push({
        hackerApplication: {
          gender: "Male",
        },
        status: {
          applied: false
        },
      });

      await generateUsersFromTestCase(cases);
      const statistics = await getStatistics(true);
      expect(statistics.hacker.submittedApplicationStats.gender).toEqual({
        male: 1,
        female: 2,
        other: 3,
        nonBinary: 4,
        chooseNotToSay: 5,
      });
    });

    test('Swag', async () => {
      const cases = [
        {
          hackerApplication: {
            wantSwag: true,
          },
          status: {
            applied: false,
          },
        },
        {
          hackerApplication: {
            wantSwag: true,
          },
          status: {
            applied: true,
          },
        },
        {
          hackerApplication: {
            wantSwag: false,
          },
          status: {
            applied: true,
          },
        },
      ];

      await generateUsersFromTestCase(cases);
      const statistics = await getStatistics(true);
      expect(statistics.hacker.submittedApplicationStats.swag).toEqual({
        wantSwag: 2,
        noSwag: 3,
      });
    });

    test('Groups', async () => {
      const cases = ["hacker", "admin", "organizer", "volunteer"].map((x) => {
        const c: any = {
          groups: {},
        };

        c.groups[x] = true;

        return c;
      });

      await generateUsersFromTestCase(cases);
      const statistics = await getStatistics(true);
      expect(statistics.groups).toEqual({
        hacker: 1,
        admin: 2,
        organizer: 3,
        volunteer: 4,
      });
    });

    test('Review', async () => {
      const cases = [
        {
          status: { applied: false },
          internal: { applicationScores: [1, 2, 3] }
        },
        {
          status: { applied: true },
          internal: { applicationScores: [1, 2, 3] }
        },
        {
          status: { applied: true },
          internal: { applicationScores: [] }
        },
      ];

      await generateUsersFromTestCase(cases);
      const statistics = await getStatistics(true);
      expect(statistics.hacker.submittedApplicationStats.review).toEqual({
        reviewed: 2,
        notReviewed: 3
      });
    });
  });
});

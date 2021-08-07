import mongoose from 'mongoose';
import { getObject } from '../../../controller/ModelController';
import { ITeam } from '../../../models/team/fields';
import Team from '../../../models/team/Team';
import computeApplicationScore from '../../../models/user/computeApplicationScore';
import User from '../../../models/user/User';
import {
  hackerUser,
  organizerUser,
  runAfterAll,
  runAfterEach,
  runBeforeAll,
  runBeforeEach,
} from '../../test-utils';

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(runBeforeAll);

/**
 * Clear all test data after every test.
 */
afterEach(runAfterEach);

beforeEach(runBeforeEach);

/**
 * Remove and close the db and server.
 */
afterAll(runAfterAll);


jest.mock('../../../models/user/computeApplicationScore', () => jest.fn((): any => undefined));

describe('Virtual and Intercept', () => {

  test('Member Names', async () => {
    const userA = await User.create({
      ...hackerUser,
      _id: mongoose.Types.ObjectId(),
      firstName: 'Foo',
      lastName: 'Bar',
      hackerApplication: {
        teamCode: 'banana',
      },
    });

    const userB = await User.create({
      ...hackerUser,
      _id: mongoose.Types.ObjectId(),
      firstName: 'Smoothie',
      lastName: 'Banana',
      hackerApplication: {
        teamCode: 'banana',
      },
    });

    await Team.create({
      code: 'banana',
      memberIDs: [
        userA._id,
        userB._id,
      ],
    } as ITeam);

    const team = (await getObject(userA, 'team', {
      filter: {
        code: 'banana',
      },
    }))[0];

    expect(team).toEqual({
      code: 'banana',
      memberNames: [
        'Foo Bar',
        'Smoothie Banana',
      ],
    });
  });

  describe('Team Score', () => {
    test('Partially Graded Team', async () => {
      const userA = await User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        firstName: 'Foo',
        lastName: 'Bar',
        hackerApplication: {
          teamCode: 'banana',
        },
      });

      const userB = await User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        firstName: 'Smoothie',
        lastName: 'Banana',
        hackerApplication: {
          teamCode: 'banana',
        },
      });

      await Team.create({
        code: 'banana',
        memberIDs: [
          userA._id,
          userB._id,
        ],
      } as ITeam);

      const scoreMap: any = {};

      scoreMap[userA._id] = 1000;
      computeApplicationScore.mockImplementation(function() {
        return scoreMap[this._id] || -1;
      });

      const team = (await getObject(organizerUser, 'team', {
        filter: {
          code: 'banana',
        },
      }))[0];

      expect(team.teamScore).toEqual(-1);
    });

    test('Fully Graded Team', async () => {
      const userA = await User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        firstName: 'Foo',
        lastName: 'Bar',
        hackerApplication: {
          teamCode: 'banana',
        },
      });

      const userB = await User.create({
        ...hackerUser,
        _id: mongoose.Types.ObjectId(),
        firstName: 'Smoothie',
        lastName: 'Banana',
        hackerApplication: {
          teamCode: 'banana',
        },
      });

      await Team.create({
        code: 'banana',
        memberIDs: [
          userA._id,
          userB._id,
        ],
      } as ITeam);

      const scoreMap: any = {};

      scoreMap[userA._id] = 11;
      scoreMap[userB._id] = 0;
      computeApplicationScore.mockImplementation(function() {
        return scoreMap[this._id] === undefined ? -1 : scoreMap[this._id];
      });

      const team = (await getObject(organizerUser, 'team', {
        filter: {
          code: 'banana',
        },
      }))[0];

      expect(team.teamScore).toEqual(5.5);
    });
  });
});

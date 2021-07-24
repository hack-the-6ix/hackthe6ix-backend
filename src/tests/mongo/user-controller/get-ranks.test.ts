import mongoose from 'mongoose';
import { getRanks } from '../../../controller/UserController';
import { ITeam } from '../../../models/team/fields';
import Team from '../../../models/team/Team';
import computeApplicationScore from '../../../models/user/computeApplicationScore';
import { IUser } from '../../../models/user/fields';
import User from '../../../models/user/User';
import { hackerUser, runAfterAll, runAfterEach, runBeforeAll } from '../../test-utils';

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

jest.mock('../../../models/user/computeApplicationScore', () => jest.fn((): any => undefined));

const createUsers = async (num: number, lastUpdated?: number[]) => {

  let out: IUser[] = [];

  for (let i = 0; i < num; i++) {
    out.push(await User.create({
      ...hackerUser,
      _id: mongoose.Types.ObjectId(),
      status: {
        applied: true,
      },
      hackerApplication: {
        lastUpdated: (lastUpdated || [])[i] || new Date().getTime(),
      },
    }));
  }

  return out;

};

describe('Get ranks', () => {

  test('No users', async () => {
    const users = await getRanks();
    expect(users.length).toEqual(0);
  });

  test('Non-applied', async () => {
    User.create(hackerUser);

    const users = await getRanks();
    expect(users.length).toEqual(0);
  });

  test('Applied but not graded', async () => {
    const hacker = await User.create({
      ...hackerUser,
      status: {
        applied: true,
      },
    });

    const expectedUsers = [
      hacker,
    ].map(user => user.toJSON());

    const users = await getRanks();
    expect(users).toMatchObject(expectedUsers);
  });

  test('Graded and ungraded users', async () => {
    const rawUsers = await createUsers(6, [1000, 1, 1, 1, 1, 1, 1]);
    User.create(hackerUser); // non-applied user

    const scoreMap: any = {};

    scoreMap[rawUsers[2]._id] = 1000;
    scoreMap[rawUsers[0]._id] = 1000;
    scoreMap[rawUsers[4]._id] = 1000000;
    scoreMap[rawUsers[5]._id] = 2000;

    computeApplicationScore.mockImplementation(function() {
      return scoreMap[this._id] || -1;
    });

    const expectedUsers = [
      rawUsers[4],
      rawUsers[5],
      rawUsers[2],
      rawUsers[0],
      rawUsers[1],
      rawUsers[3],
    ].map(user => user.toJSON());

    const outUsers = await getRanks();
    expect(outUsers).toMatchObject(expectedUsers);
  });

  describe('Team score adjustment', () => {

    test('Team score boost', async () => {
      const mockTeamCode = 'banana';

      const userA = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        hackerApplication: {
          teamCode: mockTeamCode,
        },
        _id: mongoose.Types.ObjectId(),
      });
      const userB = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        _id: mongoose.Types.ObjectId(),
      });
      const userC = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        hackerApplication: {
          teamCode: mockTeamCode,
        },
        _id: mongoose.Types.ObjectId(),
      });

      await Team.create({
        code: mockTeamCode,
        memberIDs: [
          userA._id,
          userC._id,
        ],
      } as ITeam);

      const scoreMap: any = {};

      scoreMap[userA._id] = 100;
      scoreMap[userB._id] = 101;
      scoreMap[userC._id] = 1000000;

      // Originally the order was C > B > A, but now C helped boost A to be higher than B

      computeApplicationScore.mockImplementation(function() {
        return scoreMap[this._id] || -1;
      });

      const expectedUsers = [
        userC,
        userA,
        userB,
      ].map(user => user.toJSON());

      const outUsers = await getRanks();
      expect(outUsers).toMatchObject(expectedUsers);
    });


    test('Team score actually made it worse', async () => {

      const mockTeamCode = 'banana';

      const userA = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        hackerApplication: {
          teamCode: mockTeamCode,
        },
        _id: mongoose.Types.ObjectId(),
      });
      const userB = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        _id: mongoose.Types.ObjectId(),
      });
      const userC = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
        hackerApplication: {
          teamCode: mockTeamCode,
        },
        _id: mongoose.Types.ObjectId(),
      });
      await Team.create({
        code: mockTeamCode,
        memberIDs: [
          userB._id,
          userC._id,
        ],
      } as ITeam);

      const scoreMap: any = {};

      scoreMap[userA._id] = 100;
      scoreMap[userB._id] = 101;
      scoreMap[userC._id] = 0;

      // Originally the order was B > A > C. If B and C team up, C should not drag down B's score.

      computeApplicationScore.mockImplementation(function() {
        return scoreMap[this._id] || -1;
      });

      const expectedUsers = [
        userB,
        userA,
        userC,
      ].map(user => user.toJSON());

      const outUsers = await getRanks();
      expect(outUsers).toMatchObject(expectedUsers);

    });

  });
});

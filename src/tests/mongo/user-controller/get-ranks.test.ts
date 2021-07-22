import mongoose from 'mongoose';
import { getRanks } from '../../../controller/UserController';
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

const createUsers = async (num: number) => {

  let out: IUser[] = [];

  for (let i = 0; i < num; i++) {
    out.push(await User.create({
      ...hackerUser,
      _id: mongoose.Types.ObjectId(),
      status: {
        applied: true,
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
    const rawUsers = await createUsers(6);
    User.create(hackerUser); // non-applied user

    const scoreMap: any = {};

    scoreMap[rawUsers[2]._id] = 1000;
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
});

import { getTeam } from '../../../controller/TeamController';
import { fetchUniverseState } from '../../../controller/util/resources';
import Team from '../../../models/team/Team';
import User from '../../../models/user/User';
import { InternalServerError, UnknownTeamError } from '../../../types/types';
import * as dbHandler from '../db-handler';
import { generateMockUniverseState, hackerUser } from '../test-utils';

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

jest.mock('../../../controller/util/resources', () => {
  const { getModels } = jest.requireActual('../../../controller/util/resources');
  return {
    fetchUniverseState: jest.fn(),
    getModels: getModels,
  };
});

describe('Get team', () => {
  test('No team', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    const user = await User.create(hackerUser);

    await expect(getTeam(user)).rejects.toThrow(UnknownTeamError);

  });

  test('Multiple teams same code', async () => {
    // This should never happen...
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    const mockTeam = {
      code: 'banana',
    };

    await Team.create({ ...mockTeam, memberIDs: ['foo', hackerUser._id.toString()] });
    await Team.create({ ...mockTeam, memberIDs: ['bar', hackerUser._id.toString()] });

    const user = await User.create({
      ...hackerUser,
      hackerApplication: {
        teamCode: mockTeam.code,
      },
    });

    await expect(getTeam(user)).rejects.toThrow(InternalServerError);
  });

  test('Success', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    const mockTeam = {
      code: 'banana',
      memberIDs: [
        hackerUser._id,
      ],
    };

    const team = await Team.create(mockTeam);
    const user = await User.create({
      ...hackerUser,
      hackerApplication: {
        teamCode: mockTeam.code,
      },
    });

    const result = await getTeam(user);

    expect(result).toEqual({
      code: mockTeam.code,
      memberNames: [
        user.fullName,
      ],
    });
  });
});

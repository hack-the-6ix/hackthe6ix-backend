import { getTeam } from '../../../controller/TeamController';
import { fetchUniverseState } from '../../../controller/util/resources';
import Team from '../../../models/team/Team';
import User from '../../../models/user/User';
import { InternalServerError, UnknownTeamError } from '../../../types/errors';
import {
  generateMockUniverseState,
  hackerUser,
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

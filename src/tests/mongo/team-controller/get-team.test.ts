import { getTeam } from '../../../controller/TeamController';
import Team from '../../../models/team/Team';
import User from '../../../models/user/User';
import { InternalServerError, UnknownTeamError } from '../../../types/errors';
import {
  generateMockUniverseState,
  hackerUser,
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


describe('Get team', () => {
  test('No team', async () => {
    await generateMockUniverseState();

    const user = await User.create(hackerUser);

    await expect(getTeam(user)).rejects.toThrow(UnknownTeamError);

  });

  test('Multiple teams same code', async () => {
    // This should never happen...
    await generateMockUniverseState();

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
    await generateMockUniverseState();

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

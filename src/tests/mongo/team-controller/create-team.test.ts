import { createTeam } from '../../../controller/TeamController';
import { fetchUniverseState } from '../../../controller/util/resources';
import Team from '../../../models/team/Team';
import User from '../../../models/user/User';
import {
  AlreadyInTeamError,
  AlreadySubmittedError,
  DeadlineExpiredError,
} from '../../../types/types';
import * as dbHandler from '../../db-handler';
import { generateMockUniverseState, hackerUser } from '../../test-utils';

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

describe('Create Team', () => {
  test('No existing team', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    const user = await User.create(hackerUser);
    const team = await createTeam(user);

    const teamCode = team.code;

    // Verify immediate response
    expect(teamCode).toBeTruthy();
    expect(team).toEqual({
      code: teamCode,
      memberNames: [
        user.fullName,
      ],
    });

    // Verify user object updated successfully
    const updatedUser = await User.findOne({
      _id: hackerUser._id,
    });

    expect(updatedUser.hackerApplication.teamCode).toEqual(teamCode);

    // Very team is saved successfully
    const updatedTeam = (await Team.findOne({
      code: teamCode,
    })).toJSON();

    expect(updatedTeam.code).toEqual(teamCode);
    expect(updatedTeam.memberIDs).toEqual([
      hackerUser._id.toString(),
    ]);
  });

  test('Already in a team', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    const user = await User.create({
      ...hackerUser,
      hackerApplication: {
        teamCode: 'foo',
      },
    });

    await expect(createTeam(user)).rejects.toThrow(AlreadyInTeamError);

    // No team created
    expect(await Team.find({})).toEqual([]);

    // User is not amended
    expect((await User.findOne({ _id: user._id })).hackerApplication.teamCode).toEqual('foo');
  });

  test('Application window elapsed', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));

    const user = await User.create(hackerUser);
    await expect(createTeam(user)).rejects.toThrow(DeadlineExpiredError);

    // No team created
    expect(await Team.find({})).toEqual([]);

    // User is not amended
    expect((await User.findOne({ _id: user._id })).toJSON().hackerApplication).toEqual(undefined);
  });

  test('User already applied', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    const user = await User.create({
      ...hackerUser,
      status: {
        applied: true
      }
    });

    await expect(createTeam(user)).rejects.toThrow(AlreadySubmittedError);

    // No team created
    expect(await Team.find({})).toEqual([]);

    // User is not amended
    expect((await User.findOne({ _id: user._id })).toJSON().hackerApplication).toEqual(undefined);
  });
});

import { createTeam } from '../../../controller/TeamController';
import Team from '../../../models/team/Team';
import User from '../../../models/user/User';
import { AlreadyInTeamError, DeadlineExpiredError } from '../../../types/errors';
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



describe('Create Team', () => {
  test('No existing team', async () => {
    await generateMockUniverseState();

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
    await generateMockUniverseState();

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
    await generateMockUniverseState(-10000);

    const user = await User.create(hackerUser);
    await expect(createTeam(user)).rejects.toThrow(DeadlineExpiredError);

    // No team created
    expect(await Team.find({})).toEqual([]);

    // User is not amended
    expect((await User.findOne({ _id: user._id })).toJSON().hackerApplication).toEqual(undefined);
  });
});

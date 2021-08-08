import { leaveTeam } from '../../../controller/TeamController';
import Team from '../../../models/team/Team';
import User from '../../../models/user/User';
import { DeadlineExpiredError, UnknownTeamError } from '../../../types/errors';
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


describe('Leave Team', () => {
  test('Not in team', async () => {
    await generateMockUniverseState();

    const user = await User.create(hackerUser);
    await expect(leaveTeam(user)).rejects.toThrow(UnknownTeamError);
  });

  test('Application window elapsed', async () => {
    await generateMockUniverseState(-100000);

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
        memberIDs: [
          hackerUser._id,
        ],
      },
    });

    await expect(leaveTeam(user)).rejects.toThrow(DeadlineExpiredError);

    // User should still be in team
    expect((await User.findOne({ _id: user._id })).toJSON().hackerApplication.teamCode).toEqual(mockTeam.code);

    // Team should still have user
    expect((await Team.findOne({ code: team.code })).toJSON().memberIDs).toContain(mockTeam.memberIDs.toString());
  });

  describe('Success', () => {
    test('Last person', async () => {
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

      await leaveTeam(user);

      // Ensure user left team
      expect((await User.findOne({ _id: user._id })).hackerApplication.teamCode).toBeFalsy();

      // Ensure team is deleted
      expect((await Team.find({ code: team.code })).length).toEqual(0);
    });

    test('Not last person', async () => {
      await generateMockUniverseState();

      const mockTeam = {
        code: 'banana',
        memberIDs: [
          'foo',
          hackerUser._id,
          'bar',
        ],
      };

      const team = await Team.create(mockTeam);
      const user = await User.create({
        ...hackerUser,
        hackerApplication: {
          teamCode: mockTeam.code,
        },
      });

      await leaveTeam(user);

      // Ensure user left team
      expect((await User.findOne({ _id: user._id })).hackerApplication.teamCode).toBeFalsy();

      // Ensure team roster is updated
      expect((await Team.findOne({ code: team.code })).toJSON().memberIDs).toEqual([
        'foo',
        'bar',
      ]);
    });
  });
});

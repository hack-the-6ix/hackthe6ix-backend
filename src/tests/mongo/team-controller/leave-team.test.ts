import { leaveTeam } from '../../../controller/TeamController';
import { fetchUniverseState } from '../../../controller/util/resources';
import Team from '../../../models/team/Team';
import User from '../../../models/user/User';
import {
  AlreadySubmittedError,
  DeadlineExpiredError,
  UnknownTeamError,
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

describe('Leave Team', () => {
  test('Not in team', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    const user = await User.create(hackerUser);
    await expect(leaveTeam(user)).rejects.toThrow(UnknownTeamError);
  });

  test('Application window elapsed', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState(-1000));

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

  test('Already applied', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    const mockTeam = {
      code: 'banana',
      memberIDs: [
        hackerUser._id.toString(),
      ],
    };

    const team = await Team.create(mockTeam);
    const user = await User.create({
      ...hackerUser,
      hackerApplication: {
        teamCode: mockTeam.code,
      },
      status: {
        applied: true,
      },
    });

    await expect(leaveTeam(user)).rejects.toThrow(AlreadySubmittedError);

    // User should still be in team
    expect((await User.findOne({ _id: user._id })).toJSON().hackerApplication.teamCode).toEqual(mockTeam.code);

    // Team should still have user
    expect((await Team.findOne({ code: team.code })).toJSON().memberIDs).toEqual(mockTeam.memberIDs);
  });

  describe('Success', () => {
    test('Last person', async () => {
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

      await leaveTeam(user);

      // Ensure user left team
      expect((await User.findOne({ _id: user._id })).hackerApplication.teamCode).toBeFalsy();

      // Ensure team is deleted
      expect((await Team.find({ code: team.code })).length).toEqual(0);
    });

    test('Not last person', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

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

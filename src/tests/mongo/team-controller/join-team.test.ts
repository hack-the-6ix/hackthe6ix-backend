import { joinTeam } from '../../../controller/TeamController';
import { fetchUniverseState } from '../../../controller/util/resources';
import Team from '../../../models/team/Team';
import User from '../../../models/user/User';
import {
  AlreadyInTeamError,
  AlreadySubmittedError,
  BadRequestError,
  DeadlineExpiredError,
  TeamFullError,
  UnknownTeamError,
} from '../../../types/types';
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

describe('Join Team', () => {
  test('Success', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    await Team.create({
      code: 'foo',
      memberIDs: [
        'a', 'b', 'c',
      ],
    });

    const user = await User.create(hackerUser);
    const response = await joinTeam(user, 'foo');

    expect((await User.findOne({ _id: user._id })).toJSON().hackerApplication).toEqual({
      teamCode: response.code,
    });

    expect((await Team.findOne({ code: response.code })).toJSON().memberIDs).toEqual(
      ['a', 'b', 'c', user._id.toString()],
    );
  });

  test('Invalid team (Blank)', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    const user = await User.create(hackerUser);
    await expect(joinTeam(user, undefined)).rejects.toThrow(BadRequestError);

    // User is not amended
    expect((await User.findOne({ _id: user._id })).toJSON().hackerApplication).toEqual(undefined);
  });

  test('Invalid team (Gibberish)', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    const user = await User.create(hackerUser);
    await expect(joinTeam(user, 'ASDASDasdASDASDAS')).rejects.toThrow(UnknownTeamError);

    // User is not amended
    expect((await User.findOne({ _id: user._id })).toJSON().hackerApplication).toEqual(undefined);
  });

  test('Team is full', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    await Team.create({
      code: 'foo',
      memberIDs: [
        'a', 'b', 'c', 'd',
      ],
    });

    const user = await User.create(hackerUser);
    await expect(joinTeam(user, 'foo')).rejects.toThrow(TeamFullError);

    // User is not amended
    expect((await User.findOne({ _id: user._id })).toJSON().hackerApplication).toEqual(undefined);
  });

  test('Already in a team', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    const mockTeam = {
      code: 'foo',
      memberIDs: [
        'a',
      ],
    };

    const team = await Team.create(mockTeam);

    const user = await User.create({
      ...hackerUser,
      hackerApplication: {
        teamCode: 'banana',
      },
    });

    await expect(joinTeam(user, mockTeam.code)).rejects.toThrow(AlreadyInTeamError);

    // User is not amended
    expect((await User.findOne({ _id: user._id })).toJSON().hackerApplication).toEqual({
      teamCode: 'banana',
    });

    // Team not amended
    expect((await Team.findOne({ code: mockTeam.code })).toJSON().memberIDs).toEqual(mockTeam.memberIDs);
  });

  test('Application window elapsed', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));

    const mockTeam = {
      code: 'foo',
      memberIDs: [
        'a',
      ],
    };

    const team = await Team.create(mockTeam);
    const user = await User.create(hackerUser);

    await expect(joinTeam(user, mockTeam.code)).rejects.toThrow(DeadlineExpiredError);

    // User is not amended
    expect((await User.findOne({ _id: user._id })).toJSON().hackerApplication).toEqual(undefined);

    // Team not amended
    expect((await Team.findOne({ code: mockTeam.code })).toJSON().memberIDs).toEqual(mockTeam.memberIDs);
  });

  test('User already applied', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    const mockTeam = {
      code: 'foo',
      memberIDs: [
        'a',
      ],
    };

    const team = await Team.create(mockTeam);
    const user = await User.create({
      ...hackerUser,
      status: {
        applied: true,
      },
    });

    await expect(joinTeam(user, mockTeam.code)).rejects.toThrow(AlreadySubmittedError);

    // User is not amended
    expect((await User.findOne({ _id: user._id })).toJSON().hackerApplication).toEqual(undefined);

    // Team not amended
    expect((await Team.findOne({ code: mockTeam.code })).toJSON().memberIDs).toEqual(mockTeam.memberIDs);
  });
});

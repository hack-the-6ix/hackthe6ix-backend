import { verifyDiscordUser } from '../../../controller/DiscordController';
import { fetchUniverseState } from '../../../controller/util/resources';
import User from '../../../models/user/User';
import ExternalUser from '../../../models/externaluser/ExternalUser';
import {
  confirmedHackerUser,
  externalUser,
  generateMockUniverseState,
  hackerUser,
  organizerUser,
  runAfterAll,
  runAfterEach,
  runBeforeAll,
  } from '../../test-utils';
import { NotFoundError } from '../../../types/errors';

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

const DISCORD_ID = '12345';
const DISCORD_ID2 = '123456';
const DISCORD_NAME = 'confirmedhacker'

const SIM_TIME = Date.now()

describe('Verify user in Discord', () => {
  describe('All users', () => {
    test('User does not exist', async () => {
      await expect(async () => {
        const userInfo = await verifyDiscordUser(hackerUser.email, DISCORD_ID, DISCORD_NAME);
      }).rejects.toThrow(NotFoundError);
    })
  })
  describe('Internal user', () => {
    test('User not confirmed', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create(hackerUser);

      await expect(async () => {
        const userInfo = await verifyDiscordUser(hackerUser.email, DISCORD_ID, DISCORD_NAME);
      }).rejects.toThrow(NotFoundError);
    });

    test('No past verification, no additional roles', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create(confirmedHackerUser);

      const userInfo = await verifyDiscordUser(confirmedHackerUser.email, DISCORD_ID, DISCORD_NAME, SIM_TIME);

      expect(userInfo).toEqual({
        firstName: confirmedHackerUser.firstName,
        lastName: confirmedHackerUser.lastName,
        email: confirmedHackerUser.email,
        roles: ['hacker']
      });

      const newUser = await User.findOne({
        _id: confirmedHackerUser._id
      });

      expect(newUser.status?.checkedIn).toEqual(true);
      expect(newUser.discord?.discordID).toEqual(DISCORD_ID);
      expect(newUser.discord?.username).toEqual(DISCORD_NAME);
      expect(newUser.discord?.verifyTime).toEqual(SIM_TIME);
    });

    test('Matching past verification', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...confirmedHackerUser,
        discord: {
          discordID: DISCORD_ID,
          verifyTime: 0
        }
      });

      const userInfo = await verifyDiscordUser(confirmedHackerUser.email, DISCORD_ID, DISCORD_NAME, SIM_TIME);

      expect(userInfo).toEqual({
        firstName: confirmedHackerUser.firstName,
        lastName: confirmedHackerUser.lastName,
        email: confirmedHackerUser.email,
        roles: ['hacker']
      });

      const newUser = await User.findOne({
        _id: confirmedHackerUser._id
      });

      expect(newUser.status?.checkedIn).toEqual(true);
      expect(newUser.discord?.discordID).toEqual(DISCORD_ID);
      expect(newUser.discord?.username).toEqual(DISCORD_NAME);
      expect(newUser.discord?.verifyTime).toEqual(SIM_TIME);
    });

    test('Not matching past verification', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...confirmedHackerUser,
        discord: {
          discordID: DISCORD_ID
        }
      });

      await expect(async () => {
        const userInfo = await verifyDiscordUser(hackerUser.email, DISCORD_ID2, DISCORD_NAME);
      }).rejects.toThrow(NotFoundError);
    });

    test('With suffix', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...confirmedHackerUser,
        discord: {
          additionalRoles: ['testrole'],
          suffix: 'testsuffix'
        }
      });

      const userInfo = await verifyDiscordUser(confirmedHackerUser.email, DISCORD_ID, DISCORD_NAME);

      expect(userInfo).toEqual({
        firstName: confirmedHackerUser.firstName,
        lastName: confirmedHackerUser.lastName,
        email: confirmedHackerUser.email,
        suffix: 'testsuffix',
        roles: ['testrole', 'hacker']
      });
    });

    test('Additional roles', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...confirmedHackerUser,
        discord: {
          additionalRoles: ['testrole']
        }
      });

      const userInfo = await verifyDiscordUser(confirmedHackerUser.email, DISCORD_ID, DISCORD_NAME);

      expect(userInfo).toEqual({
        firstName: confirmedHackerUser.firstName,
        lastName: confirmedHackerUser.lastName,
        email: confirmedHackerUser.email,
        roles: ['testrole', 'hacker']
      });
    });

    test('Disallow verification with organizer/admin account', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create(organizerUser);

      await expect(async () => {
        const userInfo = await verifyDiscordUser(organizerUser.email, DISCORD_ID, DISCORD_NAME);
      }).rejects.toThrow(NotFoundError);
    })
  });

  describe('External user', () => {
    test('No past verification, no additional roles', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());
      const eUser = await ExternalUser.create(externalUser);

      const userInfo = await verifyDiscordUser(externalUser.email, DISCORD_ID, DISCORD_NAME, SIM_TIME);

      expect(userInfo).toEqual({
        firstName: externalUser.firstName,
        lastName: externalUser.lastName,
        email: externalUser.email,
        roles: []
      });

      const newUser = await ExternalUser.findOne({
        _id: externalUser._id
      });

      expect(newUser.discord?.discordID).toEqual(DISCORD_ID);
      expect(newUser.discord?.username).toEqual(DISCORD_NAME);
      expect(newUser.discord?.verifyTime).toEqual(SIM_TIME);
    });

    test('Matching past verification', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());
      const eUser = await ExternalUser.create({
        ...externalUser, 
        discord: {
          discordID: DISCORD_ID,
          verifyTime: 0
        }
      });

      const userInfo = await verifyDiscordUser(externalUser.email, DISCORD_ID, DISCORD_NAME, SIM_TIME);

      expect(userInfo).toEqual({
        firstName: externalUser.firstName,
        lastName: externalUser.lastName,
        email: externalUser.email,
        roles: []
      });

      const newUser = await ExternalUser.findOne({
        _id: externalUser._id
      });

      expect(newUser.discord?.discordID).toEqual(DISCORD_ID);
      expect(newUser.discord?.username).toEqual(DISCORD_NAME);
      expect(newUser.discord?.verifyTime).toEqual(SIM_TIME);
    });

    test('Not matching past verification', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());
      const eUser = await ExternalUser.create({
        ...externalUser, 
        discord: {
          discordID: DISCORD_ID
        }
      });

      await expect(async () => {
        const userInfo = await verifyDiscordUser(externalUser.email, DISCORD_ID2, DISCORD_NAME);
      }).rejects.toThrow(NotFoundError);
    });

    test('With suffix', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());
      const eUser = await ExternalUser.create({
        ...externalUser, 
        discord: {
          discordID: DISCORD_ID,
          additionalRoles: ['testrole'],
          suffix: 'testsuffix'
        }
      });

      const userInfo = await verifyDiscordUser(externalUser.email, DISCORD_ID, DISCORD_NAME);

      expect(userInfo).toEqual({
        firstName: externalUser.firstName,
        lastName: externalUser.lastName,
        email: externalUser.email,
        suffix: 'testsuffix',
        roles: ['testrole']
      });
    });

    test('Additional roles', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());
      const eUser = await ExternalUser.create({
        ...externalUser, 
        discord: {
          discordID: DISCORD_ID,
          additionalRoles: ['testrole']
        }
      });

      const userInfo = await verifyDiscordUser(externalUser.email, DISCORD_ID, DISCORD_NAME);

      expect(userInfo).toEqual({
        firstName: externalUser.firstName,
        lastName: externalUser.lastName,
        email: externalUser.email,
        roles: ['testrole']
      });
    });
  })
})
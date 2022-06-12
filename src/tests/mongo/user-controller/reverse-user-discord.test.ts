import ExternalUser from '../../../models/externaluser/ExternalUser';
import User from '../../../models/user/User';
import {
    externalUser,
    generateMockUniverseState,
    hackerUser,
    runAfterAll,
    runAfterEach,
    runBeforeAll,
    runBeforeEach,
} from '../../test-utils';
import {fetchUserByDiscordID} from "../../../controller/UserController";

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

const FAKE_DISCORDID = "123456"

describe('Get user by Discord ID', () => {
    test('Internal user', async () => {
        await generateMockUniverseState();
        const user = await User.create({
            ...hackerUser,
            discord: {
                discordID: FAKE_DISCORDID
            }
        });

        const userInfo = await fetchUserByDiscordID(FAKE_DISCORDID);

        expect(userInfo._id).toEqual(user._id);
    });
    test('External user', async () => {
        await generateMockUniverseState();
        const eUser = await ExternalUser.create({
            ...externalUser,
            discord: {
                discordID: FAKE_DISCORDID
            }
        });

        const userInfo = await fetchUserByDiscordID(FAKE_DISCORDID);

        expect(userInfo._id).toEqual(eUser._id);
    });
});

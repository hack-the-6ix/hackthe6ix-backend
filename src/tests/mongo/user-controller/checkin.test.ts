import ExternalUser from '../../../models/externaluser/ExternalUser';
import User from '../../../models/user/User';
import { NotFoundError } from '../../../types/errors';
import {
    confirmedHackerUser,
    externalUser,
    generateMockUniverseState,
    hackerUser,
    runAfterAll,
    runAfterEach,
    runBeforeAll,
    runBeforeEach,
} from '../../test-utils';
import {checkIn} from "../../../controller/UserController";

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

const SIM_TIME = Date.now();

describe('Check in user', () => {
    describe('Internal user', () => {
        test('User confirmed', async () => {
            await generateMockUniverseState();

            const user = await User.create(confirmedHackerUser);

            const userInfo = await checkIn(user._id, "User", SIM_TIME);
            expect(userInfo.status?.checkedIn).toEqual(true);
            expect(userInfo.status?.checkInTime).toEqual(SIM_TIME);
        });
        test('User not confirmed', async () => {
            await generateMockUniverseState();

            const user = await User.create(hackerUser);

            await expect(async () => {
                await checkIn(user._id, "User");
            }).rejects.toThrow(NotFoundError);
        });

    });

    describe('External user', () => {
        test('Check in external user', async () => {
            await generateMockUniverseState();
            const eUser = await ExternalUser.create(externalUser);

            const userInfo = await checkIn(eUser._id, "ExternalUser", SIM_TIME);
            expect(userInfo.status?.checkedIn).toEqual(true);
            expect(userInfo.status?.checkInTime).toEqual(SIM_TIME);
        });

    });
});

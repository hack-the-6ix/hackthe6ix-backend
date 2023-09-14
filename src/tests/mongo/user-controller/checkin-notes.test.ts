import ExternalUser from '../../../models/externaluser/ExternalUser';
import User from '../../../models/user/User';
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
import {addCheckInNotes, checkIn, removeCheckInNotes} from "../../../controller/UserController";

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

const CHECK_IN_NOTES = ["TEST_NOTE"];
const NEW_NOTES = ["TEST_NOTE_2", "TEST_NOTE_3"];

describe('Modify user check-in notes', () => {
    describe('Internal user', () => {
        test('Add notes', async () => {
            await generateMockUniverseState();

            const user = await User.create({
                ...confirmedHackerUser,
                checkInNotes: CHECK_IN_NOTES
            });

            const noteAddResult = await addCheckInNotes(user._id.toString(), NEW_NOTES);

            const newUser = await User.findOne({
                _id: user._id
            })

            expect(noteAddResult.slice(0).sort()).toEqual(CHECK_IN_NOTES.concat(NEW_NOTES).sort());

            expect(newUser.checkInNotes.slice(0).sort()).toEqual(CHECK_IN_NOTES.concat(NEW_NOTES).sort());
        });
        test('Remove notes', async () => {
            await generateMockUniverseState();

            const user = await User.create({
                ...confirmedHackerUser,
                checkInNotes: CHECK_IN_NOTES.concat(NEW_NOTES)
            });

            const noteRemoveResult = await removeCheckInNotes(user._id.toString(), NEW_NOTES);

            const newUser = await User.findOne({
                _id: user._id
            })

            expect(noteRemoveResult.slice(0).sort()).toEqual(CHECK_IN_NOTES.slice(0).sort());

            expect(newUser.checkInNotes.slice(0).sort()).toEqual(CHECK_IN_NOTES.slice(0).sort());
        });

    });
});

import ExternalUser from '../../models/externaluser/ExternalUser';
import User from '../../models/user/User';
import {
    confirmedHackerUser,
    externalUser,
    generateMockUniverseState,
    hackerUser,
    runAfterAll,
    runAfterEach,
    runBeforeAll,
    runBeforeEach,
} from '../test-utils';
import QRTestData from '../../services/covid-qr-verify/testdata';
import {testing as keys} from "../../services/covid-qr-verify/keys";
import {submitCOVID19VaccineQR} from "../../controller/UserController";
import {BadRequestError, InternalServerError} from "../../types/errors";

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

const REQUIRED_COVID_FLAGS = ["MUST_SUBMIT_COVID19_VACCINE_QR", "MUST_PRESENT_COVID19_VACCINE_QR"]

describe('COVID-19 QR Code Verification', () => {
    test('User default check in notes', async () => {
        const user = await User.create(hackerUser);

        expect(user.checkInNotes).toEqual(
            expect.arrayContaining(REQUIRED_COVID_FLAGS)
        )
    })
    test('External user default check in notes', async () => {
        const eUser = await ExternalUser.create(externalUser);

        expect(eUser.checkInNotes).toEqual(
            expect.arrayContaining(REQUIRED_COVID_FLAGS)
        )

    })
    test('Valid PDF QR code', async () => {
        await generateMockUniverseState();
        const user = await User.create(hackerUser);

        const PDFData = Buffer.from(QRTestData.COVIDQR_TestPDF, 'base64');
        const mimeType = "application/pdf";

        const result = await submitCOVID19VaccineQR(user, PDFData, mimeType, keys, 2);

        const newUser = await User.findOne({
            _id: user._id
        })

        expect(result).toEqual(true);
        expect(newUser?.checkInNotes).toEqual(
            expect.not.arrayContaining(["MUST_SUBMIT_COVID19_VACCINE_QR"])
        )
        expect(newUser?.checkInNotes).toContain("MUST_PRESENT_COVID19_VACCINE_QR")
    })

    test('Valid PNG QR code', async () => {
        await generateMockUniverseState();
        const user = await User.create(hackerUser);

        const PNGData = Buffer.from(QRTestData.COVIDQR_TestPNGQR, 'base64');
        const mimeType = "image/png";

        const result = await submitCOVID19VaccineQR(user, PNGData, mimeType, keys, 2);

        const newUser = await User.findOne({
            _id: user._id
        })

        expect(result).toEqual(true);
        expect(newUser?.checkInNotes).toContain("MUST_PRESENT_COVID19_VACCINE_QR");
    })

    test('Invalid PNG QR Code (Insufficient doses)', async () => {
        await generateMockUniverseState();
        const user = await User.create(hackerUser);

        const PNGData = Buffer.from(QRTestData.COVIDQR_TestPNGQR, 'base64');
        const mimeType = "image/png";

        const result = await submitCOVID19VaccineQR(user, PNGData, mimeType, keys, 5);
        const newUser = await User.findOne({
            _id: user._id
        })

        expect(result).toEqual(false);
        expect(newUser.checkInNotes).toEqual(
            expect.arrayContaining(REQUIRED_COVID_FLAGS)
        )
    })

    test('Invalid PNG QR code (Invalid Signature)', async () => {
        await generateMockUniverseState();
        const user = await User.create(hackerUser);

        const PNGData = Buffer.from(QRTestData.COVIDQR_TestPNGQR, 'base64');
        const mimeType = "image/png";

        const result = await submitCOVID19VaccineQR(user, PNGData, mimeType);
        const newUser = await User.findOne({
            _id: user._id
        })

        expect(result).toEqual(false);
        expect(newUser.checkInNotes).toEqual(
            expect.arrayContaining(REQUIRED_COVID_FLAGS)
        )
    })

    test('Invalid PNG QR code (Not an SHC)', async () => {
        await generateMockUniverseState();
        const user = await User.create(hackerUser);

        const PNGData = Buffer.from(QRTestData.COVIDQR_TestPNGInvalidQR, 'base64');
        const mimeType = "image/png";

        await expect(async () => {
            const result = await submitCOVID19VaccineQR(user, PNGData, mimeType, keys, 5);
        }).rejects.toThrow(InternalServerError);

        const newUser = await User.findOne({
            _id: user._id
        })

        expect(newUser.checkInNotes).toEqual(
            expect.arrayContaining(REQUIRED_COVID_FLAGS)
        )
    })

    test('Invalid PNG QR code (No QR code)', async () => {
        await generateMockUniverseState();
        const user = await User.create(hackerUser);

        const PNGData = Buffer.from(QRTestData.COVIDQR_TestPNGNoQR, 'base64');
        const mimeType = "image/png";

        await expect(async () => {
            const result = await submitCOVID19VaccineQR(user, PNGData, mimeType, keys, 5);
        }).rejects.toThrow(BadRequestError);

        const newUser = await User.findOne({
            _id: user._id
        })

        expect(newUser.checkInNotes).toEqual(
            expect.arrayContaining(REQUIRED_COVID_FLAGS)
        )
    })
});

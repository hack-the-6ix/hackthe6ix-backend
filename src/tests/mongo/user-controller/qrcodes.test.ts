import ExternalUser from '../../../models/externaluser/ExternalUser';
import User from '../../../models/user/User';
import * as qrcode from 'qrcode';
import {
    externalUser,
    generateMockUniverseState,
    hackerUser,
    runAfterAll,
    runAfterEach,
    runBeforeAll,
    runBeforeEach,
} from '../../test-utils';
import {generateCheckInQR, getCheckInQR} from "../../../controller/UserController";
import {QRCodeGenerateRequest} from "../../../types/types";

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

const FAKE_QR = "123456";

function _generateQR(userID:string, userType: string):Promise<string> {
    return new Promise((resolve, reject) => {
        qrcode.toDataURL(JSON.stringify({
            "userID": String(userID),
            "userType": userType
        }), function (err, url) {
            if(err){
                return reject(err);
            }
            return resolve(url);
        })
    });
}

describe('QR Codes', () => {
    describe('Internal user', () => {
        test('Retrieve cached QR code', async () => {
            const user = await User.create({
                ...hackerUser,
                checkInQR: FAKE_QR
            });

            const qrCode = await getCheckInQR(user._id, "User");

            expect(qrCode).toEqual(FAKE_QR);
        })

        test('Generate and cache QR code', async () => {
            await generateMockUniverseState();

            const user = await User.create(hackerUser);
            const qrCode = await getCheckInQR(user._id, "User");

            const CORRECT_QR = await _generateQR(user._id, "User");

            expect(qrCode).toEqual(CORRECT_QR);

            const newUser = await User.findOne({
                _id: hackerUser._id
            });

            expect(newUser.checkInQR).toEqual(CORRECT_QR);
        });
    });

    describe('External user', () => {
        test('Retrieve cached QR code', async () => {
            const user = await ExternalUser.create({
                ...externalUser,
                checkInQR: FAKE_QR
            });

            const qrCode = await getCheckInQR(user._id, "ExternalUser");

            expect(qrCode).toEqual(FAKE_QR);
        })

        test('Generate and cache QR code', async () => {
            await generateMockUniverseState();

            const eUser = await ExternalUser.create(externalUser);
            const qrCode = await getCheckInQR(eUser._id, "ExternalUser");

            const CORRECT_QR = await _generateQR(eUser._id, "ExternalUser");

            expect(qrCode).toEqual(CORRECT_QR);

            const newEUser = await ExternalUser.findOne({
                _id: externalUser._id
            });

            expect(newEUser.checkInQR).toEqual(CORRECT_QR);
        });
    });
    describe('All users', () => {
        test('Generate QR code from list', async () => {
            const user = await User.create(hackerUser);
            const eUser = await ExternalUser.create(externalUser);

            const userRequest = {
                userID: user._id,
                userType: "User"
            } as QRCodeGenerateRequest;

            const eUserRequest = {
                userID: eUser._id,
                userType: "ExternalUser"
            } as QRCodeGenerateRequest;

            const request: QRCodeGenerateRequest[] = [ userRequest, eUserRequest ];

            const codes = await generateCheckInQR(user, request);

            const CORRECT_QR = await _generateQR(user._id, "User");
            const CORRECT_QR_E = await _generateQR(eUser._id, "ExternalUser");

            expect(codes).toHaveLength(2);
            expect(codes).toContainEqual({
                ...userRequest,
                code: CORRECT_QR
            });
            expect(codes).toContainEqual({
                ...eUserRequest,
                code: CORRECT_QR_E
            });
        })
    })
});

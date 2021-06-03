import { createObject } from '../../../controller/ModelController';

import * as dbHandler from './db-handler';
import { hackerUser, mockModels, newHackerUser, organizerUser, voluteerUser } from '../test-utils';

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

/**
 * TODO: We don't really care what the test is, we just need to know that it works
 *       When writing new tests, make a new validation funciton that we can control the state of easily
 *
 *       Test the permission functions separately as this will greatly reduce the number of tests needed
 */

/*

  const testFields = {
    createCheck: (request: ReadCheckRequest) => isVolunteer(request.requestUser),
    deleteCheck: (request: ReadCheckRequest) => isAdmin(request.requestUser),
    readCheck: true,
    writeCheck: true,

    FIELDS: {

      read: {
        writeCheck: false,
        readCheck: true,

        FIELDS: {
          adminOnly: {
            type: Boolean,
            caption: 'Admin read only',

            writeCheck: false,
            readCheck: (request: ReadCheckRequest) => isAdmin(request.requestUser),
          },

          userOnly: {
            type: Boolean,
            caption: 'Hacker read only',

            writeCheck: false,
            readCheck: (request: ReadCheckRequest) => isUserOrOrganizer(request.requestUser, request.targetObject),
          },

          anyone: {
            type: Boolean,
            caption: 'Anyone can read',

            writeCheck: false,
            readCheck: true,
          },
        }
      },
    }
  };
 */

describe('Model Create', () => {

  describe('Create check', () => {
    test('Success', (done: any) => {
      createObject(
        hackerUser,
        'test',
        {},
        (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

          try {
            expect(error).toBeTruthy();
            done();
          } catch (e) {
            done(e);
          }

        },
        mockModels);
    });

    test('Fail', (done: any) => {
      createObject(
        hackerUser,
        'test',
        {},
        (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

          try {
            expect(error).toBeTruthy();
            done();
          } catch (e) {
            done(e);
          }

        },
        mockModels);
    });
  });

  describe('Write check', () => {

    test('Success', (done: any) => {
      createObject(
        voluteerUser,
        'test',
        {},
        (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

          try {
            expect(error).toBeFalsy();
            expect(data).toBeTruthy();
            done();
          } catch (e) {
            done(e);
          }

        },
        mockModels);
    });

    test('Fail', (done: any) => {
      createObject(
        voluteerUser,
        'test',
        {},
        (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

          try {
            expect(error).toBeFalsy();
            expect(data).toBeTruthy();
            done();
          } catch (e) {
            done(e);
          }

        },
        mockModels);
    });
  });

});

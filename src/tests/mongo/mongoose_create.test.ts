import { createObject } from '../../controller/ModelController';

import * as dbHandler from './db-handler';
import { hackerUser, mockModels, newHackerUser, organizerUser, voluteerUser } from './test-utils';

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


describe('Testing checkers', () => {

  describe('No permission to create', () => {
    test('Denied', (done: any) => {
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

    test('Allowed', (done: any) => {
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

  test('Write conditions not satisfied', (done: any) => {
    createObject(
      organizerUser,
      'user',
      newHackerUser,
      (error: { code: number, message: string, stacktrace?: string }, data?: any) => {
        console.log(error, data);

        done();
      });
  });
});

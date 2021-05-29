import { createObject } from '../../controller/ModelController';

import * as dbHandler from './db-handler';
import { newHackerUser, organizerUser } from './test-utils';

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
  test('No permission to create', (done: any) => {
    createObject(
      organizerUser,
      'user',
      newHackerUser,
      (error: { code: number, message: string, stacktrace?: string }, data?: any) => {
        console.log(error, data);

        done();
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

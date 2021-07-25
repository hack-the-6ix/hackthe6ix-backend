import { runAfterAll, runAfterEach, runBeforeAll } from '../../test-utils';

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

describe('Assign Application Status', () => {

  test('asd', () => {

  });

});

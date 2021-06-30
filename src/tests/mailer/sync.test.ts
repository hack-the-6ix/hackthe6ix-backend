import { fetchUniverseState } from '../../controller/util/resources';
import { generateMockUniverseState, runAfterAll, runAfterEach, runBeforeAll } from '../test-utils';

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
  await runBeforeAll();
  fetchUniverseState.mockReturnValue(generateMockUniverseState());
});

/**
 * Clear all test data after every test.
 */
afterEach(runAfterEach);

/**
 * Remove and close the db and server.
 */
afterAll(runAfterAll);

jest.mock('../../controller/util/resources', () => {
  const { getModels } = jest.requireActual('../../controller/util/resources');
  return {
    fetchUniverseState: jest.fn(),
    getModels: getModels,
  };
});

jest.mock('../../services/mailer/util/external', () => ({
  addSubscriptionRequest: jest.fn(),
  deleteSubscriptionRequest: jest.fn(),
  getList: jest.fn(),
  getMailingListSubscriptionsRequest: jest.fn(),
  getTemplate: jest.fn(),
  sendEmailRequest: jest.fn(),
}));

/**
 * TODO: Split mailer into multiple modules
 */

describe('Sync Mailing List', () => {

});

describe('Sync Mailing Lists', () => {

});

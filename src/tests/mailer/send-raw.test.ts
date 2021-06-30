import { fetchUniverseState } from '../../controller/util/resources';
import sendEmail from '../../services/mailer/sendEmail';
import { sendEmailRequest } from '../../services/mailer/util/external';
import { InternalServerError } from '../../types/errors';
import {
  generateMockUniverseState,
  hackerUser,
  mockErrorResponse,
  mockSuccessResponse,
  runAfterAll,
  runAfterEach,
  runBeforeAll,
} from '../test-utils';
import { mockSubject, mockTags, mockTagsParsed, mockTemplateID } from './test-utils';

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

describe('Send raw email', () => {
  test('Success', async () => {
    sendEmailRequest.mockReturnValue(mockSuccessResponse());

    await sendEmail(
      hackerUser.email,
      mockTemplateID,
      mockSubject,
      mockTags,
    );

    expect(sendEmailRequest).toHaveBeenCalledWith(
      hackerUser.email,
      mockTemplateID,
      mockSubject,
      mockTagsParsed,
    );
  });

  test('Fail', async () => {
    sendEmailRequest.mockReturnValue(mockErrorResponse());

    await expect(sendEmail(
      hackerUser.email,
      mockTemplateID,
      mockSubject,
      mockTags,
    )).rejects.toThrow(InternalServerError);
  });
});

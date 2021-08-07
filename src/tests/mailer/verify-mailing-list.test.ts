import { systemUser } from '../../consts';
import { getObject } from '../../controller/ModelController';
import User from '../../models/user/User';
import { addSubscriptionRequest, getList } from '../../services/mailer/util/external';
import verifyMailingList from '../../services/mailer/verifyMailingList';
import {
  organizerUser,
  runAfterAll,
  runAfterEach,
  runBeforeAll,
  runBeforeEach,
} from '../test-utils';
import { mockGetList, mockMailingLists } from './test-utils';

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

jest.mock('../../services/mailer/util/external', () => ({
  addSubscriptionRequest: jest.fn(),
  deleteSubscriptionRequest: jest.fn(),
  getList: jest.fn(),
  getMailingListSubscriptionsRequest: jest.fn(),
  getTemplate: jest.fn(),
  sendEmailRequest: jest.fn(),
}));

jest.mock('../../types/mailer', () => {
  const { mockMailingLists } = jest.requireActual('./test-utils');
  return {
    MailingList: mockMailingLists,
  };
});

test('Verify lists', async () => {
  getList.mockImplementation((x: string) => (mockGetList as any)[x]);

  const user = await User.create(organizerUser);
  const listNames = await verifyMailingList(user);

  const mailmerge = (await getObject(systemUser, 'user', {
    filter: {
      _id: user._id,
    },
  }))[0].mailmerge;

  expect(new Set(addSubscriptionRequest.mock.calls)).toEqual(new Set(
    Object.keys(mockMailingLists).map((list: string) => ([
      mockGetList[list].listID, `${list}@localhost`, mailmerge,
    ])),
  ));

  expect(new Set(listNames)).toEqual(new Set(Object.keys(mockMailingLists)));
});

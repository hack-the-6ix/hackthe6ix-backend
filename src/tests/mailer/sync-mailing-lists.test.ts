import mongoose from 'mongoose';
import User from '../../models/user/User';
import syncMailingList from '../../services/mailer/syncMailingList';
import syncMailingLists from '../../services/mailer/syncMailingLists';
import { getList } from '../../services/mailer/util/external';
import { hackerUser, runAfterAll, runAfterEach, runBeforeAll, runBeforeEach } from '../test-utils';
import { mockGetList, mockGetListFilterQuery, mockMailingLists } from './test-utils';

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

jest.mock('../../services/mailer/syncMailingList', () => jest.fn((): any => undefined));
jest.mock('../../types/mailer', () => {
  const { mockMailingLists } = jest.requireActual('./test-utils');
  return {
    MailingList: mockMailingLists,
  };
});

describe('Sync Mailing Lists', () => {
  test('Sync specific mailing lists', async () => {
    getList.mockImplementation((x: string) => (mockGetList as any)[x]);

    const selectedLists = [
      'list1',
      'list2',
    ];

    const lists = await syncMailingLists(selectedLists);

    expect(new Set(syncMailingList.mock.calls)).toEqual(new Set(selectedLists.map((k: string) => (
      [(mockGetList as any)[k].listID, [], undefined, undefined]
    ))));

    expect(new Set(getList.mock.calls)).toEqual(new Set(selectedLists.map((k: string) => (
      [(mockMailingLists as any)[k]]
    ))));

    expect(new Set(lists)).toEqual(new Set(selectedLists));
  });
  test('Sync all mailing lists', async () => {
    getList.mockImplementation((x: string) => (mockGetList as any)[x]);
    const lists = await syncMailingLists();

    expect(new Set(syncMailingList.mock.calls)).toEqual(new Set(Object.keys(mockMailingLists).map((k: string) => (
      [(mockGetList as any)[k].listID, [], undefined, undefined]
    ))));

    expect(new Set(getList.mock.calls)).toEqual(new Set(Object.keys(mockMailingLists).map((k: string) => (
      [(mockMailingLists as any)[k]]
    ))));

    expect(new Set(lists)).toEqual(new Set(Object.keys(mockMailingLists)));
  });
  test('Force Update', async () => {
    getList.mockImplementation((x: string) => (mockGetList as any)[x]);
    const lists = await syncMailingLists(undefined, true);

    expect(new Set(syncMailingList.mock.calls)).toEqual(new Set(Object.keys(mockMailingLists).map((k: string) => (
      [(mockGetList as any)[k].listID, [], true, undefined]
    ))));

    expect(new Set(getList.mock.calls)).toEqual(new Set(Object.keys(mockMailingLists).map((k: string) => (
      [(mockMailingLists as any)[k]]
    ))));

    expect(new Set(lists)).toEqual(new Set(Object.keys(mockMailingLists)));
  });
  test('Sync single user', async () => {
    getList.mockImplementation((x: string) => (mockGetList as any)[x]);
    const email = hackerUser.email;
    const lists = await syncMailingLists(undefined, false, email);

    expect(new Set(syncMailingList.mock.calls)).toEqual(new Set(Object.keys(mockMailingLists).map((k: string) => (
      [(mockGetList as any)[k].listID, [], false, email]
    ))));

    expect(new Set(getList.mock.calls)).toEqual(new Set(Object.keys(mockMailingLists).map((k: string) => (
      [(mockMailingLists as any)[k]]
    ))));

    expect(new Set(lists)).toEqual(new Set(Object.keys(mockMailingLists)));
  });
  test('Config is empty', async () => {
    getList.mockReturnValue({});
    const email = hackerUser.email;
    const lists = await syncMailingLists(undefined, false, email);

    expect(new Set(syncMailingList.mock.calls)).toEqual(new Set(Object.keys(mockMailingLists).map((k: string) => (
      ['', [], false, email]
    ))));

    expect(new Set(getList.mock.calls)).toEqual(new Set(Object.keys(mockMailingLists).map((k: string) => (
      [(mockMailingLists as any)[k]]
    ))));

    expect(new Set(lists)).toEqual(new Set(Object.keys(mockMailingLists)));
  });
  describe('Queries', () => {

    test('Standard', async () => {
      getList.mockImplementation((x: string) => (mockGetList as any)[x]);
      const apple = await User.create({
        ...hackerUser,
        _id: new mongoose.Types.ObjectId(),
        firstName: mockGetList.list1.query.firstName,
        email: 'apple@gmail.com',
      });
      const banana = await User.create({
        ...hackerUser,
        _id: new mongoose.Types.ObjectId(),
        firstName: mockGetList.list2.query.firstName,
        email: 'banana@gmail.com',
      });
      const orange = await User.create({
        ...hackerUser,
        _id: new mongoose.Types.ObjectId(),
        firstName: mockGetList.list3.query.firstName,
        email: 'orange@gmail.com',
      });

      const lists = await syncMailingLists();

      expect(new Set(syncMailingList.mock.calls)).toEqual(new Set([
        [mockGetList.list1.listID, [apple.email], undefined, undefined],
        [mockGetList.list2.listID, [banana.email], undefined, undefined],
        [mockGetList.list3.listID, [orange.email], undefined, undefined],
      ]));

      expect(new Set(getList.mock.calls)).toEqual(new Set(Object.keys(mockMailingLists).map((k: string) => (
        [(mockMailingLists as any)[k]]
      ))));

      expect(new Set(lists)).toEqual(new Set(Object.keys(mockMailingLists)));
    });

    test('Filter Query', async () => {
      getList.mockImplementation((x: string) => (mockGetListFilterQuery as any)[x]);
      const appleNotExpired = await User.create({
        ...hackerUser,
        _id: new mongoose.Types.ObjectId(),
        firstName: mockGetListFilterQuery.list1.query.firstName,
        email: 'wtf@gmail.com',
      });
      const appleExpired = await User.create({
        ...hackerUser,
        _id: new mongoose.Types.ObjectId(),
        firstName: mockGetListFilterQuery.list1.query.firstName,
        status: {
          accepted: true,
          statusReleased: true,
        },
        personalRSVPDeadline: -1,
        email: 'appleExpired@gmail.com',
      });

      const lists = await syncMailingLists();

      expect(syncMailingList.mock.calls[0]).toEqual([mockGetList.list1.listID, [appleExpired.email], undefined, undefined]);

      expect(getList.mock.calls[0]).toEqual(['list1']);

      expect(lists).toEqual([
        'list1',
        'list2',
        'list3',
      ]);
    });
  });
});

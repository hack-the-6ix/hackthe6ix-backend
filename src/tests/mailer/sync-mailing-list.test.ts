import { getObject } from '../../controller/ModelController';
import { fetchUniverseState } from '../../controller/util/resources';
import { IUser } from '../../models/user/fields';
import User from '../../models/user/User';
import syncMailingList from '../../services/mailer/syncMailingList';
import {
  addSubscriptionRequest,
  deleteSubscriptionRequest,
  getMailingListSubscriptionsRequest,
} from '../../services/mailer/util/external';
import { InternalServerError } from '../../types/errors';
import {
  adminUser,
  generateMockUniverseState,
  hackerUser,
  mockErrorResponse,
  mockSuccessResponse,
  runAfterAll,
  runAfterEach,
  runBeforeAll,
} from '../test-utils';
import {
  generateGetSubscriptionsResponse,
  mockEmailsA,
  mockEmailsB,
  mockEmailsEmpty,
  mockMailingListID,
} from './test-utils';

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

describe('Sync Mailing List', () => {
  describe('Success', () => {
    test('Add new emails', async () => {
      getMailingListSubscriptionsRequest.mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsEmpty),
          },
        },
      }).mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsA),
          },
        },
      });

      addSubscriptionRequest.mockReturnValue(mockSuccessResponse());

      const { added, deleted } = await syncMailingList(
        mockMailingListID,
        mockEmailsA,
      );

      expect(getMailingListSubscriptionsRequest.mock.calls).toEqual([
        [mockMailingListID],
        [mockMailingListID],
      ]);

      expect(new Set(addSubscriptionRequest.mock.calls)).toEqual(new Set(mockEmailsA.map((email: string) => [
        mockMailingListID, email, {},
      ])));

      expect(deleteSubscriptionRequest).not.toBeCalled();

      expect(deleted).toEqual(mockEmailsEmpty);
      expect(added).toEqual(mockEmailsA);
    });

    test('Remove emails', async () => {
      getMailingListSubscriptionsRequest.mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsA),
          },
        },
      }).mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsEmpty),
          },
        },
      });

      deleteSubscriptionRequest.mockReturnValue(mockSuccessResponse());

      const { added, deleted } = await syncMailingList(
        mockMailingListID,
        mockEmailsEmpty,
      );

      expect(getMailingListSubscriptionsRequest.mock.calls).toEqual([
        [mockMailingListID],
        [mockMailingListID],
      ]);

      expect(new Set(deleteSubscriptionRequest.mock.calls)).toEqual(new Set(mockEmailsA.map((email: string) => [
        mockMailingListID, email,
      ])));

      expect(addSubscriptionRequest).not.toBeCalled();

      expect(deleted).toEqual(mockEmailsA);
      expect(added).toEqual(mockEmailsEmpty);
    });

    test('Add and remove emails', async () => {
      getMailingListSubscriptionsRequest.mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsA),
          },
        },
      }).mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsB),
          },
        },
      });

      deleteSubscriptionRequest.mockReturnValue(mockSuccessResponse());
      addSubscriptionRequest.mockReturnValue(mockSuccessResponse());

      const { added, deleted } = await syncMailingList(
        mockMailingListID,
        mockEmailsB,
      );

      expect(getMailingListSubscriptionsRequest.mock.calls).toEqual([
        [mockMailingListID],
        [mockMailingListID],
      ]);

      const toBeRemoved = mockEmailsA.filter((email: string) => mockEmailsB.indexOf(email) === -1);
      const toBeAdded = mockEmailsB.filter((email: string) => mockEmailsA.indexOf(email) === -1);

      expect(new Set(addSubscriptionRequest.mock.calls)).toEqual(new Set(toBeAdded.map((email: string) => [
        mockMailingListID, email, {},
      ])));

      expect(new Set(deleteSubscriptionRequest.mock.calls)).toEqual(new Set(toBeRemoved.map((email: string) => [
        mockMailingListID, email,
      ])));

      expect(deleted).toEqual(toBeRemoved);
      expect(added).toEqual(toBeAdded);
    });

    test('No change', async () => {
      getMailingListSubscriptionsRequest.mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsA),
          },
        },
      }).mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsA),
          },
        },
      });

      const { added, deleted } = await syncMailingList(
        mockMailingListID,
        mockEmailsA,
      );

      expect(getMailingListSubscriptionsRequest.mock.calls).toEqual([
        [mockMailingListID],
        [mockMailingListID],
      ]);

      expect(addSubscriptionRequest).not.toHaveBeenCalled();
      expect(deleteSubscriptionRequest).not.toHaveBeenCalled();

      expect(deleted).toEqual([]);
      expect(added).toEqual([]);
    });

    describe('Sync single user', () => {
      test('Add', async () => {
        getMailingListSubscriptionsRequest.mockReturnValueOnce({
          ...mockSuccessResponse(),
          data: {
            data: {
              subscriptions: generateGetSubscriptionsResponse(mockEmailsA),
            },
          },
        }).mockReturnValueOnce({
          ...mockSuccessResponse(),
          data: {
            data: {
              subscriptions: generateGetSubscriptionsResponse(mockEmailsB),
            },
          },
        });

        addSubscriptionRequest.mockReturnValue(mockSuccessResponse());

        const email = mockEmailsB[2];

        const { added, deleted } = await syncMailingList(
          mockMailingListID,
          mockEmailsB,
          false,
          email,
        );

        expect(getMailingListSubscriptionsRequest.mock.calls).toEqual([
          [mockMailingListID],
          [mockMailingListID],
        ]);

        expect(new Set(addSubscriptionRequest.mock.calls)).toEqual(new Set([[
          mockMailingListID, email, {},
        ]]));

        expect(deleteSubscriptionRequest).not.toHaveBeenCalled();

        expect(deleted).toEqual([]);
        expect(added).toEqual([email]);
      });

      test('Remove', async () => {
        getMailingListSubscriptionsRequest.mockReturnValueOnce({
          ...mockSuccessResponse(),
          data: {
            data: {
              subscriptions: generateGetSubscriptionsResponse(mockEmailsA),
            },
          },
        }).mockReturnValueOnce({
          ...mockSuccessResponse(),
          data: {
            data: {
              subscriptions: generateGetSubscriptionsResponse(mockEmailsB),
            },
          },
        });

        deleteSubscriptionRequest.mockReturnValue(mockSuccessResponse());

        const email = mockEmailsA[0];

        const { added, deleted } = await syncMailingList(
          mockMailingListID,
          mockEmailsB,
          false,
          email,
        );

        expect(getMailingListSubscriptionsRequest.mock.calls).toEqual([
          [mockMailingListID],
          [mockMailingListID],
        ]);

        expect(new Set(deleteSubscriptionRequest.mock.calls)).toEqual(new Set([[
          mockMailingListID, email,
        ]]));

        expect(addSubscriptionRequest).not.toHaveBeenCalled();

        expect(deleted).toEqual([email]);
        expect(added).toEqual([]);
      });
    });

    test('Inject mailing list fields', async () => {
      getMailingListSubscriptionsRequest.mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsEmpty),
          },
        },
      }).mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse([hackerUser.email]),
          },
        },
      });

      addSubscriptionRequest.mockReturnValue(mockSuccessResponse());

      await User.create(hackerUser);
      const user: IUser = (await getObject(adminUser, 'user', {
        filter: {
          _id: hackerUser._id,
        },
      }))[0] as any;

      const { added, deleted } = await syncMailingList(
        mockMailingListID,
        [hackerUser.email],
      );

      expect(getMailingListSubscriptionsRequest.mock.calls).toEqual([
        [mockMailingListID],
        [mockMailingListID],
      ]);

      expect(new Set(addSubscriptionRequest.mock.calls)).toEqual(new Set([[
        mockMailingListID, hackerUser.email, user.mailmerge,
      ]]));

      expect(deleteSubscriptionRequest).not.toHaveBeenCalled();

      expect(deleted).toEqual([]);
      expect(added).toEqual([hackerUser.email]);
    });

    test('Force update', async () => {
      getMailingListSubscriptionsRequest.mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsA),
          },
        },
      }).mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsB),
          },
        },
      });

      deleteSubscriptionRequest.mockReturnValue(mockSuccessResponse());
      addSubscriptionRequest.mockReturnValue(mockSuccessResponse());

      const { added, deleted } = await syncMailingList(
        mockMailingListID,
        mockEmailsB,
        true,
      );

      expect(getMailingListSubscriptionsRequest.mock.calls).toEqual([
        [mockMailingListID],
        [mockMailingListID],
      ]);

      const toBeRemoved = mockEmailsA.filter((email: string) => mockEmailsB.indexOf(email) === -1);

      expect(new Set(addSubscriptionRequest.mock.calls)).toEqual(new Set(mockEmailsB.map((email: string) => [
        mockMailingListID, email, {},
      ])));

      expect(new Set(deleteSubscriptionRequest.mock.calls)).toEqual(new Set(toBeRemoved.map((email: string) => [
        mockMailingListID, email,
      ])));

      expect(deleted).toEqual(toBeRemoved);
      expect(added).toEqual(mockEmailsB);
    });

    test('Force update specific user', async () => {
      getMailingListSubscriptionsRequest.mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsB),
          },
        },
      }).mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsB),
          },
        },
      });

      const email = mockEmailsB[2];

      addSubscriptionRequest.mockReturnValue(mockSuccessResponse());

      const { added, deleted } = await syncMailingList(
        mockMailingListID,
        mockEmailsB,
        true,
        email,
      );

      expect(getMailingListSubscriptionsRequest.mock.calls).toEqual([
        [mockMailingListID],
        [mockMailingListID],
      ]);

      expect(addSubscriptionRequest.mock.calls).toEqual([
        [mockMailingListID, email, {}],
      ]);

      expect(deleteSubscriptionRequest).not.toBeCalled();

      expect(deleted).toEqual([]);
      expect(added).toEqual([email]);
    });
  });

  describe('Error', () => {
    test('Unable to fetch current subscriptions', async () => {
      getMailingListSubscriptionsRequest.mockReturnValue(mockErrorResponse());
      deleteSubscriptionRequest.mockReturnValue(mockSuccessResponse());
      addSubscriptionRequest.mockReturnValue(mockSuccessResponse());

      await expect(syncMailingList(
        mockMailingListID,
        mockEmailsB,
        true,
      )).rejects.toThrow(InternalServerError);
    });

    test('Unable to update subscription', async () => {
      getMailingListSubscriptionsRequest.mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsA),
          },
        },
      }).mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsB),
          },
        },
      });

      deleteSubscriptionRequest.mockReturnValue(mockSuccessResponse());
      addSubscriptionRequest.mockReturnValue(mockErrorResponse());

      await expect(syncMailingList(
        mockMailingListID,
        mockEmailsB,
        true,
      )).rejects.toThrow(InternalServerError);
    });

    test('Unable to delete subscription', async () => {
      getMailingListSubscriptionsRequest.mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsA),
          },
        },
      }).mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsB),
          },
        },
      });

      deleteSubscriptionRequest.mockReturnValue(mockErrorResponse());
      addSubscriptionRequest.mockReturnValue(mockSuccessResponse());

      await expect(syncMailingList(
        mockMailingListID,
        mockEmailsB,
        true,
      )).rejects.toThrow(InternalServerError);
    });

    test('Unable to verify subscription', async () => {
      getMailingListSubscriptionsRequest.mockReturnValueOnce({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsA),
          },
        },
      }).mockReturnValueOnce(mockErrorResponse());

      deleteSubscriptionRequest.mockReturnValue(mockSuccessResponse());
      addSubscriptionRequest.mockReturnValue(mockSuccessResponse());

      await expect(syncMailingList(
        mockMailingListID,
        mockEmailsB,
        true,
      )).rejects.toThrow(InternalServerError);
    });

    test('Mailing list verification length mismatch', async () => {
      getMailingListSubscriptionsRequest.mockReturnValue({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsA),
          },
        },
      }).mockReturnValue({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsEmpty),
          },
        },
      });

      deleteSubscriptionRequest.mockReturnValue(mockSuccessResponse());
      addSubscriptionRequest.mockReturnValue(mockSuccessResponse());

      await expect(syncMailingList(
        mockMailingListID,
        mockEmailsB,
        true,
      )).rejects.toThrow(InternalServerError);
    });

    test('Mailing list verification mismatch', async () => {
      getMailingListSubscriptionsRequest.mockReturnValue({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsA),
          },
        },
      }).mockReturnValue({
        ...mockSuccessResponse(),
        data: {
          data: {
            subscriptions: generateGetSubscriptionsResponse(mockEmailsA),
          },
        },
      });

      deleteSubscriptionRequest.mockReturnValue(mockSuccessResponse());
      addSubscriptionRequest.mockReturnValue(mockSuccessResponse());

      await expect(syncMailingList(
        mockMailingListID,
        mockEmailsB,
        true,
      )).rejects.toThrow(InternalServerError);
    });
  });
});

import { rsvp } from '../../../controller/UserController';
import { fetchUniverseState } from '../../../controller/util/resources';
import User from '../../../models/user/User';
import { sendEmailRequest } from '../../../services/mailer/util/external';
import { DeadlineExpiredError, RSVPRejectedError } from '../../../types/errors';
import { MailTemplate } from '../../../types/mailer';
import {
  generateMockUniverseState,
  hackerUser,
  mockGetMailTemplate,
  mockSuccessResponse,
  runAfterAll,
  runAfterEach,
  runBeforeAll,
} from '../../test-utils';

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

jest.mock('../../../controller/util/resources', () => {
  const { getModels } = jest.requireActual('../../../controller/util/resources');
  return {
    fetchUniverseState: jest.fn(),
    getModels: getModels,
  };
});

jest.mock('../../../services/mailer/util/external', () => {
  const external = jest.requireActual('../../../services/mailer/util/external');
  return {
    ...external,
    sendEmailRequest: jest.fn(() => mockSuccessResponse()),
    getList: jest.fn(() => mockSuccessResponse()),
    getTemplate: (templateName: string) => mockGetMailTemplate(templateName),
  };
});

jest.mock('../../../services/mailer/syncMailingList', () => jest.fn((): any => undefined));

describe('RSVP', () => {
  describe('Deadlines', () => {
    describe('Global Deadline', () => {
      test('Success', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState());

        const user = await User.create({
          ...hackerUser,
          status: {
            accepted: true,
            statusReleased: true,
          },
        });

        await rsvp(
          user,
          {
            attending: true,
          },
        );

        const resultObject = await User.findOne({
          _id: user._id,
        });

        expect(resultObject.toJSON().status.confirmed).toEqual(true);
        expect(resultObject.toJSON().status.declined).toEqual(false);
      });

      test('Fail', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState(undefined, -10000));

        const user = await User.create({
          ...hackerUser,
          status: {
            accepted: true,
            statusReleased: true,
          },
        });

        await expect(rsvp(
          user,
          {
            attending: true,
          },
        )).rejects.toThrow(DeadlineExpiredError);

        const resultObject = await User.findOne({
          _id: user._id,
        });

        expect(resultObject.toJSON().status.confirmed).toEqual(false);
        expect(resultObject.toJSON().status.declined).toEqual(false);
      });
    });

    describe('Personal Deadline', () => {
      test('Success', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState(undefined, -10000));

        const user = await User.create({
          ...hackerUser,
          status: {
            accepted: true,
            statusReleased: true,
          },
          personalConfirmationDeadline: new Date().getTime() + 10000,
        });

        await rsvp(
          user,
          {
            attending: true,
          },
        );

        const resultObject = await User.findOne({
          _id: user._id,
        });

        expect(resultObject.toJSON().status.confirmed).toEqual(true);
        expect(resultObject.toJSON().status.declined).toEqual(false);
      });

      test('Fail', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState(undefined, -10000));

        const user = await User.create({
          ...hackerUser,
          status: {
            accepted: true,
            statusReleased: true,
          },
          personalConfirmationDeadline: new Date().getTime() - 10000,
        });

        await expect(rsvp(
          user,
          {
            attending: true,
          },
        )).rejects.toThrow(DeadlineExpiredError);

        const resultObject = await User.findOne({
          _id: user._id,
        });

        expect(resultObject.toJSON().status.confirmed).toEqual(false);
        expect(resultObject.toJSON().status.declined).toEqual(false);
      });
    });
  });

  describe('Not eligible', () => {
    test('Not accepted', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          accepted: false,
          statusReleased: true,
        },
      });

      expect(rsvp(
        user,
        {
          attending: true,
        },
      )).rejects.toThrow(RSVPRejectedError);

      const resultObject = await User.findOne({
        _id: user._id,
      });

      expect(resultObject.toJSON().status.confirmed).toEqual(false);
      expect(resultObject.toJSON().status.declined).toEqual(false);
    });

    test('Already declined', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          accepted: true,
          declined: true,
          statusReleased: true,
        },
      });

      expect(rsvp(
        user,
        {
          attending: true,
        },
      )).rejects.toThrow(RSVPRejectedError);

      const resultObject = await User.findOne({
        _id: user._id,
      });

      expect(resultObject.toJSON().status.confirmed).toEqual(false);
      expect(resultObject.toJSON().status.declined).toEqual(true);
    });

    test('Status not released', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          accepted: true,
          statusReleased: false,
        },
      });

      expect(rsvp(
        user,
        {
          attending: true,
        },
      )).rejects.toThrow(RSVPRejectedError);

      const resultObject = await User.findOne({
        _id: user._id,
      });

      expect(resultObject.toJSON().status.confirmed).toEqual(false);
    });
  });

  describe('Confirmation State', () => {
    test('Confirm', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          accepted: true,
          statusReleased: true,
        },
      });

      await rsvp(
        user,
        {
          attending: true,
        },
      );

      const resultObject = await User.findOne({
        _id: user._id,
      });

      expect(resultObject.toJSON().status.confirmed).toEqual(true);
      expect(resultObject.toJSON().status.declined).toEqual(false);

      // Verify confirmation email sent
      const template = mockGetMailTemplate(MailTemplate.confirmed);

      expect(sendEmailRequest).toHaveBeenCalledWith(
        user.email,
        template.templateID,
        template.subject,
        expect.objectContaining({
          'TAGS[FIRST_NAME]': user.firstName,
          'TAGS[LAST_NAME]': user.lastName,
        }),
      );
    });

    test('Decline', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          accepted: true,
          statusReleased: true,
        },
      });

      await rsvp(
        user,
        {
          attending: false,
        },
      );

      const resultObject = await User.findOne({
        _id: user._id,
      });

      expect(resultObject.toJSON().status.confirmed).toEqual(false);
      expect(resultObject.toJSON().status.declined).toEqual(true);

      // Verify confirmation email sent
      const template = mockGetMailTemplate(MailTemplate.declined);

      expect(sendEmailRequest).toHaveBeenCalledWith(
        user.email,
        template.templateID,
        template.subject,
        expect.objectContaining({
          'TAGS[FIRST_NAME]': user.firstName,
          'TAGS[LAST_NAME]': user.lastName,
        }),
      );
    });
  });
});

import moment from 'moment';
import { timestampFormat } from '../../../consts';
import { updateApplication } from '../../../controller/UserController';
import { fetchUniverseState } from '../../../controller/util/resources';
import User from '../../../models/user/User';
import { sendEmailRequest } from '../../../services/mailer/external';
import { WriteCheckRequest } from '../../../types/checker';
import {
  AlreadySubmittedError,
  BadRequestError,
  DeadlineExpiredError,
  ForbiddenError,
  SubmissionDeniedError,
  WriteDeniedError,
} from '../../../types/errors';
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
  const resources = jest.requireActual('../../../controller/util/resources');
  return {
    ...resources,
    fetchUniverseState: jest.fn(),
  };
});

jest.mock('../../../services/mailer/external', () => {
  const external = jest.requireActual('../../../services/mailer/external');
  return {
    ...external,
    sendEmailRequest: jest.fn(() => mockSuccessResponse()),
    getTemplate: (templateName: string) => mockGetMailTemplate(templateName),
  };
});


jest.mock('../../../models/user/fields', () => {
  const actualFields = jest.requireActual('../../../models/user/fields');
  const canUpdateApplication = jest.requireActual('../../../models/validator').canUpdateApplication;

  const updatedFields = { ...actualFields.fields };
  updatedFields.FIELDS.hackerApplication = {
    readCheck: true,
    writeCheck: canUpdateApplication(),

    FIELDS: {
      submitCheckFallback: { // this should pass because submitCheck > writeCheck
        type: String,
        writeCheck: false,
        submitCheck: true,
      },
      optionalField: {
        type: String,
        readCheck: true,
        writeCheck: true,
        submitCheck: true,
        caption: 'Optional Field',
      },
      optionalField2: {
        type: String,
        readCheck: true,
        writeCheck: true,
        submitCheck: true,
        caption: 'Optional Field 2',
      },
      requiredFieldImplicit: {
        type: String,
        readCheck: true,
        writeCheck: (request: WriteCheckRequest<string, any>) => request.fieldValue === 'foobar',
        caption: 'Required Field',
      },
      requiredFieldExplicit: {
        type: String,
        readCheck: true,
        writeCheck: (request: WriteCheckRequest<string, any>) => !request.fieldValue || request.fieldValue.length < 100,
        submitCheck: (request: WriteCheckRequest<string, any>) => request.fieldValue === 'foobar',
        caption: 'Required Field 2',
      },
      conditionalField: {
        type: String,
        readCheck: true,
        writeCheck: (request: WriteCheckRequest<string, any>) => !request.fieldValue || request.fieldValue.length < 10,
        caption: 'Conditional Field',
      },
    },
  };

  return {
    ...actualFields,
    fields: updatedFields,
  };
});

describe('Update Application', () => {
  describe('Success', () => {
    test('Verify no email sent', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
      });

      await updateApplication(
        user.toJSON(),
        false,
        {
          optionalField2: 'Test',
        } as any,
      );

      expect(sendEmailRequest).not.toHaveBeenCalled();
    });

    test('Normal Deadline', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
      });

      await updateApplication(
        user.toJSON(),
        false,
        {
          optionalField2: 'Test',
        } as any,
      );

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        optionalField2: 'Test',
      });
    });

    test('Personal Deadline', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
        personalApplicationDeadline: new Date().getTime() + 10000,
      });

      await updateApplication(
        user.toJSON(),
        false,
        {
          optionalField2: 'Test',
        } as any,
      );

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        optionalField2: 'Test',
      });
    });


    test('Missing Required Field', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
      });

      await updateApplication(
        user.toJSON(),
        false,
        {
          optionalField2: 'Test',
        } as any,
      );

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        optionalField2: 'Test',
      });
    });
  });

  describe('Fail', () => {

    test('Bad Application', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
      });

      await expect(updateApplication(
        user.toJSON(),
        false,
        undefined,
      )).rejects.toThrow(BadRequestError);

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
    });

    test('Write violation', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
      });

      await expect(updateApplication(
        user.toJSON(),
        false,
        {
          conditionalField: 'XXXXXXXXXXXXXXXXXXXXXXXX',
        } as any,
      )).rejects.toThrow(WriteDeniedError);

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
    });

    test('Already submitted', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
      });

      await expect(updateApplication(
        user.toJSON(),
        false,
        {
          optionalField2: 'Test',
        } as any,
      )).rejects.toThrow(ForbiddenError);

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
    });

    describe('Deadline passed', () => {
      test('Global Deadline passed', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));

        const user = await User.create({
          ...hackerUser,
          status: {
            applied: false,
          },
        });

        await expect(updateApplication(
          user.toJSON(),
          false,
          {
            optionalField2: 'Test',
          } as any,
        )).rejects.toThrow(DeadlineExpiredError);

        const resultObject = await User.findOne({
          _id: hackerUser._id,
        });

        expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
      });

      test('Personal Deadline passed', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));

        const user = await User.create({
          ...hackerUser,
          status: {
            applied: false,
          },
          personalApplicationDeadline: new Date().getTime() - 1000,
        });

        await expect(updateApplication(
          user.toJSON(),
          false,
          {
            optionalField2: 'Test',
          } as any,
        )).rejects.toThrow(DeadlineExpiredError);

        const resultObject = await User.findOne({
          _id: hackerUser._id,
        });

        expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
      });
    });
  });
});

describe('Submit Application', () => {
  describe('Success', () => {
    test('Verify email sent', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
      });

      await updateApplication(
        user.toJSON(),
        true,
        {
          optionalField2: 'Test',
          requiredFieldImplicit: 'foobar',
          requiredFieldExplicit: 'foobar',
        } as any,
      );

      const template = mockGetMailTemplate(MailTemplate.applied);
      const universeState = await fetchUniverseState();

      expect(sendEmailRequest).toHaveBeenCalledWith(
        user.email,
        template.templateID,
        template.subject,
        expect.objectContaining({
          'TAGS[FIRST_NAME]': user.firstName,
          'TAGS[LAST_NAME]': user.lastName,
          'TAGS[MERGE_APPLICATION_DEADLINE]': moment(universeState.public.globalApplicationDeadline).format(timestampFormat),
          'TAGS[MERGE_CONFIRMATION_DEADLINE]': moment(universeState.public.globalConfirmationDeadline).format(timestampFormat),
        }),
      );
    });

    test('Normal Deadline', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
      });

      await updateApplication(
        user.toJSON(),
        true,
        {
          optionalField2: 'Test',
          requiredFieldImplicit: 'foobar',
          requiredFieldExplicit: 'foobar',
        } as any,
      );

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        optionalField2: 'Test',
        requiredFieldImplicit: 'foobar',
        requiredFieldExplicit: 'foobar',
      });

      expect(resultObject.status.applied).toBeTruthy();
    });

    test('Personal Deadline', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
        personalApplicationDeadline: new Date().getTime() + 10000,
      });

      await updateApplication(
        user.toJSON(),
        true,
        {
          optionalField2: 'Test',
          requiredFieldImplicit: 'foobar',
          requiredFieldExplicit: 'foobar',
        } as any,
      );

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        optionalField2: 'Test',
        requiredFieldImplicit: 'foobar',
        requiredFieldExplicit: 'foobar',
      });

      expect(resultObject.status.applied).toBeTruthy();
    });
  });

  describe('Fail', () => {
    describe('Submit condition', () => {

      /**
       * TODO: Verify the correct field is returned when submit violation occurs
       */

      test('Implicit submitCheck', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState());

        const user = await User.create({
          ...hackerUser,
          status: {
            applied: false,
          },
        });

        await expect(updateApplication(
          user.toJSON(),
          true,
          {
            requiredFieldImplicit: 'this is not a foobar',
            requiredFieldExplicit: 'foobar',
          } as any,
        )).rejects.toThrow(SubmissionDeniedError);

        const resultObject = await User.findOne({
          _id: hackerUser._id,
        });

        expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
        expect(resultObject.toJSON().status.applied).toBeFalsy();

      });

      test('Explicit submitCheck', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState());

        const user = await User.create({
          ...hackerUser,
          status: {
            applied: false,
          },
        });

        await expect(updateApplication(
          user.toJSON(),
          true,
          {
            requiredFieldImplicit: 'foobar',
            requiredFieldExplicit: 'this is not a foobar',
          } as any,
        )).rejects.toThrow(SubmissionDeniedError);

        const resultObject = await User.findOne({
          _id: hackerUser._id,
        });

        expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
        expect(resultObject.toJSON().status.applied).toBeFalsy();
      });

    });

    test('Write violation', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
      });

      await expect(updateApplication(
        user.toJSON(),
        true,
        {
          requiredFieldImplicit: 'foobar',
          requiredFieldExplicit: 'foobar',
          conditionalField: 'XXXXXXXXXXXXXXXXXXXXXXXX',
        } as any,
      )).rejects.toThrow(SubmissionDeniedError);

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
      expect(resultObject.toJSON().status.applied).toBeFalsy();
    });

    test('Already submitted', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: true,
        },
      });

      await expect(updateApplication(
        user.toJSON(),
        true,
        {
          requiredFieldImplicit: 'foobar',
          requiredFieldExplicit: 'foobar',
        } as any,
      )).rejects.toThrow(AlreadySubmittedError);

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
    });

    describe('Deadline passed', () => {
      test('Global Deadline passed', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));

        const user = await User.create({
          ...hackerUser,
          status: {
            applied: false,
          },
        });

        await expect(updateApplication(
          user.toJSON(),
          true,
          {
            requiredFieldImplicit: 'foobar',
            requiredFieldExplicit: 'foobar',
          } as any,
        )).rejects.toThrow(DeadlineExpiredError);

        const resultObject = await User.findOne({
          _id: hackerUser._id,
        });

        expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
      });

      test('Personal Deadline passed', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));

        const user = await User.create({
          ...hackerUser,
          status: {
            applied: false,
          },
          personalApplicationDeadline: new Date().getTime() - 1000,
        });

        await expect(updateApplication(
          user.toJSON(),
          true,
          {
            requiredFieldImplicit: 'foobar',
            requiredFieldExplicit: 'foobar',
          } as any,
        )).rejects.toThrow(DeadlineExpiredError);

        const resultObject = await User.findOne({
          _id: hackerUser._id,
        });

        expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
        expect(resultObject.toJSON().status.applied).toBeFalsy();
      });
    });
  });
});

/**
 * TODO: Test resume upload API
 *       Update: There are issues with the MongoMemoryServer and GridFS, so this might not be possible atm
 */

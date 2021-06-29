import { getObject } from '../../controller/ModelController';
import { fetchUniverseState } from '../../controller/util/resources';
import User from '../../models/user/User';
import { sendEmail, sendTemplateEmail } from '../../services/mailer';
import { okResponse } from '../../services/mailer/dev';
import { getTemplate, sendEmailRequest } from '../../services/mailer/external';
import { InternalServerError } from '../../types/errors';
import { MailTemplate } from '../../types/mailer';
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

jest.mock('../../services/mailer/external', () => ({
  addSubscriptionRequest: jest.fn(),
  deleteSubscriptionRequest: jest.fn(),
  getList: jest.fn(),
  getMailingListSubscriptionsRequest: jest.fn(),
  getTemplate: jest.fn(),
  sendEmailRequest: jest.fn(),
}));

const mockTags = {
  foo: 'bar',
  baz: 'boop',
};

const mockTagsParsed = {
  'TAGS[foo]': 'bar',
  'TAGS[baz]': 'boop',
};

const mockTemplateName = 'cool template bro';
const mockTemplateID = 'mock template';
const mockSubject = 'this is the subject';

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

describe('Send template email', () => {
  test('Email corresponds to registered user', async () => {
    sendEmailRequest.mockReturnValue(mockSuccessResponse());

    const hacker = await User.create(hackerUser);

    getTemplate.mockReturnValue({
      subject: mockSubject,
      templateID: mockTemplateID,
    });

    await sendTemplateEmail(
      hacker.email,
      mockTemplateName as MailTemplate,
      mockTags,
    );

    const profileMergeFields = (await getObject(adminUser, 'user', {
      filter: {
        _id: hacker._id,
      },
    }) as any[])[0].mailmerge;
    const profileMergeFieldsParsed: any = {};
    for (const k of Object.keys(profileMergeFields)) {
      profileMergeFieldsParsed[`TAGS[${k}]`] = profileMergeFields[k];
    }

    expect(getTemplate).toHaveBeenCalledWith(mockTemplateName);
    expect(sendEmailRequest).toHaveBeenCalledWith(
      hackerUser.email,
      mockTemplateID,
      mockSubject,
      {
        ...mockTagsParsed,
        ...profileMergeFieldsParsed,
      },
    );
  });

  test('Email does not correspond to registered user', async () => {
    sendEmailRequest.mockReturnValue(okResponse);

    getTemplate.mockReturnValue({
      subject: mockSubject,
      templateID: mockTemplateID,
    });

    await sendTemplateEmail(
      'Banana smoothie',
      mockTemplateName as MailTemplate,
      mockTags,
    );

    expect(getTemplate).toHaveBeenCalledWith(mockTemplateName);
    expect(sendEmailRequest).toHaveBeenCalledWith(
      'Banana smoothie',
      mockTemplateID,
      mockSubject,
      mockTagsParsed,
    );
  });
});

describe('Send all templates', () => {

});

import { updateApplication } from '../../../controller/UserController';
import { enumOptions } from '../../../models/user/enums';
import { IApplication, IUser } from '../../../models/user/fields';
import User from '../../../models/user/User';
import { SubmissionDeniedError, WriteDeniedError } from '../../../types/errors';
import {
  generateMockUniverseState,
  hackerUser,
  mockDate,
  mockGetMailTemplate,
  mockSuccessResponse,
  runAfterAll,
  runAfterEach,
  runBeforeAll,
  runBeforeEach,
} from '../../test-utils';

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

jest.mock('../../../services/logger', () => {
  const real = jest.requireActual('../../../services/logger');

  return {
    ...real,
    log: {
      info: jest.fn(),
    },
  };
});

/**
 * We will be using the real User schema and submitting a simulated real application
 */
describe('Update Real Application', () => {
  test('Valid update', async () => {
    await generateMockUniverseState();

    const hackerApplication = {
      gender: enumOptions['gender'][0],
      pronouns: enumOptions['pronouns'][0],
      ethnicity: enumOptions['ethnicity'][0],
      timezone: enumOptions['timezone'][0],
      school: 'University of Toronto',
      program: 'Computer Science',
      yearsOfStudy: enumOptions['yearsOfStudy'][0],
      hackathonsAttended: enumOptions['hackathonsAttended'][0],
      projectEssay: 'X '.repeat(50),
      accomplishEssay: 'X '.repeat(50),
      mlhCOC: true,
    } as IApplication;

    const user = await User.create({
      ...hackerUser,
      status: {
        applied: false,
      },
    });

    const mockTS = 696969;
    let restoreDateMock = mockDate(mockTS);
    await updateApplication(
      user.toJSON() as IUser,
      false,
      hackerApplication,
    );
    restoreDateMock();

    const resultObject = await User.findOne({
      _id: hackerUser._id,
    });

    expect(resultObject.toJSON().hackerApplication).toEqual({
      ...hackerApplication,
      lastUpdated: mockTS,
    });
    expect(resultObject.status.applied).toBeFalsy();
  });

  test('Enum is falsy', async () => {
    await generateMockUniverseState();

    const hackerApplication = {
      gender: '',
      pronouns: null,
      ethnicity: null,
      timezone: enumOptions['timezone'][0],
      school: 'University of Toronto',
      program: 'Computer Science',
      yearsOfStudy: enumOptions['yearsOfStudy'][0],
      hackathonsAttended: enumOptions['hackathonsAttended'][0],
      projectEssay: 'X '.repeat(50),
      accomplishEssay: 'X '.repeat(50),
      mlhCOC: true,
    } as IApplication;

    const user = await User.create({
      ...hackerUser,
      status: {
        applied: false,
      },
    });

    const mockTS = 696969;
    let restoreDateMock = mockDate(mockTS);
    await updateApplication(
      user.toJSON() as IUser,
      false,
      hackerApplication,
    );
    restoreDateMock();

    const resultObject = await User.findOne({
      _id: hackerUser._id,
    });

    expect(resultObject.toJSON().hackerApplication).toEqual({
      ...hackerApplication,
      lastUpdated: mockTS,
    });
    expect(resultObject.status.applied).toBeFalsy();
  });

  test('Tried to update read only field', async () => {
    await generateMockUniverseState();

    const hackerApplication = {
      gender: enumOptions['gender'][0],
      pronouns: enumOptions['pronouns'][0],
      ethnicity: enumOptions['ethnicity'][0],
      timezone: enumOptions['timezone'][0],
      school: 'University of Toronto',
      program: 'Computer Science',
      yearsOfStudy: enumOptions['yearsOfStudy'][0],
      hackathonsAttended: enumOptions['hackathonsAttended'][0],
      projectEssay: 'X '.repeat(50),
      accomplishEssay: 'X '.repeat(50),
      mlhCOC: true,
      teamCode: '1234',
    } as IApplication;

    const user = await User.create({
      ...hackerUser,
      status: {
        applied: false,
      },
    });

    await expect(updateApplication(
      user.toJSON() as IUser,
      false,
      hackerApplication,
    )).rejects.toThrow(WriteDeniedError);

    const resultObject = await User.findOne({
      _id: hackerUser._id,
    });

    expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
    expect(resultObject.status.applied).toBeFalsy();
  });

  test('Invalid update', async () => {
    await generateMockUniverseState();

    const hackerApplication = {
      gender: 'AdasdasasdasMale',
      pronouns: enumOptions['pronouns'][0],
      ethnicity: enumOptions['ethnicity'][0],
      timezone: enumOptions['timezone'][0],
      school: 'University of Toronto',
      program: 'Computer Science',
      phoneNumber: '123123123',
      yearsOfStudy: enumOptions['yearsOfStudy'][0],
      hackathonsAttended: enumOptions['hackathonsAttended'][0],
      projectEssay: 'X '.repeat(50),
      accomplishEssay: 'X '.repeat(50),
      mlhCOC: true,
    } as IApplication;

    const user = await User.create({
      ...hackerUser,
      status: {
        applied: false,
      },
    });

    await expect(updateApplication(
      user.toJSON() as IUser,
      false,
      hackerApplication,
    )).rejects.toThrow(WriteDeniedError);

    const resultObject = await User.findOne({
      _id: hackerUser._id,
    });

    expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
    expect(resultObject.status.applied).toBeFalsy();
  });

  test('Character limit exceeded', async () => {
    await generateMockUniverseState();

    const hackerApplication = {
      gender: enumOptions['gender'][0],
      pronouns: enumOptions['pronouns'][0],
      ethnicity: enumOptions['ethnicity'][0],
      timezone: enumOptions['timezone'][0],
      school: 'University of Toronto',
      program: 'Computer Science',
      yearsOfStudy: enumOptions['yearsOfStudy'][0],
      hackathonsAttended: enumOptions['hackathonsAttended'][0],
      projectEssay: 'X '.repeat(50),
      accomplishEssay: 'X'.repeat(3000),
      mlhCOC: true,
    } as IApplication;

    const user = await User.create({
      ...hackerUser,
      status: {
        applied: false,
      },
    });

    await expect(updateApplication(
      user.toJSON() as IUser,
      false,
      hackerApplication,
    )).rejects.toThrow(WriteDeniedError);

    const resultObject = await User.findOne({
      _id: hackerUser._id,
    });

    expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
    expect(resultObject.status.applied).toBeFalsy();
  });

  test('Said no to swag, but still gave address', async () => {
    await generateMockUniverseState();

    const hackerApplication = {
      emailConsent: true,
      gender: enumOptions['gender'][0],
      pronouns: enumOptions['pronouns'][0],
      ethnicity: enumOptions['ethnicity'][0],
      timezone: enumOptions['timezone'][0],
      wantSwag: false,
      addressLine1: 'ASDASSADAS',
      addressLine2: '',
      city: 'asdasdas',
      province: enumOptions['province'][0],
      postalCode: 'N0B4V3',
      school: 'University of Toronto',
      program: 'Computer Science',
      yearsOfStudy: enumOptions['yearsOfStudy'][0],
      hackathonsAttended: enumOptions['hackathonsAttended'][0],
      resumeSharePermission: true,
      githubLink: 'GitHub',
      portfolioLink: 'Portfolio',
      linkedinLink: 'LinkedIn',
      projectEssay: 'X '.repeat(50),
      requestedWorkshops: 'blah blah',
      accomplishEssay: 'X '.repeat(50),
      mlhCOC: true,
      mlhEmail: true,
      mlhData: true,
      country: 'Canada',
    } as IApplication;

    const user = await User.create({
      ...hackerUser,
      status: {
        applied: false,
      },
      hackerApplication: {
        resumeFileName: 'wtf.exe',
      },
    });

    await expect(updateApplication(
      user.toJSON() as IUser,
      false,
      hackerApplication,
    )).rejects.toThrow(WriteDeniedError);

    const resultObject = await User.findOne({
      _id: hackerUser._id,
    });

    expect(resultObject.toJSON().hackerApplication).toEqual({
      resumeFileName: 'wtf.exe',
    });
    expect(resultObject.status.applied).toBeFalsy();
  });
});

describe('Submit Real Application', () => {
  test('Enum is falsy', async () => {
    await generateMockUniverseState();

    const hackerApplication = {
      gender: '',
      pronouns: null,
      ethnicity: null,
      timezone: enumOptions['timezone'][0],
      school: 'University of Toronto',
      program: 'Computer Science',
      phoneNumber: '123123123',
      yearsOfStudy: enumOptions['yearsOfStudy'][0],
      hackathonsAttended: enumOptions['hackathonsAttended'][0],
      projectEssay: 'X '.repeat(50),
      accomplishEssay: 'X '.repeat(50),
      mlhCOC: true,
      mlhData: true,
      country: 'Canada',
    } as IApplication;

    const user = await User.create({
      ...hackerUser,
      status: {
        applied: false,
      },
      hackerApplication: {
        resumeFileName: 'wtf.exe',
      },
    });

    await expect(updateApplication(
      user.toJSON() as IUser,
      true,
      hackerApplication,
    )).rejects.toThrow(SubmissionDeniedError);

    const resultObject = await User.findOne({
      _id: hackerUser._id,
    });

    expect(resultObject.toJSON().hackerApplication).toEqual({
      resumeFileName: 'wtf.exe',
    });
    expect(resultObject.status.applied).toBeFalsy();
  });

  test('Mandatory Fields', async () => {
    await generateMockUniverseState();

    const hackerApplication = {
      gender: enumOptions['gender'][0],
      pronouns: enumOptions['pronouns'][0],
      ethnicity: enumOptions['ethnicity'][0],
      timezone: enumOptions['timezone'][0],
      school: 'University of Toronto',
      program: 'Computer Science',
      phoneNumber: '123123123',
      yearsOfStudy: enumOptions['yearsOfStudy'][0],
      hackathonsAttended: enumOptions['hackathonsAttended'][0],
      projectEssay: 'X '.repeat(50),
      accomplishEssay: 'X '.repeat(50),
      mlhCOC: true,
      mlhData: true,
      country: 'Canada',
    } as IApplication;

    const user = await User.create({
      ...hackerUser,
      status: {
        applied: false,
      },
      hackerApplication: {
        resumeFileName: 'wtf.exe',
      },
    });

    const mockTS = 696969;
    let restoreDateMock = mockDate(mockTS);
    await updateApplication(
      user.toJSON() as IUser,
      true,
      hackerApplication,
    );
    restoreDateMock();

    const resultObject = await User.findOne({
      _id: hackerUser._id,
    });

    expect(resultObject.toJSON().hackerApplication).toEqual({
      ...hackerApplication,
      lastUpdated: mockTS,
      resumeFileName: 'wtf.exe',
    });
    expect(resultObject.status.applied).toBeTruthy();
  });

  test('MLH COC Denied', async () => {
    await generateMockUniverseState();

    const hackerApplication = {
      gender: enumOptions['gender'][0],
      pronouns: enumOptions['pronouns'][0],
      ethnicity: enumOptions['ethnicity'][0],
      timezone: enumOptions['timezone'][0],
      school: 'University of Toronto',
      program: 'Computer Science',
      yearsOfStudy: enumOptions['yearsOfStudy'][0],
      hackathonsAttended: enumOptions['hackathonsAttended'][0],
      projectEssay: 'X '.repeat(50),
      accomplishEssay: 'X '.repeat(50),
      mlhCOC: false,
      mlhData: true,
      country: 'Canada',
    } as IApplication;

    const user = await User.create({
      ...hackerUser,
      status: {
        applied: false,
      },
      hackerApplication: {
        resumeFileName: 'wtf.exe',
      },
    });

    await expect(updateApplication(
      user.toJSON() as IUser,
      true,
      hackerApplication,
    )).rejects.toThrow(SubmissionDeniedError);

    const resultObject = await User.findOne({
      _id: hackerUser._id,
    });

    expect(resultObject.toJSON().hackerApplication).toEqual({
      resumeFileName: 'wtf.exe',
    });
    expect(resultObject.status.applied).toBeFalsy();
  });

  test('MLH Data Denied', async () => {
    await generateMockUniverseState();

    const hackerApplication = {
      gender: enumOptions['gender'][0],
      pronouns: enumOptions['pronouns'][0],
      ethnicity: enumOptions['ethnicity'][0],
      timezone: enumOptions['timezone'][0],
      school: 'University of Toronto',
      program: 'Computer Science',
      yearsOfStudy: enumOptions['yearsOfStudy'][0],
      hackathonsAttended: enumOptions['hackathonsAttended'][0],
      projectEssay: 'X '.repeat(50),
      accomplishEssay: 'X '.repeat(50),
      mlhCOC: true,
      mlhData: false,
      country: 'Canada',
    } as IApplication;

    const user = await User.create({
      ...hackerUser,
      status: {
        applied: false,
      },
      hackerApplication: {
        resumeFileName: 'wtf.exe',
      },
    });

    await expect(updateApplication(
      user.toJSON() as IUser,
      true,
      hackerApplication,
    )).rejects.toThrow(SubmissionDeniedError);

    const resultObject = await User.findOne({
      _id: hackerUser._id,
    });

    expect(resultObject.toJSON().hackerApplication).toEqual({
      resumeFileName: 'wtf.exe',
    });
    expect(resultObject.status.applied).toBeFalsy();
  });

  test('Missing Resume', async () => {
    await generateMockUniverseState();

    const hackerApplication = {
      gender: enumOptions['gender'][0],
      pronouns: enumOptions['pronouns'][0],
      ethnicity: enumOptions['ethnicity'][0],
      timezone: enumOptions['timezone'][0],
      school: 'University of Toronto',
      program: 'Computer Science',
      yearsOfStudy: enumOptions['yearsOfStudy'][0],
      hackathonsAttended: enumOptions['hackathonsAttended'][0],
      projectEssay: 'X '.repeat(50),
      accomplishEssay: 'X '.repeat(50),
      mlhCOC: true,
      mlhData: true,
      country: 'Canada',
    } as IApplication;

    const user = await User.create({
      ...hackerUser,
      status: {
        applied: false,
      },
    });

    await expect(updateApplication(
      user.toJSON() as IUser,
      true,
      hackerApplication,
    )).rejects.toThrow(SubmissionDeniedError);

    const resultObject = await User.findOne({
      _id: hackerUser._id,
    });

    expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
    expect(resultObject.status.applied).toBeFalsy();
  });

  describe('Optional Fields', () => {
    test('No swag', async () => {
      await generateMockUniverseState();

      const hackerApplication = {
        emailConsent: true,
        gender: enumOptions['gender'][0],
        pronouns: enumOptions['pronouns'][0],
        ethnicity: enumOptions['ethnicity'][0],
        timezone: enumOptions['timezone'][0],
        wantSwag: false,
        addressLine1: '',
        addressLine2: '',
        city: '',
        province: '',
        postalCode: '',
        school: 'University of Toronto',
        program: 'Computer Science',
        yearsOfStudy: enumOptions['yearsOfStudy'][0],
        hackathonsAttended: enumOptions['hackathonsAttended'][0],
        resumeSharePermission: true,
        githubLink: 'GitHub',
        phoneNumber: '123123123',
        portfolioLink: 'Portfolio',
        linkedinLink: 'LinkedIn',
        projectEssay: 'X '.repeat(50),
        requestedWorkshops: 'blah blah',
        accomplishEssay: 'X '.repeat(50),
        mlhCOC: true,
        mlhEmail: true,
        mlhData: true,
        country: 'Canada',
        preEventWorkshops: enumOptions['preEventWorkshops'][0],
      } as IApplication;

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
        hackerApplication: {
          resumeFileName: 'wtf.exe',
        },
      });

      const mockTS = 696969;
      let restoreDateMock = mockDate(mockTS);
      await updateApplication(
        user.toJSON() as IUser,
        true,
        hackerApplication,
      );
      restoreDateMock();

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        ...hackerApplication,
        lastUpdated: mockTS,
        resumeFileName: 'wtf.exe',
      });
      expect(resultObject.status.applied).toBeTruthy();
    });

    test('Yes swag', async () => {
      await generateMockUniverseState();

      const hackerApplication = {
        emailConsent: true,
        gender: enumOptions['gender'][0],
        pronouns: enumOptions['pronouns'][0],
        ethnicity: enumOptions['ethnicity'][0],
        timezone: enumOptions['timezone'][0],
        wantSwag: true,
        phoneNumber: '123123123',
        addressLine1: 'asdasdsdasdsa',
        addressLine2: '',
        city: 'asdasdas',
        province: enumOptions['province'][0],
        postalCode: 'N0B4V3',
        school: 'University of Toronto',
        program: 'Computer Science',
        yearsOfStudy: enumOptions['yearsOfStudy'][0],
        hackathonsAttended: enumOptions['hackathonsAttended'][0],
        resumeSharePermission: true,
        githubLink: 'GitHub',
        portfolioLink: 'Portfolio',
        linkedinLink: 'LinkedIn',
        projectEssay: 'X '.repeat(50),
        requestedWorkshops: 'blah blah',
        accomplishEssay: 'X '.repeat(50),
        mlhCOC: true,
        mlhEmail: true,
        mlhData: true,
        country: 'Canada',
        preEventWorkshops: enumOptions['preEventWorkshops'][0],
      } as IApplication;

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
        hackerApplication: {
          resumeFileName: 'wtf.exe',
        },
      });

      const mockTS = 696969;
      let restoreDateMock = mockDate(mockTS);
      await updateApplication(
        user.toJSON() as IUser,
        true,
        hackerApplication,
      );
      restoreDateMock();

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        ...hackerApplication,
        lastUpdated: mockTS,
        resumeFileName: 'wtf.exe',
      });
      expect(resultObject.status.applied).toBeTruthy();
    });

    test('Said yes to swag, but incomplete address', async () => {
      await generateMockUniverseState();

      const hackerApplication = {
        emailConsent: true,
        gender: enumOptions['gender'][0],
        pronouns: enumOptions['pronouns'][0],
        ethnicity: enumOptions['ethnicity'][0],
        timezone: enumOptions['timezone'][0],
        wantSwag: true,
        addressLine1: '',
        addressLine2: '',
        city: 'asdasdas',
        phoneNumber: '123123123',
        province: enumOptions['province'][0],
        postalCode: 'N0B4V3',
        school: 'University of Toronto',
        program: 'Computer Science',
        yearsOfStudy: enumOptions['yearsOfStudy'][0],
        hackathonsAttended: enumOptions['hackathonsAttended'][0],
        resumeSharePermission: true,
        githubLink: 'GitHub',
        portfolioLink: 'Portfolio',
        linkedinLink: 'LinkedIn',
        projectEssay: 'X '.repeat(50),
        requestedWorkshops: 'blah blah',
        accomplishEssay: 'X '.repeat(50),
        mlhCOC: true,
        mlhEmail: true,
        mlhData: true,
        country: 'Canada',
        preEventWorkshops: enumOptions['preEventWorkshops'][0],
      } as IApplication;

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
        hackerApplication: {
          resumeFileName: 'wtf.exe',
        },
      });

      await expect(updateApplication(
        user.toJSON() as IUser,
        true,
        hackerApplication,
      )).rejects.toThrow(SubmissionDeniedError);

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        resumeFileName: 'wtf.exe',
      });
      expect(resultObject.status.applied).toBeFalsy();
    });

    test('Said no to swag, but still gave address', async () => {
      await generateMockUniverseState();

      const hackerApplication = {
        emailConsent: true,
        gender: enumOptions['gender'][0],
        pronouns: enumOptions['pronouns'][0],
        ethnicity: enumOptions['ethnicity'][0],
        timezone: enumOptions['timezone'][0],
        wantSwag: false,
        addressLine1: 'ASDASSADAS',
        addressLine2: '',
        city: 'asdasdas',
        province: enumOptions['province'][0],
        postalCode: 'N0B4V3',
        school: 'University of Toronto',
        program: 'Computer Science',
        yearsOfStudy: enumOptions['yearsOfStudy'][0],
        hackathonsAttended: enumOptions['hackathonsAttended'][0],
        resumeSharePermission: true,
        githubLink: 'GitHub',
        portfolioLink: 'Portfolio',
        linkedinLink: 'LinkedIn',
        projectEssay: 'X '.repeat(50),
        requestedWorkshops: 'blah blah',
        accomplishEssay: 'X '.repeat(50),
        mlhCOC: true,
        mlhEmail: true,
        mlhData: true,
        country: 'Canada',
        preEventWorkshops: enumOptions['preEventWorkshops'][0],
      } as IApplication;

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
        hackerApplication: {
          resumeFileName: 'wtf.exe',
        },
      });

      await expect(updateApplication(
        user.toJSON() as IUser,
        true,
        hackerApplication,
      )).rejects.toThrow(SubmissionDeniedError);

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        resumeFileName: 'wtf.exe',
      });
      expect(resultObject.status.applied).toBeFalsy();
    });
  });
});

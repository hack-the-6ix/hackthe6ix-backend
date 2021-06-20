import { updateApplication } from '../../../controller/UserController';
import { fetchUniverseState } from '../../../controller/util/resources';
import { enumOptions, IApplication, IUser } from '../../../models/user/fields';
import User from '../../../models/user/User';
import { SubmissionDeniedError, WriteDeniedError } from '../../../types/types';
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

jest.mock('../../../services/mailer/external', () => {
  const external = jest.requireActual('../../../services/mailer/external');
  return {
    ...external,
    sendEmailRequest: jest.fn(() => mockSuccessResponse()),
    getTemplate: (templateName: string) => mockGetMailTemplate(templateName),
  };
});

/**
 * TODO: Mock resume submission
 */

/**
 * We will be using the real User schema and submitting a simulated real application
 */
describe('Update Real Application', () => {
  test('Valid update', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

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

    await updateApplication(
      user.toJSON() as IUser,
      false,
      hackerApplication,
    );

    const resultObject = await User.findOne({
      _id: hackerUser._id,
    });

    expect(resultObject.toJSON().hackerApplication).toEqual(hackerApplication);
    expect(resultObject.status.applied).toBeFalsy();
  });

  test('Invalid update', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

    const hackerApplication = {
      gender: 'AdasdasasdasMale',
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
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

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
});

describe('Submit Real Application', () => {
  test('Mandatory Fields', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

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
      hackerApplication: {
        resumeFileName: 'wtf.exe',
      },
    });

    await updateApplication(
      user.toJSON() as IUser,
      true,
      hackerApplication,
    );

    const resultObject = await User.findOne({
      _id: hackerUser._id,
    });

    expect(resultObject.toJSON().hackerApplication).toEqual({
      ...hackerApplication,
      resumeFileName: 'wtf.exe',
    });
    expect(resultObject.status.applied).toBeTruthy();
  });

  test('MLH COC Denied', async () => {
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

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
    fetchUniverseState.mockReturnValue(generateMockUniverseState());

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
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

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
        portfolioLink: 'Portfolio',
        linkedinLink: 'LinkedIn',
        projectEssay: 'X '.repeat(50),
        requestedWorkshops: 'blah blah',
        accomplishEssay: 'X '.repeat(50),
        mlhCOC: true,
        mlhEmail: true,
        mlhData: true,
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

      await updateApplication(
        user.toJSON() as IUser,
        true,
        hackerApplication,
      );

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        ...hackerApplication,
        resumeFileName: 'wtf.exe',
      });
      expect(resultObject.status.applied).toBeTruthy();
    });

    test('Yes swag', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const hackerApplication = {
        emailConsent: true,
        gender: enumOptions['gender'][0],
        pronouns: enumOptions['pronouns'][0],
        ethnicity: enumOptions['ethnicity'][0],
        timezone: enumOptions['timezone'][0],
        wantSwag: true,
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

      await updateApplication(
        user.toJSON() as IUser,
        true,
        hackerApplication,
      );

      const resultObject = await User.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        ...hackerApplication,
        resumeFileName: 'wtf.exe',
      });
      expect(resultObject.status.applied).toBeTruthy();
    });

    test('Said yes to swag, but incomplete address', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

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
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

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

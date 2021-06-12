import { updateApplication } from '../../../controller/UserController';
import { fetchUniverseState } from '../../../controller/util/resources';
import { IApplication, IUser } from '../../../models/user/fields';
import User from '../../../models/user/User';
import * as dbHandler from '../db-handler';
import { generateMockUniverseState, hackerUser } from '../test-utils';

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => await dbHandler.connect());

/**
 * Clear all test data after every test.
 */
afterEach(async () => await dbHandler.clearDatabase());

/**
 * Remove and close the db and server.
 */
afterAll(async () => await dbHandler.closeDatabase());

jest.mock('../../../controller/util/resources', () => {
  const { getModels } = jest.requireActual('../../../controller/util/resources');
  return {
    fetchUniverseState: jest.fn(),
    getModels: getModels,
  }
});

/**
 * We will be using the real User schema and submitting a simulated real application
 */
describe('Submit Application', () => {
  describe('Success', () => {
    test('Normal Deadline', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const hackerApplication = {
        gender: 'Male',
        pronouns: 'He/Him',
        ethnicity: 'East Asian (e.g. China, Japan, Korea)',
        timezone: 'EST - Eastern Standard Time	GMT-5:00',
        school: 'University of Toronto',
        program: 'Computer Science',
        yearsOfStudy: 'Undergraduate Year 3',
        hackathonsAttended: '6+',
        projectEssay: 'a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a ',
        accomplishEssay: 'a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a ',
        mlhCOC: true
      } as IApplication;

      const user = await User.create({
        ...hackerUser,
        status: {
          applied: false,
        },
        hackerApplication: {
          resumeFileName: 'wtf.exe'
        }
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
        resumeFileName: 'wtf.exe'
      });
      expect(resultObject.status.applied).toBeTruthy();
    });
  });
});


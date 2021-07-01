import moment from 'moment';
import { timestampFormat } from '../../../consts';
import { fetchUser } from '../../../controller/UserController';
import { fetchUniverseState } from '../../../controller/util/resources';
import User from '../../../models/user/User';
import {
  canUpdateApplication,
  getApplicationDeadline,
  getConfirmationDeadline,
  isConfirmationOpen,
} from '../../../models/validator';
import {
  generateMockUniverseState,
  hackerUser,
  organizerUser,
  runAfterAll,
  runAfterEach,
  runBeforeAll,
} from '../../test-utils';

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

jest.mock('../../../controller/util/resources', () => {
  const { getModels } = jest.requireActual('../../../controller/util/resources');
  return {
    fetchUniverseState: jest.fn(),
    getModels: getModels,
  };
});

jest.mock('../../../models/validator', () => {
  const validators = jest.requireActual('../../../models/validator');
  return {
    ...validators,
    canUpdateApplication: jest.fn(),
    isConfirmationOpen: jest.fn(),
    getApplicationDeadline: jest.fn(),
    getConfirmationDeadline: jest.fn(),
  };
});

describe('Interceptor', () => {
  describe('Can Apply', () => {
    beforeEach(() => isConfirmationOpen.mockImplementation(jest.requireActual('../../../models/validator').isConfirmationOpen));

    test('Success', async () => {
      canUpdateApplication.mockReturnValue(() => true);
      const user = await User.create(hackerUser);
      const fetchedUser = await fetchUser(user);

      expect(fetchedUser.status.canApply).toBeTruthy();
    });

    test('Fail', async () => {
      canUpdateApplication.mockReturnValue(() => false);
      const user = await User.create(hackerUser);
      const fetchedUser = await fetchUser(user);

      expect(fetchedUser.status.canApply).toBeFalsy();
    });
  });

  describe('Can Confirm', () => {
    beforeEach(() => canUpdateApplication.mockImplementation(jest.requireActual('../../../models/validator').canUpdateApplication));

    test('Success', async () => {
      isConfirmationOpen.mockReturnValue(true);
      const user = await User.create(hackerUser);
      const fetchedUser = await fetchUser(user);

      expect(fetchedUser.status.canConfirm).toBeTruthy();
    });

    test('Fail', async () => {
      isConfirmationOpen.mockReturnValue(false);
      const user = await User.create(hackerUser);
      const fetchedUser = await fetchUser(user);

      expect(fetchedUser.status.canConfirm).toBeFalsy();
    });
  });

  describe('Mail Merge', () => {
    beforeEach(() => canUpdateApplication.mockImplementation(jest.requireActual('../../../models/validator').canUpdateApplication));

    test('First Name', async () => {
      const user = await User.create(organizerUser);
      const fetchedUser = await fetchUser(user);
      expect(fetchedUser.mailmerge.FIRST_NAME).toEqual(user.firstName);
    });
    test('Last Name', async () => {
      const user = await User.create(organizerUser);
      const fetchedUser = await fetchUser(user);
      expect(fetchedUser.mailmerge.LAST_NAME).toEqual(user.lastName);
    });
    test('Application Deadline', async () => {
      const mockDate = 12345;
      getApplicationDeadline.mockReturnValue(mockDate);

      const user = await User.create(organizerUser);
      const fetchedUser = await fetchUser(user);
      expect(fetchedUser.mailmerge.MERGE_APPLICATION_DEADLINE).toEqual(moment(mockDate).format(timestampFormat));
    });
    test('Confirmation Deadline', async () => {
      const mockDate = 54321;
      getConfirmationDeadline.mockReturnValue(mockDate);

      const user = await User.create(organizerUser);
      const fetchedUser = await fetchUser(user);
      expect(fetchedUser.mailmerge.MERGE_CONFIRMATION_DEADLINE).toEqual(moment(mockDate).format(timestampFormat));
    });
  });

  describe('Computed Deadlines', () => {
    beforeEach(() => {
      canUpdateApplication.mockImplementation(jest.requireActual('../../../models/validator').canUpdateApplication);
      getApplicationDeadline.mockImplementation(jest.requireActual('../../../models/validator').getApplicationDeadline);
      getConfirmationDeadline.mockImplementation(jest.requireActual('../../../models/validator').getConfirmationDeadline);
    });

    describe('Application', () => {
      describe('Personal Deadline', () => {
        test('Global in the future', async () => {
          fetchUniverseState.mockReturnValue(generateMockUniverseState());
          const personalDeadline = new Date().getTime();

          const user = await User.create({
            ...hackerUser,
            personalApplicationDeadline: personalDeadline,
          });
          const fetchedUser = await fetchUser(user);
          expect(fetchedUser.computedApplicationDeadline).toEqual(personalDeadline);
        });
        test('Global in the Past', async () => {
          fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));
          const personalDeadline = new Date().getTime();

          const user = await User.create({
            ...hackerUser,
            personalApplicationDeadline: personalDeadline,
          });
          const fetchedUser = await fetchUser(user);
          expect(fetchedUser.computedApplicationDeadline).toEqual(personalDeadline);
        });
      });
      test('No Personal Deadline', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState());

        const user = await User.create(hackerUser);
        const fetchedUser = await fetchUser(user);
        expect(fetchedUser.computedApplicationDeadline).toEqual((await fetchUniverseState()).public.globalApplicationDeadline);
      });

    });
    describe('Confirmation', () => {
      describe('Personal Deadline', () => {
        test('Global in the future', async () => {
          fetchUniverseState.mockReturnValue(generateMockUniverseState());
          const personalDeadline = new Date().getTime();

          const user = await User.create({
            ...hackerUser,
            personalConfirmationDeadline: personalDeadline,
          });
          const fetchedUser = await fetchUser(user);
          expect(fetchedUser.computedConfirmationDeadline).toEqual(personalDeadline);
        });
        test('Global in the Past', async () => {
          fetchUniverseState.mockReturnValue(generateMockUniverseState(undefined, -10000));
          const personalDeadline = new Date().getTime();

          const user = await User.create({
            ...hackerUser,
            personalConfirmationDeadline: personalDeadline,
          });
          const fetchedUser = await fetchUser(user);
          expect(fetchedUser.computedConfirmationDeadline).toEqual(personalDeadline);
        });
      });
      test('No Personal Deadline', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState());

        const user = await User.create(hackerUser);
        const fetchedUser = await fetchUser(user);
        expect(fetchedUser.computedConfirmationDeadline).toEqual((await fetchUniverseState()).public.globalConfirmationDeadline);
      });
    });
  });

  describe('Status', () => {
    const baseStatus = {
      applied: true,
      accepted: true,
      rejected: true,
      waitlisted: true,
      confirmed: true,
      declined: true,
      checkedIn: true,
    };

    describe('Hacker', () => {
      test('Released', async () => {
        const user = await User.create({
          ...hackerUser,
          status: {
            ...baseStatus,
            statusReleased: true,
          },
        });

        const fetchedUser = await fetchUser(user);

        expect(fetchedUser.status).toMatchObject(baseStatus);
      });

      test('Not released', async () => {
        const user = await User.create({
          ...hackerUser,
          status: {
            ...baseStatus,
            statusReleased: false,
          },
        });

        const fetchedUser = await fetchUser(user);

        expect(fetchedUser.status).toMatchObject({
          applied: true,
          accepted: false,
          rejected: false,
          waitlisted: false,
          confirmed: false,
          declined: false,
          checkedIn: false,
        });
      });
    });

    test('Organizer', async () => {
      const status = {
        ...baseStatus,
        statusReleased: false,
      };

      const user = await User.create({
        ...organizerUser,
        status: status,
      });

      const fetchedUser = await fetchUser(user);

      expect(fetchedUser.status).toMatchObject(status);
    });
  });

});

describe('Virtual', () => {
  describe('Computed Application Score', () => {
    test('No scores', async () => {
      const user = await User.create(hackerUser);
      expect(user.internal.computedApplicationScore).toEqual(-1);
    });

    test('Normal Scores', async () => {
      const scores = [1, 2, 3, 4];
      const user = await User.create({
        ...hackerUser,
        internal: {
          applicationScores: scores,
        },
      });

      let total = 0;
      for (let i = 0; i < scores.length; i++) {
        total += scores[i];
      }

      expect(user.internal.computedApplicationScore).toEqual(total / scores.length);
    });
  });

  describe('Roles', () => {
    test('Admin', async () => {
      const user = await User.create({
        ...hackerUser,
        groups: {
          admin: true,
        },
      });

      expect(user.toJSON().roles).toEqual({
        admin: true,
        organizer: true,
        volunteer: true,
        hacker: true,
      });
    });
    test('Organizer', async () => {
      const user = await User.create({
        ...hackerUser,
        groups: {
          organizer: true,
        },
      });

      expect(user.toJSON().roles).toEqual({
        admin: false,
        organizer: true,
        volunteer: true,
        hacker: false,
      });

    });
    test('Volunteer', async () => {
      const user = await User.create({
        ...hackerUser,
        groups: {
          volunteer: true,
        },
      });

      expect(user.toJSON().roles).toEqual({
        admin: false,
        organizer: false,
        volunteer: true,
        hacker: false,
      });
    });
    test('Hacker', async () => {
      const user = await User.create({
        ...hackerUser,
        groups: {
          hacker: true,
        },
      });

      expect(user.toJSON().roles).toEqual({
        admin: false,
        organizer: false,
        volunteer: false,
        hacker: true,
      });
    });
  });

  test('Full Name', async () => {
    const user = await User.create({
      ...hackerUser,
      firstName: 'Bill',
      lastName: 'Gates',
    });

    expect(user.toJSON().fullName).toEqual('Bill Gates');
  });
});

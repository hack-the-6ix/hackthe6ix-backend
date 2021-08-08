import { IUser } from '../../../models/user/fields';
import {
  canRSVP,
  canUpdateApplication,
  isAccepted,
  isApplicationOpen,
  isApplied,
  isDeclined,
  isRSVPOpen,
  isStatusReleased,
} from '../../../models/validator';
import { hackerUser } from '../../test-utils';

describe('User States', () => {
  describe('Is Applied', () => {
    test('True', () => {
      expect(isApplied({
        ...hackerUser,
        status: {
          ...hackerUser.status,
          applied: true,
        },
      } as IUser)).toBeTruthy();
    });

    test('False', () => {
      expect(isApplied({
        ...hackerUser,
        status: {
          ...hackerUser.status,
          applied: false,
        },
      } as IUser)).toBeFalsy();
    });
  });

  describe('Is Declined', () => {
    test('True', () => {
      expect(isDeclined({
        ...hackerUser,
        status: {
          ...hackerUser.status,
          declined: true,
        },
      } as IUser)).toBeTruthy();
    });

    test('False', () => {
      expect(isDeclined({
        ...hackerUser,
        status: {
          ...hackerUser.status,
          declined: false,
        },
      } as IUser)).toBeFalsy();
    });
  });

  describe('Is Accepted', () => {
    test('True', () => {
      expect(isAccepted({
        ...hackerUser,
        status: {
          ...hackerUser.status,
          accepted: true,
        },
      } as IUser)).toBeTruthy();
    });

    test('False', () => {
      expect(isAccepted({
        ...hackerUser,
        status: {
          ...hackerUser.status,
          accepted: false,
        },
      } as IUser)).toBeFalsy();
    });
  });

  describe('Is Status Released', () => {
    test('True', () => {
      expect(isStatusReleased({
        ...hackerUser,
        status: {
          ...hackerUser.status,
          statusReleased: true,
        },
      } as IUser)).toBeTruthy();
    });

    test('False', () => {
      expect(isStatusReleased({
        ...hackerUser,
        status: {
          ...hackerUser.status,
          statusReleased: false,
        },
      } as IUser)).toBeFalsy();
    });
  });

  describe('Applications Open', () => {
    test('Open', () => {
      expect(isApplicationOpen({
        ...hackerUser,
        computedApplicationDeadline: new Date().getTime() + 1000,
      } as IUser)).toBeTruthy();
    });

    test('Closed', () => {
      expect(isApplicationOpen({
        ...hackerUser,
        computedApplicationDeadline: new Date().getTime() - 1000,
      } as IUser)).toBeFalsy();
    });
  });

  describe('RSVP Open', () => {
    test('Open', () => {
      expect(isRSVPOpen({
        ...hackerUser,
        computedRSVPDeadline: new Date().getTime() + 1000,
      } as IUser)).toBeTruthy();
    });

    test('Closed', () => {
      expect(isRSVPOpen({
        ...hackerUser,
        computedRSVPDeadline: new Date().getTime() - 1000,
      } as IUser)).toBeFalsy();
    });
  });

  describe('Can update application', () => {
    test('True', () => {
      expect(canUpdateApplication({
        ...hackerUser,
        computedApplicationDeadline: new Date().getTime() + 1000,
        status: {
          ...hackerUser.status,
          applied: false,
        },
      } as IUser)).toBeTruthy();
    });

    describe('False', () => {
      test('Application Closed', () => {
        expect(canUpdateApplication({
          ...hackerUser,
          computedApplicationDeadline: new Date().getTime() - 1000,
          status: {
            ...hackerUser.status,
            applied: false,
          },
        } as IUser)).toBeFalsy();
      });

      test('Already Applied', () => {
        expect(canUpdateApplication({
          ...hackerUser,
          computedApplicationDeadline: new Date().getTime() + 1000,
          status: {
            ...hackerUser.status,
            applied: true,
          },
        } as IUser)).toBeFalsy();
      });
    });
  });

  describe('Can RSVP', () => {
    test('True', () => {
      expect(canRSVP({
        ...hackerUser,
        computedRSVPDeadline: new Date().getTime() + 1000,
        status: {
          ...hackerUser.status,
          declined: false,
          accepted: true,
          statusReleased: true,
        },
      } as IUser)).toBeTruthy();
    });

    describe('False', () => {
      test('Declined', () => {
        expect(canRSVP({
          ...hackerUser,
          computedRSVPDeadline: new Date().getTime() + 1000,
          status: {
            ...hackerUser.status,
            declined: true,
            accepted: true,
            statusReleased: true,
          },
        } as IUser)).toBeFalsy();
      });

      test('RSVP Expired', () => {
        expect(canRSVP({
          ...hackerUser,
          computedRSVPDeadline: new Date().getTime() - 1000,
          status: {
            ...hackerUser.status,
            declined: false,
            accepted: true,
            statusReleased: true,
          },
        } as IUser)).toBeFalsy();
      });

      test('Not Accepted', () => {
        expect(canRSVP({
          ...hackerUser,
          computedRSVPDeadline: new Date().getTime() + 1000,
          status: {
            ...hackerUser.status,
            declined: false,
            accepted: false,
            statusReleased: true,
          },
        } as IUser)).toBeFalsy();
      });

      test('Status not released', () => {
        expect(canRSVP({
          ...hackerUser,
          computedRSVPDeadline: new Date().getTime() + 1000,
          status: {
            ...hackerUser.status,
            declined: false,
            accepted: true,
            statusReleased: false,
          },
        } as IUser)).toBeFalsy();
      });
    });
  });
});

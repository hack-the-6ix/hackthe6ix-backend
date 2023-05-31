import { IUser } from '../../../models/user/fields';
import {
  canRSVP,
  canUpdateApplication,
  isAccepted,
  isApplicationExpired,
  isApplicationOpen,
  isApplied,
  isDeclined,
  isRSVPExpired,
  isRSVPOpen,
  isStatusReleased,
  rsvpDecisionSubmitted,
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
    test('Not yet open', () => {
      expect(isApplicationOpen({
        ...hackerUser,
        computedApplicationOpen: new Date().getTime() + 500,
        computedApplicationDeadline: new Date().getTime() + 1000,
      } as IUser)).toBeFalsy();
    });

    test('Open', () => {
      expect(isApplicationOpen({
        ...hackerUser,
        computedApplicationOpen: new Date().getTime(),
        computedApplicationDeadline: new Date().getTime() + 1000
      } as IUser)).toBeTruthy();
    });

    test('Closed', () => {
      expect(isApplicationOpen({
        ...hackerUser,
        computedApplicationOpen: new Date().getTime(),
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
        computedApplicationOpen: new Date().getTime(),
        computedApplicationDeadline: new Date().getTime() + 1000,
        status: {
          ...hackerUser.status,
          applied: false,
        },
      } as IUser)).toBeTruthy();
    });

    describe('False', () => {
      test('Application Not Yet Open', () => {
        expect(canUpdateApplication({
          ...hackerUser,
          computedApplicationOpen: new Date().getTime() + 500,
          computedApplicationDeadline: new Date().getTime() + 1000,
          status: {
            ...hackerUser.status,
            applied: false,
          },
        } as IUser)).toBeFalsy();
      });

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

  describe('RSVP Decision Submitted', () => {

    describe('True', () => {
      test('Declined', () => {
        expect(rsvpDecisionSubmitted({
          ...hackerUser,
          status: {
            ...hackerUser.status,
            declined: true,
            confirmed: false,
          },
        } as IUser)).toBeTruthy();
      });

      test('Confirmed', () => {

        expect(rsvpDecisionSubmitted({
          ...hackerUser,
          status: {
            ...hackerUser.status,
            declined: false,
            confirmed: true,
          },
        } as IUser)).toBeTruthy();
      });
    });

    test('False', () => {
      expect(rsvpDecisionSubmitted({
        ...hackerUser,
        status: {
          ...hackerUser.status,
          declined: false,
          confirmed: false,
        },
      } as IUser)).toBeFalsy();
    });
  });

  describe('RSVP Expired', () => {
    test('True', () => {
      expect(isRSVPExpired({
        ...hackerUser,
        status: {
          ...hackerUser.status,
          applied: true,
          declined: false,
          accepted: true,
          confirmed: false,
          statusReleased: true,
        },
        computedRSVPDeadline: new Date().getTime() - 1000,
      } as IUser)).toBeTruthy();
    });

    describe('False', () => {
      test('Status not released', () => {
        expect(isRSVPExpired({
          ...hackerUser,
          status: {
            ...hackerUser.status,
            applied: true,
            declined: false,
            accepted: true,
            confirmed: false,
            statusReleased: false,
          },
          computedRSVPDeadline: new Date().getTime() - 1000,
        } as IUser)).toBeFalsy();
      });

      test('User not accepted', () => {
        expect(isRSVPExpired({
          ...hackerUser,
          status: {
            ...hackerUser.status,
            applied: true,
            declined: false,
            accepted: false,
            confirmed: false,
            statusReleased: true,
          },
          computedRSVPDeadline: new Date().getTime() - 1000,
        } as IUser)).toBeFalsy();
      });

      test('User is confirmed', () => {
        expect(isRSVPExpired({
          ...hackerUser,
          status: {
            ...hackerUser.status,
            applied: true,
            declined: false,
            accepted: true,
            confirmed: true,
            statusReleased: true,
          },
          computedRSVPDeadline: new Date().getTime() - 1000,
        } as IUser)).toBeFalsy();
      });

      test('User is declined', () => {
        expect(isRSVPExpired({
          ...hackerUser,
          status: {
            ...hackerUser.status,
            applied: true,
            declined: true,
            accepted: true,
            confirmed: false,
            statusReleased: true,
          },
          computedRSVPDeadline: new Date().getTime() - 1000,
        } as IUser)).toBeFalsy();
      });

      test('RSVP window has not passed', () => {
        expect(isRSVPExpired({
          ...hackerUser,
          status: {
            ...hackerUser.status,
            applied: true,
            declined: false,
            accepted: true,
            confirmed: false,
            statusReleased: true,
          },
          computedRSVPDeadline: new Date().getTime() + 1000,
        } as IUser)).toBeFalsy();
      });
    });
  });

  describe('Application Expired', () => {

    test('True', () => {
      expect(isApplicationExpired({
        ...hackerUser,
        status: {
          ...hackerUser.status,
          applied: false,
        },
        computedApplicationDeadline: new Date().getTime() - 1000,
      } as IUser));
    });

    describe('False', () => {
      test('Already applied', () => {
        expect(isApplicationExpired({
          ...hackerUser,
          status: {
            ...hackerUser.status,
            applied: true,
          },
          computedApplicationDeadline: new Date().getTime() - 1000,
        } as IUser));
      });

      test('Application deadline not expired', () => {
        expect(isApplicationExpired({
          ...hackerUser,
          status: {
            ...hackerUser.status,
            applied: false,
          },
          computedApplicationDeadline: new Date().getTime() + 1000,
        } as IUser));
      });
    });
  });
});

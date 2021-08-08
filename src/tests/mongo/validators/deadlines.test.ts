import { IUser } from '../../../models/user/fields';
import { getApplicationDeadline, getRSVPDeadline } from '../../../models/validator';
import { UniverseState } from '../../../types/types';
import { hackerUser } from '../../test-utils';

describe('Deadlines', () => {
  describe('Application', () => {
    test('Personal', () => {
      expect(getApplicationDeadline({
        ...hackerUser,
        personalApplicationDeadline: 1234,
      } as IUser, {
        public: {
          globalApplicationDeadline: 4321,
        },
      } as UniverseState)).toEqual(1234);
    });

    test('Global', () => {
      expect(getApplicationDeadline({
        ...hackerUser,
      } as IUser, {
        public: {
          globalApplicationDeadline: 4321,
        },
      } as UniverseState)).toEqual(4321);
    });
  });

  describe('RSVP', () => {
    test('Personal', () => {
      expect(getRSVPDeadline({
        ...hackerUser,
        personalConfirmationDeadline: 1234,
      } as IUser, {
        public: {
          globalConfirmationDeadline: 4321,
        },
      } as UniverseState)).toEqual(1234);
    });

    test('Global', () => {
      expect(getRSVPDeadline({
        ...hackerUser,
      } as IUser, {
        public: {
          globalConfirmationDeadline: 4321,
        },
      } as UniverseState)).toEqual(4321);
    });
  });

});

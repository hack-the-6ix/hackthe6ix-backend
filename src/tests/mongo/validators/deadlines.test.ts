import { IUser } from '../../../models/user/fields';
import {
  getApplicationDeadline,
  getApplicationOpen,
  getRSVPDeadline
} from '../../../models/validator';
import { UniverseState } from '../../../types/types';
import { hackerUser } from '../../test-utils';
import {LAST_SECOND_OF_CENTURY} from "../../../consts";

jest.mock('../../../consts', () => (
    {
      ...jest.requireActual('../../../consts'),
      deadlinesOverrides: ["specific@overridetwo.com"]
    }
));

describe('Deadlines', () => {
  describe('Application Open', () => {
    test('Personal', () => {
      expect(getApplicationOpen({
        ...hackerUser,
        personalApplicationOpen: 1234,
      } as IUser, {
        public: {
          globalApplicationDeadline: 4321,
        },
      } as UniverseState)).toEqual(1234);
    });

    test('Override', () => {
      expect(getApplicationOpen({
        ...hackerUser,
        email: "specific@overridetwo.com"
      } as IUser, {} as UniverseState)).toEqual(0);
    });

    test('Global', () => {
      expect(getApplicationOpen({
        ...hackerUser,
      } as IUser, {
        public: {
          globalApplicationOpen: 4321,
        },
      } as UniverseState)).toEqual(4321);
    });
  });

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

    test('Override', () => {
      expect(getApplicationDeadline({
        ...hackerUser,
        email: "specific@overridetwo.com",
      } as IUser, {} as UniverseState)).toEqual(LAST_SECOND_OF_CENTURY);
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
        personalRSVPDeadline: 1234,
      } as IUser, {
        public: {
          globalConfirmationDeadline: 4321,
        },
      } as UniverseState)).toEqual(1234);
    });

    test('Override', () => {
      expect(getRSVPDeadline({
        ...hackerUser,
        email: "specific@overridetwo.com",
      } as IUser, {} as UniverseState)).toEqual(LAST_SECOND_OF_CENTURY);
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

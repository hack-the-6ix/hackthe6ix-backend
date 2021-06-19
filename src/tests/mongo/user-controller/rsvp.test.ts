import { rsvp } from '../../../controller/UserController';
import { fetchUniverseState } from '../../../controller/util/resources';
import User from '../../../models/user/User';
import { DeadlineExpiredError, RSVPRejectedError } from '../../../types/types';
import * as dbHandler from '../../db-handler';
import { generateMockUniverseState, hackerUser } from '../../test-utils';

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
  };
});

describe('RSVP', () => {

  describe('Deadlines', () => {
    describe('Global Deadline', () => {
      test('Success', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState());

        const user = await User.create({
          ...hackerUser,
          status: {
            accepted: true,
          },
        });

        await rsvp(
          user,
          {
            attending: true,
          },
        );

        const resultObject = await User.findOne({
          _id: user._id,
        });

        expect(resultObject.toJSON().status.confirmed).toEqual(true);
        expect(resultObject.toJSON().status.declined).toEqual(false);
      });

      test('Fail', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState(undefined, -10000));

        const user = await User.create({
          ...hackerUser,
          status: {
            accepted: true,
          },
        });

        await expect(rsvp(
          user,
          {
            attending: true,
          },
        )).rejects.toThrow(DeadlineExpiredError);

        const resultObject = await User.findOne({
          _id: user._id,
        });

        expect(resultObject.toJSON().status.confirmed).toEqual(false);
        expect(resultObject.toJSON().status.declined).toEqual(false);
      });
    });

    describe('Personal Deadline', () => {
      test('Success', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState(undefined, -10000));

        const user = await User.create({
          ...hackerUser,
          status: {
            accepted: true,
          },
          personalRSVPDeadline: new Date().getTime() + 10000,
        });

        await rsvp(
          user,
          {
            attending: true,
          },
        );

        const resultObject = await User.findOne({
          _id: user._id,
        });

        expect(resultObject.toJSON().status.confirmed).toEqual(true);
        expect(resultObject.toJSON().status.declined).toEqual(false);
      });

      test('Fail', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState(undefined, -10000));

        const user = await User.create({
          ...hackerUser,
          status: {
            accepted: true,
          },
          personalRSVPDeadline: new Date().getTime() - 10000,
        });

        await expect(rsvp(
          user,
          {
            attending: true,
          },
        )).rejects.toThrow(DeadlineExpiredError);

        const resultObject = await User.findOne({
          _id: user._id,
        });

        expect(resultObject.toJSON().status.confirmed).toEqual(false);
        expect(resultObject.toJSON().status.declined).toEqual(false);
      });
    });
  });

  describe('Not eligible', () => {
    test('Not accepted', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          accepted: false,
        },
      });

      expect(rsvp(
        user,
        {
          attending: true,
        },
      )).rejects.toThrow(RSVPRejectedError);

      const resultObject = await User.findOne({
        _id: user._id,
      });

      expect(resultObject.toJSON().status.confirmed).toEqual(false);
      expect(resultObject.toJSON().status.declined).toEqual(false);
    });

    test('Already declined', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          accepted: true,
          declined: true,
        },
      });

      expect(rsvp(
        user,
        {
          attending: true,
        },
      )).rejects.toThrow(RSVPRejectedError);

      const resultObject = await User.findOne({
        _id: user._id,
      });

      expect(resultObject.toJSON().status.confirmed).toEqual(false);
      expect(resultObject.toJSON().status.declined).toEqual(true);
    });
  });

  describe('Confirmation State', () => {
    test('Attending', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          accepted: true,
        },
      });

      await rsvp(
        user,
        {
          attending: true,
        },
      );

      const resultObject = await User.findOne({
        _id: user._id,
      });

      expect(resultObject.toJSON().status.confirmed).toEqual(true);
      expect(resultObject.toJSON().status.declined).toEqual(false);
    });

    test('Not Attending', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      const user = await User.create({
        ...hackerUser,
        status: {
          accepted: true,
        },
      });

      await rsvp(
        user,
        {
          attending: false,
        },
      );

      const resultObject = await User.findOne({
        _id: user._id,
      });

      expect(resultObject.toJSON().status.confirmed).toEqual(false);
      expect(resultObject.toJSON().status.declined).toEqual(true);
    });
  });
});

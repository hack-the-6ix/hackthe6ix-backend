import { updateApplication } from '../../../controller/UserController';
import { fetchUniverseState, getModels } from '../../../controller/util';
import { IUser } from '../../../models/user/fields';
import {
  canSubmitApplication,
  isOrganizer,
  isUserOrOrganizer,
  maxLength,
} from '../../../models/validator';
import { ReadCheckRequest, WriteCheckRequest, WriteDeniedError } from '../../../types/types';
import * as dbHandler from '../db-handler';
import { generateMockUniverseState, generateTestModel, hackerUser } from '../test-utils';

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

jest.mock('../../../controller/util', () => (
  {
    fetchUniverseState: jest.fn(),
    getModels: jest.fn()
  }
));

const [userTestModel, mockModels] = generateTestModel({
  writeCheck: (request: WriteCheckRequest<any, IUser>) => isUserOrOrganizer(request.requestUser, request.targetObject),
  readCheck: (request: ReadCheckRequest<IUser>) => isUserOrOrganizer(request.requestUser, request.targetObject),

  FIELDS: {
    firstName: {
      type: String,
      readCheck: true,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser) && maxLength(64)(request),
    },
    lastName: {
      type: String,
      readCheck: true,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser) && maxLength(64)(request),
    },
    email: {
      type: String,
      readCheck: true,
      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser) && maxLength(64)(request),
    },
    internal: {
      readCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),
      writeCheck: (request: ReadCheckRequest<IUser>) => isOrganizer(request.requestUser),

      FIELDS: {
        secretNode: {
          type: String,
          readCheck: true,
          writeCheck: true,
        },
      },
    },
    status: {
      applied: false
    },
    hackerApplication: {
      readCheck: true,
      writeCheck: canSubmitApplication(),

      FIELDS: {
        optionalField: {
          type: String,
          readCheck: true,
          writeCheck: true,
          caption: "Optional Field"
        },
        optionalField2: {
          type: String,
          readCheck: true,
          writeCheck: true,
          caption: "Optional Field 2"
        },
        requiredFieldImplicit: {
          type: String,
          readCheck: true,
          writeCheck: (request: WriteCheckRequest<string, any>) => request.fieldValue === 'foobar',
          caption: "Required Field"
        },
        requiredFieldExplicit: {
          type: String,
          readCheck: true,
          writeCheck: (request: WriteCheckRequest<string, any>) => !request.fieldValue || request.fieldValue.length < 100,
          submitCheck: (request: WriteCheckRequest<string, any>) => request.fieldValue === 'foobar',
          caption: "Optional Field 2"
        },
        conditionalField: {
          type: String,
          readCheck: true,
          writeCheck: (request: WriteCheckRequest<string, any>) => !request.fieldValue || request.fieldValue.length < 10,
          caption: "Conditional Field"
        },
      },
    },
    personalApplicationDeadline: {
      type: Number,
      required: true,
      caption: 'Personal Application Deadline',
      default: -1,

      writeCheck: (request: WriteCheckRequest<string, IUser>) => isOrganizer(request.requestUser),
      readCheck: true,
    },

  },
}, 'user');
getModels.mockReturnValue(mockModels);

describe('Update Application', () => {

  describe('Success', () => {
    test('Normal Deadline', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      await userTestModel.create({
        ...hackerUser,
        status: {
          applied: false
        }
      });

      await updateApplication(
        hackerUser,
        false,
        {
          optionalField2: 'Test',
        } as any,
      );

      const resultObject = await userTestModel.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        optionalField2: 'Test',
      });
    });

    test('Personal Deadline', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));

      await userTestModel.create({
        ...hackerUser,
        status: {
          applied: false
        },
        personalApplicationDeadline: new Date().getTime() + 10000
      });

      await updateApplication(
        hackerUser,
        false,
        {
          optionalField2: 'Test',
        } as any,
      );

      const resultObject = await userTestModel.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        optionalField2: 'Test',
      });
    });


    test('Missing Required Field', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      await userTestModel.create({
        ...hackerUser,
        status: {
          applied: false
        }
      });

      await updateApplication(
        hackerUser,
        false,
        {
          optionalField2: 'Test',
        } as any,
      );

      const resultObject = await userTestModel.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        optionalField2: 'Test',
      });
    });
  });

  describe('Fail', () => {

    test('Write violation', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      await userTestModel.create({
        ...hackerUser,
        status: {
          applied: false
        }
      });

      expect(updateApplication(
        hackerUser,
        false,
        {
          conditionalField: 'XXXXXXXXXXXXXXXXXXXXXXXX',
        } as any,
      )).rejects.toThrow(WriteDeniedError);

      const resultObject = await userTestModel.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
    });

    test('Already submitted', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      await userTestModel.create({
        ...hackerUser,
        status: {
          applied: true
        }
      });

      expect(updateApplication(
        hackerUser,
        false,
        {
          optionalField2: 'Test',
        } as any,
      )).rejects.toThrow(WriteDeniedError);

      const resultObject = await userTestModel.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
    });

    describe('Deadline passed', () => {
      test('Global Deadline passed', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));

        await userTestModel.create({
          ...hackerUser,
          status: {
            applied: false
          }
        });

        expect(updateApplication(
          hackerUser,
          false,
          {
            optionalField2: 'Test',
          } as any,
        )).rejects.toThrow(WriteDeniedError);

        const resultObject = await userTestModel.findOne({
          _id: hackerUser._id,
        });

        expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
      });

      test('Personal Deadline passed', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));

        await userTestModel.create({
          ...hackerUser,
          status: {
            applied: false
          },
          personalApplicationDeadline: new Date().getTime() - 1000
        });

        expect(updateApplication(
          hackerUser,
          false,
          {
            optionalField2: 'Test',
          } as any,
        )).rejects.toThrow(WriteDeniedError);

        const resultObject = await userTestModel.findOne({
          _id: hackerUser._id,
        });

        expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
      });
    });
  });
});

describe('Submit Application', () => {
  describe('Success', () => {
    test('Normal Deadline', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      await userTestModel.create({
        ...hackerUser,
        status: {
          applied: false
        }
      });

      await updateApplication(
        hackerUser,
        true,
        {
          optionalField2: 'Test',
          requiredFieldImplicit: "foobar",
          requiredFieldExplicit: "foobar",
        } as any,
      );

      const resultObject = await userTestModel.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        optionalField2: 'Test',
        requiredFieldImplicit: "foobar",
        requiredFieldExplicit: "foobar",
      });

      expect(resultObject.status.applied).toBeTruthy();
    });

    test('Personal Deadline', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));

      await userTestModel.create({
        ...hackerUser,
        status: {
          applied: false
        },
        personalApplicationDeadline: new Date().getTime() + 10000
      });

      await updateApplication(
        hackerUser,
        true,
        {
          optionalField2: 'Test',
          requiredFieldImplicit: "foobar",
          requiredFieldExplicit: "foobar",
        } as any,
      );

      const resultObject = await userTestModel.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual({
        optionalField2: 'Test',
        requiredFieldImplicit: "foobar",
        requiredFieldExplicit: "foobar",
      });

      expect(resultObject.status.applied).toBeTruthy();
    });
  });

  describe('Fail', () => {
    describe('Submit condition', () => {

      /**
       * TODO: Verify the correct field is returned when submit violation occurs
       */

      test('Implicit submitCheck', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState());

        await userTestModel.create({
          ...hackerUser,
          status: {
            applied: false
          }
        });

        expect(updateApplication(
          hackerUser,
          false,
          {
            requiredFieldImplicit: "this is not a foobar",
            requiredFieldExplicit: "foobar"
          } as any,
        )).rejects.toThrow(WriteDeniedError);

        const resultObject = await userTestModel.findOne({
          _id: hackerUser._id,
        });

        expect(resultObject.toJSON().hackerApplication).toEqual(undefined);

      });

      test('Explicit submitCheck', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState());

        await userTestModel.create({
          ...hackerUser,
          status: {
            applied: false
          }
        });

        expect(updateApplication(
          hackerUser,
          false,
          {
            requiredFieldImplicit: "foobar",
            requiredFieldExplicit: "this is not a foobar"
          } as any,
        )).rejects.toThrow(WriteDeniedError);

        const resultObject = await userTestModel.findOne({
          _id: hackerUser._id,
        });

        expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
      });

    });

    test('Write violation', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      await userTestModel.create({
        ...hackerUser,
        status: {
          applied: false
        }
      });

      expect(updateApplication(
        hackerUser,
        false,
        {
          requiredFieldImplicit: "foobar",
          requiredFieldExplicit: "foobar",
          conditionalField: 'XXXXXXXXXXXXXXXXXXXXXXXX',
        } as any,
      )).rejects.toThrow(WriteDeniedError);

      const resultObject = await userTestModel.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
    });

    test('Already submitted', async () => {
      fetchUniverseState.mockReturnValue(generateMockUniverseState());

      await userTestModel.create({
        ...hackerUser,
        status: {
          applied: true
        }
      });

      expect(updateApplication(
        hackerUser,
        true,
        {
          optionalField2: 'Test',
        } as any,
      )).rejects.toThrow(WriteDeniedError);

      const resultObject = await userTestModel.findOne({
        _id: hackerUser._id,
      });

      expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
    });

    describe('Deadline passed', () => {
      test('Global Deadline passed', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));

        await userTestModel.create({
          ...hackerUser,
          status: {
            applied: false
          }
        });

        expect(updateApplication(
          hackerUser,
          true,
          {
            optionalField2: 'Test',
          } as any,
        )).rejects.toThrow(WriteDeniedError);

        const resultObject = await userTestModel.findOne({
          _id: hackerUser._id,
        });

        expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
      });

      test('Personal Deadline passed', async () => {
        fetchUniverseState.mockReturnValue(generateMockUniverseState(-10000));

        await userTestModel.create({
          ...hackerUser,
          status: {
            applied: false
          },
          personalApplicationDeadline: new Date().getTime() - 1000
        });

        expect(updateApplication(
          hackerUser,
          true,
          {
            optionalField2: 'Test',
          } as any,
        )).rejects.toThrow(WriteDeniedError);

        const resultObject = await userTestModel.findOne({
          _id: hackerUser._id,
        });

        expect(resultObject.toJSON().hackerApplication).toEqual(undefined);
      });
    });
  });

});

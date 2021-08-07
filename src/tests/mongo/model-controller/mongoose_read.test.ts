import { cleanObject, getObject } from '../../../controller/ModelController';
import { getModels } from '../../../controller/util/resources';
import { IUser } from '../../../readCheckModelTests/user/fields';
import { ReadCheckRequest, ReadInterceptRequest } from '../../../types/checker';
import { BadRequestError } from '../../../types/errors';
import {
  adminUser,
  generateTestModel,
  hackerUser,
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

jest.mock('../../../controller/util/resources', () => (
  {
    fetchUniverseState: jest.requireActual('../../../controller/util/resources').fetchUniverseState,
    getModels: jest.fn(),
  }
));

const fields = {
  readCheck: true,
  FIELDS: {
    field1: {
      type: String,
      read: true,
    },

    publicNest: {
      readCheck: true,

      FIELDS: {
        field2: {
          type: String,
          readCheck: (request: ReadCheckRequest<string>) => request.requestUser.firstName === 'Foo',
        },
      },
    },

    privateNest: {
      readCheck: (request: ReadCheckRequest<string>) => request.requestUser.firstName === 'Bar',

      FIELDS: {
        field3: {
          type: String,
          readCheck: true,
        },

        evenMoreNests: {
          readCheck: true,

          FIELDS: {
            field4: {
              type: String,
              readCheck: true,
            },
          },
        },
      },
    },

    intercepted: {
      type: String,
      readCheck: true,
      readInterceptor: (request: ReadInterceptRequest<string, any>) => request.requestUser.firstName === 'Banana' ? 'Intercepted!' : request.fieldValue,
    },
  },
};

const [readCheckModelTest, mockModels] = generateTestModel(fields, 'ReadCheckModel');

getModels.mockReturnValue(mockModels);

const testObject = {
  field1: 'Test',
  publicNest: {
    field2: 'Bar',
  },
  privateNest: {
    field3: 'Baz',
    evenMoreNests: {
      field4: 'Banana',
    },
  },
  intercepted: 'Watermelon',
};

describe('Model Read', () => {


  /**
   * TODO: Test the other parameters like size, page, etc.
   *       I don't really care about that right now :D
   */


  describe('Bad Query', () => {
    test('Falsy Query', async () => {
      await expect((async () => {
        await getObject(hackerUser, 'ReadCheckModel', undefined);
      })()).rejects.toThrow(BadRequestError);
    });

    test('Bad page number', async () => {
      await expect((async () => {
        await getObject(hackerUser, 'ReadCheckModel', {
          page: '-1',
        });
      })()).rejects.toThrow(BadRequestError);
    });

    test('Bad size', async () => {
      await expect((async () => {
        await getObject(hackerUser, 'ReadCheckModel', {
          size: '-1',
        });
      })()).rejects.toThrow(BadRequestError);
    });

    test('Bad sort criteria', async () => {
      await expect((async () => {
        await getObject(hackerUser, 'ReadCheckModel', {
          sortCriteria: 'foo',
        });
      })()).rejects.toThrow(BadRequestError);
    });

    test('Bad Object Type', async () => {
      await expect((async () => {
        await getObject(hackerUser, 'Foo', {});
      })()).rejects.toThrow(BadRequestError);
    });

  });

  describe('Clean Object Fail', () => {
    test('No fields', async () => {
      await expect((async () => {
        cleanObject(undefined, {}, null);
      })()).rejects.toThrow(BadRequestError);
    });

    test('No object', async () => {
      await expect((async () => cleanObject({}, undefined, null))()).rejects.toThrow(BadRequestError);
    });
  });

  test('Basic Query', async () => {

    const object1 = await readCheckModelTest.create(testObject);
    const object2 = await readCheckModelTest.create({
      ...testObject,
      publicNest: {
        field2: 'Not bar',
      },
      intercepted: 'Triangle',
    });
    await readCheckModelTest.create({
      ...testObject,
      field1: 'Banana',
      intercepted: 'this is not a triangle',
    });

    expect((await readCheckModelTest.find({})).length).toEqual(3);

    const data = await getObject(
      adminUser,
      'ReadCheckModel',
      {
        filter: {
          field1: 'Test',
        },
      },
    );

    // Expect to get object 1 and 2 filtered
    expect(data).toEqual([
      {
        publicNest: {},
        intercepted: 'Watermelon',
      },
      {
        publicNest: {},
        intercepted: 'Triangle',
      },
    ]);

  });

  describe('Read Check', () => {

    describe('Restricted field', () => {
      test('Success', async () => {

        await readCheckModelTest.create(testObject);

        const data = await getObject(
          {
            ...adminUser,
            firstName: 'Foo',
          } as IUser,
          'ReadCheckModel',
          {},
        );

        // Expect to get the field
        expect(data.length).toEqual(1);
        expect(data[0].publicNest.field2).toEqual('Bar');
      });

      test('Fail (field hidden)', async () => {

        await readCheckModelTest.create(testObject);

        const data = await getObject(
          {
            ...adminUser,
            firstName: 'Not Foo',
          } as IUser,
          'ReadCheckModel',
          {},
        );

        // Expect to have field hidden
        expect(data.length).toEqual(1);
        expect(data[0].publicNest.field2).toEqual(undefined);


      });
    });

    describe('Restricted group', () => {

      test('Success', async () => {
        await readCheckModelTest.create(testObject);

        const data = await getObject(
          {
            ...adminUser,
            firstName: 'Bar',
          } as IUser,
          'ReadCheckModel',
          {},
        );

        // Expect to get the field
        expect(data.length).toEqual(1);
        expect(data[0].privateNest).toEqual({
          field3: 'Baz',
          evenMoreNests: {
            field4: 'Banana',
          },
        });
      });

      test('Fail (group hidden)', async () => {
        await readCheckModelTest.create(testObject);

        const data = await getObject(
          {
            ...adminUser,
            firstName: 'Not the right person lol',
          } as IUser,
          'ReadCheckModel',
          {},
        );

        // Expect to have nest be empty
        expect(data.length).toEqual(1);
        expect(data[0].privateNest).toEqual(undefined);
      });
    });

  });

  describe('Interceptor', () => {

    test('Intercept', async () => {
      await readCheckModelTest.create(testObject);

      const data = await getObject(
        {
          ...adminUser,
          firstName: 'Banana',
        } as IUser,
        'ReadCheckModel',
        {},
      );

      // Expect to get the field
      expect(data.length).toEqual(1);
      expect(data[0].intercepted).toEqual('Intercepted!');
    });

    test('No intercept', async () => {
      await readCheckModelTest.create(testObject);

      const data = await getObject(
        {
          ...adminUser,
          firstName: 'Not Banana',
        } as IUser,
        'ReadCheckModel',
        {},
      );

      // Expect to get the field
      expect(data.length).toEqual(1);
      expect(data[0].intercepted).toEqual('Watermelon');
    });
  });
});

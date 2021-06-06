import { getObject } from '../../../controller/ModelController';
import { IUser } from '../../../models/user/fields';
import { ErrorMessage, ReadCheckRequest, ReadInterceptRequest } from '../../../types/types';
import { adminUser, generateTestModel } from '../test-utils';
import * as dbHandler from './db-handler';

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

describe('Model Read', () => {

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
            readCheck: (request: ReadCheckRequest) => request.requestUser.firstName === 'Foo',
          },
        },
      },

      privateNest: {
        readCheck: (request: ReadCheckRequest) => request.requestUser.firstName === 'Bar',

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

  const testObject = {
    field1: 'Test',
    publicNest: {
      field2: 'Bar',
    },
    privateNest: {
      field3: 'Baz',
      evenMoreNests: {
        field4: 'Banana',
      }
    },
    intercepted: 'Watermelon',
  };

  const readCheckModel = generateTestModel(fields, 'ReadCheckModel');
  const model = readCheckModel['ReadCheckModel'].mongoose;

  /**
   * TODO: Test the other parameters like size, page, etc.
   *       I don't really care about that right now :D
   */

  test('Basic Query', (done: any) => {

    (async () => {

      const object1 = await model.create(testObject);
      const object2 = await model.create({
        ...testObject,
        publicNest: {
          field2: 'Not bar',
        },
        intercepted: 'Triangle',
      });
      await model.create({
        ...testObject,
        field1: 'Banana',
        intercepted: 'this is not a triangle'
      });

      expect((await model.find({})).length).toEqual(3);

      getObject(adminUser, 'ReadCheckModel', {
        filter: {
          field1: 'Test',
        },
      }, (error: ErrorMessage, data?: any) => {

        // Expect no errors
        expect(error).toBeFalsy();

        // Expect to get object 1 and 2 filtered
        expect(data).toEqual([
          {
            publicNest: {},
            privateNest: {},
            intercepted: 'Watermelon',
          },
          {
            publicNest: {},
            privateNest: {},
            intercepted: 'Triangle',
          },
        ]);

        done();

      }, readCheckModel);

    })();

  });

  describe('Read Check', () => {

    describe('Restricted field', () => {
      test('Success', (done: any) => {
        (async () => {
          await model.create(testObject);

          getObject({
            ...adminUser,
            firstName: 'Foo',
          } as IUser, 'ReadCheckModel', {}, (error: ErrorMessage, data?: any) => {

            // Expect no errors
            expect(error).toBeFalsy();

            // Expect to get the field
            expect(data.length).toEqual(1);
            expect(data[0].publicNest.field2).toEqual('Bar');

            done();

          }, readCheckModel);
        })();
      });

      test('Fail (field hidden)', (done: any) => {
        (async () => {
          await model.create(testObject);

          getObject({
            ...adminUser,
            firstName: 'Not Foo',
          } as IUser, 'ReadCheckModel', {}, (error: ErrorMessage, data?: any) => {

            // Expect no errors
            expect(error).toBeFalsy();

            // Expect to have field hidden
            expect(data.length).toEqual(1);
            expect(data[0].publicNest.field2).toEqual(undefined);

            done();

          }, readCheckModel);
        })();
      });
    });

    describe('Restricted group', () => {

      test('Success', (done: any) => {
        (async () => {
          await model.create(testObject);

          getObject({
            ...adminUser,
            firstName: 'Bar',
          } as IUser, 'ReadCheckModel', {}, (error: ErrorMessage, data?: any) => {

            // Expect no errors
            expect(error).toBeFalsy();

            // Expect to get the field
            expect(data.length).toEqual(1);
            expect(data[0].privateNest).toEqual({
              field3: 'Baz',
              evenMoreNests: {
                field4: 'Banana',
              },
            });

            done();

          }, readCheckModel);
        })();
      });

      test('Fail (group hidden)', (done: any) => {
        (async () => {
          await model.create(testObject);

          getObject({
            ...adminUser,
            firstName: 'Not the right person lol',
          } as IUser, 'ReadCheckModel', {}, (error: ErrorMessage, data?: any) => {

            // Expect no errors
            expect(error).toBeFalsy();

            // Expect to have nest be empty
            expect(data.length).toEqual(1);
            expect(data[0].privateNest).toEqual({});

            done();

          }, readCheckModel);
        })();
      });
    });

  });

  describe('Interceptor', () => {

    test('Intercept', (done: any) => {
      (async () => {
        await model.create(testObject);

        getObject({
          ...adminUser,
          firstName: 'Banana',
        } as IUser, 'ReadCheckModel', {}, (error: ErrorMessage, data?: any) => {

          // Expect no errors
          expect(error).toBeFalsy();

          // Expect to get the field
          expect(data.length).toEqual(1);
          expect(data[0].intercepted).toEqual('Intercepted!');

          done();

        }, readCheckModel);
      })();
    });

    test('No intercept', (done: any) => {
      (async () => {
        await model.create(testObject);

        getObject({
          ...adminUser,
          firstName: 'Not Banana',
        } as IUser, 'ReadCheckModel', {}, (error: ErrorMessage, data?: any) => {

          // Expect no errors
          expect(error).toBeFalsy();

          // Expect to get the field
          expect(data.length).toEqual(1);
          expect(data[0].intercepted).toEqual('Watermelon');

          done();

        }, readCheckModel);
      })();
    });
  });
});

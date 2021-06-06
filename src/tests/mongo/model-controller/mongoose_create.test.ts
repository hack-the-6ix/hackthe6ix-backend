import { createObject } from '../../../controller/ModelController';
import { WriteCheckRequest } from '../../../types/types';
import { generateTestModel, hackerUser } from '../test-utils';

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

describe('Model Create', () => {

  test('Does it make an object?', (done: any) => {

    const createTestModel = generateTestModel({
      createCheck: true,
      writeCheck: true,

      FIELDS: {
        field1: {
          type: String,
          writeCheck: true
        },
      },
    }, 'CreateTest');

    createObject(
      hackerUser,
      'CreateTest',
      {
        field1: "Banana"
      },
      async (error: { status: number, message: string, stacktrace?: string }, data?: any) => {

        try {
          // Ensure no errors
          expect(error).toBeFalsy();

          // Ensure object is actually created
          const resultObject = await createTestModel['CreateTest'].mongoose.findOne({
            _id: data
          });
          expect(resultObject.field1).toEqual("Banana");

          done();
        } catch (e) {
          done(e);
        }

      }, createTestModel);

  });

  describe('Create check', () => {
    test('Success', (done: any) => {
      const successCreateTestModel = generateTestModel({
        createCheck: true,
        writeCheck: true,

        FIELDS: {},
      }, 'SuccessCreateTest');
      const model = successCreateTestModel['SuccessCreateTest'].mongoose;

      createObject(
        hackerUser,
        'SuccessCreateTest',
        {},
        async (error: { status: number, message: string, stacktrace?: string }, data?: any) => {

          try {
            // Ensure no errors
            expect(error).toBeFalsy();

            // Ensure object created
            const resultObject = await model.find({});
            expect(resultObject.length).toEqual(1);

            done();
          } catch (e) {
            done(e);
          }

        }, successCreateTestModel);
    });

    test('Fail', (done: any) => {
      const failCreateTestModel =
        generateTestModel({
          createCheck: false,
          writeCheck: true,

          FIELDS: {},
        }, 'FailCreateTest');

      const model = failCreateTestModel['FailCreateTest'].mongoose;

      createObject(
        hackerUser,
        'FailCreateTest',
        {},
        async (error: { status: number, message: string, stacktrace?: string }, data?: any) => {

          try {
            // Ensure error is sent
            expect(error.message).toEqual('Create check violation!');

            // Ensure no object created
            const resultObject = await model.find({});
            expect(resultObject.length).toEqual(0);

            // Ensure no ID returned
            expect(data).toBeFalsy();

            done();
          } catch (e) {
            done(e);
          }

        }, failCreateTestModel);
    });
  });

  describe('Write check', () => {

    test('Success', (done: any) => {
      const successCreateWriteTest = generateTestModel({
        createCheck: true,
        writeCheck: true,

        FIELDS: {
          test: {
            writeCheck: true,

            FIELDS: {
              field1: {
                type: String,
                writeCheck: (request: WriteCheckRequest<string>) => request.fieldValue === 'foobar',
              },
            }
          }
        },
      }, 'SuccessCreateWriteTest');
      const model = successCreateWriteTest['SuccessCreateWriteTest'].mongoose;

      createObject(
        hackerUser,
        'SuccessCreateWriteTest',
        {
          test: {
            field1: 'foobar',
          }
        },
        async (error: { status: number, message: string, stacktrace?: string }, data?: any) => {

          try {
            // Ensure no errors
            expect(error).toBeFalsy();

            // Ensure object created
            const resultObject = await model.find({});
            expect(resultObject.length).toEqual(1);

            done();
          } catch (e) {
            done(e);
          }

        }, successCreateWriteTest);
    });

    test('Fail', (done: any) => {
      const failCreateWriteTest = generateTestModel({
        createCheck: true,
        writeCheck: true,

        FIELDS: {
          test: {
            writeCheck: true,

            FIELDS: {
              field1: {
                type: String,
                writeCheck: (request: WriteCheckRequest<string>) => request.fieldValue === 'foobar',
              },
            }
          }
        },
      }, 'FailCreateWriteTest');
      const model = failCreateWriteTest['FailCreateWriteTest'].mongoose;

      createObject(
        hackerUser,
        'FailCreateWriteTest',
        {
          test: {
            field1: 'barbar',
          }
        },
        async (error: { status: number, message: string, stacktrace?: string }, data?: any) => {

          try {
            // Ensure error detected
            expect(error.message).toEqual('Write check violation!');

            // Ensure no object created
            const resultObject = await model.find({});
            expect(resultObject.length).toEqual(0);

            done();
          } catch (e) {
            done(e);
          }

        }, failCreateWriteTest);
    });
  });

});

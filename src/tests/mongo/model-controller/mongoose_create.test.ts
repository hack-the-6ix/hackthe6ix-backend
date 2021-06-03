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
      async (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

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
      createObject(
        hackerUser,
        'SuccessCreateTest',
        {},
        (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

          try {
            expect(error).toBeFalsy();
            done();
          } catch (e) {
            done(e);
          }

        },
        generateTestModel({
          createCheck: true,
          writeCheck: true,

          FIELDS: {},
        }, 'SuccessCreateTest'));
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
        async (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

          try {
            // Ensure error is sent
            expect(error.message).toEqual('Create check violation!');

            // Ensure no object created
            const resultObject = await model.find({});
            expect(resultObject.length).toEqual(0);

            done();
          } catch (e) {
            done(e);
          }

        }, failCreateTestModel);
    });
  });

  describe('Write check', () => {

    test('Success', (done: any) => {
      createObject(
        hackerUser,
        'SuccessWriteTest',
        {
          field1: 'foobar',
        },
        (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

          try {
            expect(error).toBeFalsy();
            done();
          } catch (e) {
            done(e);
          }

        },
        generateTestModel({
          createCheck: true,
          writeCheck: true,

          FIELDS: {
            field1: {
              type: String,
              writeCheck: (request: WriteCheckRequest<string>) => request.fieldValue === 'foobar',
            },
          },
        }, 'SuccessWriteTest'));
    });

    test('Fail', (done: any) => {
      createObject(
        hackerUser,
        'FailWriteTest',
        {
          field1: 'barbar',
        },
        (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

          try {
            expect(error.message).toEqual('Write check violation!');
            done();
          } catch (e) {
            done(e);
          }

        },
        generateTestModel({
          createCheck: true,
          writeCheck: true,

          FIELDS: {
            field1: {
              type: String,
              writeCheck: (request: WriteCheckRequest<string>) => request.fieldValue === 'foobar',
            },
          },
        }, 'FailWriteTest'));
    });
  });

});

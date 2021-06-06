import { createObject } from '../../../controller/ModelController';
import { CreateDeniedError, WriteCheckRequest, WriteDeniedError } from '../../../types/types';

import * as dbHandler from '../db-handler';
import { generateTestModel, hackerUser } from '../test-utils';

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

  test('Does it make an object?', async () => {

    const createTestModel = generateTestModel({
      createCheck: true,
      writeCheck: true,

      FIELDS: {
        field1: {
          type: String,
          writeCheck: true,
        },
      },
    }, 'CreateTest');

    const data = await createObject(
      hackerUser,
      'CreateTest',
      {
        field1: 'Banana',
      },
    );

    // Ensure object is actually created
    const resultObject = await createTestModel.findOne({
      _id: data,
    });

    expect(resultObject.field1).toEqual('Banana');

  });

  describe('Create check', () => {
    test('Success', async () => {
      const successCreateTestModel = generateTestModel({
        createCheck: true,
        writeCheck: true,

        FIELDS: {},
      }, 'SuccessCreateTest');

      await createObject(
        hackerUser,
        'SuccessCreateTest',
        {},
      );

      // Ensure object created
      const resultObject = await successCreateTestModel.find({});
      expect(resultObject.length).toEqual(1);

    });

    test('Fail', async () => {
      const failCreateTestModel =
        generateTestModel({
          createCheck: false,
          writeCheck: true,

          FIELDS: {},
        }, 'FailCreateTest');

      // Ensure error is sent
      expect(createObject(
        hackerUser,
        'FailCreateTest',
        {},
      )).rejects.toThrow(CreateDeniedError);

      // Ensure no object created
      const resultObject = await failCreateTestModel.find({});
      expect(resultObject.length).toEqual(0);
    });
  });

  describe('Write check', () => {

    test('Success', async () => {
      const successCreateWriteTest = generateTestModel({
        createCheck: true,
        writeCheck: true,

        FIELDS: {
          test: {
            writeCheck: true,

            FIELDS: {
              field1: {
                type: String,
                writeCheck: (request: WriteCheckRequest<string, any>) => request.fieldValue === 'foobar',
              },
            },
          },
        },
      }, 'SuccessCreateWriteTest');

      await createObject(
        hackerUser,
        'SuccessCreateWriteTest',
        {
          test: {
            field1: 'foobar',
          },
        },
      );

      // Ensure object created
      const resultObject = await successCreateWriteTest.find({});
      expect(resultObject.length).toEqual(1);

    });

    test('Fail', async () => {
      const failCreateWriteTest = generateTestModel({
        createCheck: true,
        writeCheck: true,

        FIELDS: {
          test: {
            writeCheck: true,

            FIELDS: {
              field1: {
                type: String,
                writeCheck: (request: WriteCheckRequest<string, any>) => request.fieldValue === 'foobar',
              },
            },
          },
        },
      }, 'FailCreateWriteTest');

      expect(createObject(
        hackerUser,
        'FailCreateWriteTest',
        {
          test: {
            field1: 'barbar',
          },
        },
      )).rejects.toThrow(WriteDeniedError);

      // Ensure no object created
      const resultObject = await failCreateWriteTest.find({});
      expect(resultObject.length).toEqual(0);
    });
  });
});

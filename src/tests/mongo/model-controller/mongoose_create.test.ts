import { createObject } from '../../../controller/ModelController';
import { CreateDeniedError, WriteCheckRequest, WriteDeniedError } from '../../../types/types';
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
      }, createTestModel,
    );

    // Ensure object is actually created
    const resultObject = await createTestModel['CreateTest'].mongoose.findOne({
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
      const model = successCreateTestModel['SuccessCreateTest'].mongoose;

      await createObject(
        hackerUser,
        'SuccessCreateTest',
        {},
        successCreateTestModel,
      );

      // Ensure object created
      const resultObject = await model.find({});
      expect(resultObject.length).toEqual(1);

    });

    test('Fail', async () => {
      const failCreateTestModel =
        generateTestModel({
          createCheck: false,
          writeCheck: true,

          FIELDS: {},
        }, 'FailCreateTest');

      const model = failCreateTestModel['FailCreateTest'].mongoose;

      // Ensure error is sent
      expect(createObject(
        hackerUser,
        'FailCreateTest',
        {},
        failCreateTestModel,
      )).rejects.toThrow(CreateDeniedError);

      // Ensure no object created
      const resultObject = await model.find({});
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
      const model = successCreateWriteTest['SuccessCreateWriteTest'].mongoose;

      await createObject(
        hackerUser,
        'SuccessCreateWriteTest',
        {
          test: {
            field1: 'foobar',
          },
        },
        successCreateWriteTest,
      );

      // Ensure object created
      const resultObject = await model.find({});
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
      const model = failCreateWriteTest['FailCreateWriteTest'].mongoose;

      expect(createObject(
        hackerUser,
        'FailCreateWriteTest',
        {
          test: {
            field1: 'barbar',
          },
        },
        failCreateWriteTest,
      )).rejects.toThrow(WriteDeniedError);

      // Ensure no object created
      const resultObject = await model.find({});
      expect(resultObject.length).toEqual(0);


    });
  });

});

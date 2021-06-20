import { createObject } from '../../../controller/ModelController';
import { getModels } from '../../../controller/util/resources';
import { CreateDeniedError, WriteCheckRequest, WriteDeniedError } from '../../../types/types';
import {
  generateTestModel,
  hackerUser,
  runAfterAll,
  runAfterEach,
  runBeforeAll,
} from '../../test-utils';

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(runBeforeAll);

/**
 * Clear all test data after every test.
 */
afterEach(runAfterEach);

/**
 * Remove and close the db and server.
 */
afterAll(runAfterAll);

jest.mock('../../../controller/util/resources', () => (
  {
    fetchUniverseState: jest.fn(),
    getModels: jest.fn(),
  }
));

describe('Model Create', () => {

  test('Does it make an object?', async () => {

    const [createTestModel, mockModels] = generateTestModel({
      createCheck: true,
      writeCheck: true,

      FIELDS: {
        field1: {
          type: String,
          writeCheck: true,
        },
      },
    }, 'CreateTest');

    getModels.mockReturnValue(mockModels);

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
      const [successCreateTestModel, mockModels] = generateTestModel({
        createCheck: true,
        writeCheck: true,

        FIELDS: {},
      }, 'SuccessCreateTest');

      getModels.mockReturnValue(mockModels);

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
      const [failCreateTestModel, mockModels] =
        generateTestModel({
          createCheck: false,
          writeCheck: true,

          FIELDS: {},
        }, 'FailCreateTest');

      getModels.mockReturnValue(mockModels);

      // Ensure error is sent
      await expect(createObject(
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
      const [successCreateWriteTest, mockModels] = generateTestModel({
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

      getModels.mockReturnValue(mockModels);

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
      const [failCreateWriteTest, mockModels] = generateTestModel({
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

      getModels.mockReturnValue(mockModels);

      await expect(createObject(
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

import { editObject } from '../../../controller/ModelController';
import { getModels } from '../../../controller/util';
import { WriteCheckRequest, WriteDeniedError } from '../../../types/types';
import { generateTestModel, hackerUser } from '../test-utils';
import * as dbHandler from '../db-handler';

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

describe('Model Write', () => {

  describe('Recursion', () => {
    /**
     * TODO: Figure out why tests don't work for write operations
     */

    const [recursionCreateWriteTestModel, mockModels] = generateTestModel({
      createCheck: true,
      writeCheck: true,

      FIELDS: {
        test: {
          writeCheck: true,

          FIELDS: {
            huh: {
              writeCheck: true,

              FIELDS: {
                field1: {
                  type: String,
                  writeCheck: (request: WriteCheckRequest<string, any>) => request.fieldValue === 'foobar',
                },
              },
            },
          },
        },
      },
    }, 'RecursionWriteTest');

    getModels.mockReturnValue(mockModels);

    test('Success', async () => {

      await recursionCreateWriteTestModel.create({});
      const originalObject = await recursionCreateWriteTestModel.create({
        test: {
          huh: {
            field1: 'Banana',
          },
        },
      });

      expect((await recursionCreateWriteTestModel.find({})).length).toEqual(2);

      const data = await editObject(
        hackerUser,
        'RecursionWriteTest',
        {
          test: {
            huh: {
              field1: 'Banana',
            },
          },
        },
        {
          test: {
            huh: {
              field1: 'foobar',
            },
          },
        },);

      // Ensure only amended object is modified
      expect(data.length).toEqual(1);
      expect(data).toContainEqual(originalObject._id);

      const resultObject = await recursionCreateWriteTestModel.find({ _id: data[0] });
      expect(resultObject.length).toEqual(1);

      const resultJSON = resultObject[0].toJSON();
      delete resultJSON['_id'];
      delete resultJSON['id'];
      delete resultJSON['__v'];

      expect(resultJSON).toEqual({
        test: {
          huh: {
            field1: 'foobar',
          },
        },
      });


    });

    test('Fail', async () => {

      await recursionCreateWriteTestModel.create({});
      const originalObject = await recursionCreateWriteTestModel.create({
        test: {
          huh: {
            field1: 'Banana',
          },
        },
      });

      expect((await recursionCreateWriteTestModel.find({})).length).toEqual(2);

      expect(editObject(
        hackerUser,
        'RecursionWriteTest',
        {
          test: {
            huh: {
              field1: 'Banana',
            },
          },
        },
        {
          test: {
            huh: {
              field1: 'ASdasdasd',
            },
          },
        }
      )).rejects.toThrow(WriteDeniedError);

      // Ensure no amendments were made
      const resultObject = await recursionCreateWriteTestModel.find({ _id: originalObject._id });
      expect(resultObject.length).toEqual(1);

      const resultJSON = resultObject[0].toJSON();
      delete resultJSON['_id'];
      delete resultJSON['id'];
      delete resultJSON['__v'];

      expect(resultJSON).toEqual({
        test: {
          huh: {
            field1: 'Banana',
          },
        },
      });
    });
  });

  describe('Write check', () => {

    const [writeTestModel, mockModels] = generateTestModel({
      createCheck: true,
      writeCheck: true,

      FIELDS: {
        field1: {
          type: String,
          writeCheck: (request: WriteCheckRequest<string, any>) => request.fieldValue === 'foobar',
        },
        field2: {
          type: String,
          writeCheck: true,
        },
      },
    }, 'WriteTest');

    getModels.mockReturnValue(mockModels);

    test('Success', async () => {

      await writeTestModel.create({});
      const originalObject = await writeTestModel.create({
        field1: 'Banana',
        field2: 'Apple',
      });

      expect((await writeTestModel.find({})).length).toEqual(2);

      const data = await editObject(
        hackerUser,
        'WriteTest',
        {
          field1: 'Banana',
        },
        {
          field2: 'Orange',
        }
      );

      // Ensure only amended object is modified
      expect(data.length).toEqual(1);
      expect(data).toContainEqual(originalObject._id);

      const resultObject = await writeTestModel.find({ _id: data[0] });
      expect(resultObject.length).toEqual(1);

      const resultJSON = resultObject[0].toJSON();
      delete resultJSON['_id'];
      delete resultJSON['id'];
      delete resultJSON['__v'];

      expect(resultJSON).toEqual({
        field1: 'Banana',
        field2: 'Orange',
      });
    });

    test('Fail', async () => {

      await writeTestModel.create({});
      const originalObject = await writeTestModel.create({
        field1: 'Banana',
        field2: 'Apple',
      });

      expect((await writeTestModel.find({})).length).toEqual(2);

      expect(editObject(
        hackerUser,
        'WriteTest',
        {
          field1: 'Banana',
        },
        {
          field1: 'Orange',
        }
      )).rejects.toThrow(WriteDeniedError);

      // Ensure no changes made
      const resultObject = await writeTestModel.find({ _id: originalObject._id });
      expect(resultObject.length).toEqual(1);

      const resultJSON = resultObject[0].toJSON();
      delete resultJSON['_id'];
      delete resultJSON['id'];
      delete resultJSON['__v'];

      expect(resultJSON).toEqual({
        field1: 'Banana',
        field2: 'Apple',
      });
    });
  });
});

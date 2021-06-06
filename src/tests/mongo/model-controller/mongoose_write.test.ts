import { editObject } from '../../../controller/ModelController';
import { WriteCheckRequest, WriteDeniedError } from '../../../types/types';
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

describe('Model Write', () => {

  describe('Recursion', () => {
    const recursionCreateWriteTest = generateTestModel({
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
    const model = recursionCreateWriteTest['RecursionWriteTest'].mongoose;

    test('Success', async () => {

      await model.create({});
      const originalObject = await model.create({
        test: {
          huh: {
            field1: 'Banana',
          },
        },
      });

      expect((await model.find({})).length).toEqual(2);

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
        }, recursionCreateWriteTest);

      // Ensure only amended object is modified
      expect(data.length).toEqual(1);
      expect(data).toContainEqual(originalObject._id);

      const resultObject = await model.find({ _id: data[0] });
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

      await model.create({});
      const originalObject = await model.create({
        test: {
          huh: {
            field1: 'Banana',
          },
        },
      });

      expect((await model.find({})).length).toEqual(2);

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
        }, recursionCreateWriteTest,
      )).rejects.toThrow(WriteDeniedError);

      // Ensure no amendments were made
      const resultObject = await model.find({ _id: originalObject._id });
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

    const writeTestModel = generateTestModel({
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
    const model = writeTestModel['WriteTest'].mongoose;


    test('Success', async () => {

      await model.create({});
      const originalObject = await model.create({
        field1: 'Banana',
        field2: 'Apple',
      });

      expect((await model.find({})).length).toEqual(2);

      const data = await editObject(
        hackerUser,
        'WriteTest',
        {
          field1: 'Banana',
        },
        {
          field2: 'Orange',
        }, writeTestModel,
      );

      // Ensure only amended object is modified
      expect(data.length).toEqual(1);
      expect(data).toContainEqual(originalObject._id);

      const resultObject = await model.find({ _id: data[0] });
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

      await model.create({});
      const originalObject = await model.create({
        field1: 'Banana',
        field2: 'Apple',
      });

      expect((await model.find({})).length).toEqual(2);

      expect(editObject(
        hackerUser,
        'WriteTest',
        {
          field1: 'Banana',
        },
        {
          field1: 'Orange',
        }, writeTestModel
      )).rejects.toThrow(WriteDeniedError);

      // Ensure no changes made
      const resultObject = await model.find({ _id: originalObject._id });
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

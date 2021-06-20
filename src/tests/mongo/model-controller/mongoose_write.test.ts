import mongoose from 'mongoose';
import { editObject, flattenFields } from '../../../controller/ModelController';
import { getModels } from '../../../controller/util/resources';
import { extractFields } from '../../../models/util';
import { WriteCheckRequest, WriteDeniedError } from '../../../types/types';
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


const [recursionCreateWriteTestModel, mockRecrusionCreateWriteTestModels] = generateTestModel({
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
            field2: {
              type: String,
              writeCheck: (request: WriteCheckRequest<string, any>) => request.fieldValue === 'foobar',
            },
          },
        },
      },
    },
    banana: {
      type: String,
    },
  },
}, 'RecursionWriteTest');

// NOTE: This one is a bit special since we have a virtual field

const writeTestFields = {
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
    virtual: {
      type: String,
      virtual: true,
      writeCheck: true,
    },
  },
};

const testSchema = new mongoose.Schema(extractFields(writeTestFields), {
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
  },
});

testSchema.virtual('virtual').get(() => 'virtualboi!');

const writeTestModel = mongoose.model('WriteTest', testSchema);

const mockModels = {
  ...mockRecrusionCreateWriteTestModels,
  'WriteTest': {
    mongoose: writeTestModel,
    rawFields: writeTestFields,
  },
};

getModels.mockReturnValue(mockModels);

describe('Model Write', () => {
  describe('Recursion', () => {
    describe('Success', () => {

      test('Flatten changes', async () => {

        await recursionCreateWriteTestModel.create({});
        const originalObject = await recursionCreateWriteTestModel.create({
          test: {
            huh: {
              field1: 'Banana',
              field2: 'Llama',
            },
          },
          banana: 'test',
        });

        expect((await recursionCreateWriteTestModel.find({})).length).toEqual(2);

        const data = await editObject(
          hackerUser,
          'RecursionWriteTest',
          {
            'test.huh.field1': 'Banana',
          },
          {
            test: {
              huh: {
                field1: 'foobar',
              },
            },
          });

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
              field2: 'Llama',
            },
          },
          banana: 'test',
        });
      });

      test('Do not flatten changes', async () => {

        await recursionCreateWriteTestModel.create({});
        const originalObject = await recursionCreateWriteTestModel.create({
          test: {
            huh: {
              field1: 'Banana',
              field2: 'Llama',
            },
          },
          banana: 'test',
        });

        expect((await recursionCreateWriteTestModel.find({})).length).toEqual(2);

        const data = await editObject(
          hackerUser,
          'RecursionWriteTest',
          {
            'test.huh.field1': 'Banana',
          },
          {
            test: {
              huh: {
                field1: 'foobar',
              },
            },
          }, true);

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
          banana: 'test',
        });
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
        banana: 'test',
      });

      expect((await recursionCreateWriteTestModel.find({})).length).toEqual(2);

      await expect(editObject(
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
        },
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
        banana: 'test',
      });
    });
  });

  describe('Write check', () => {

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
        },
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
        virtual: 'virtualboi!',
      });
    });

    test('Fail', async () => {

      await writeTestModel.create({});
      const originalObject = await writeTestModel.create({
        field1: 'Banana',
        field2: 'Apple',
      });

      expect((await writeTestModel.find({})).length).toEqual(2);

      await expect(editObject(
        hackerUser,
        'WriteTest',
        {
          field1: 'Banana',
        },
        {
          field1: 'Orange',
        },
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
        virtual: 'virtualboi!',
      });
    });

    test('Virtual', async () => {

      await writeTestModel.create({});
      const originalObject = await writeTestModel.create({
        field1: 'Banana',
        field2: 'Apple',
      });

      expect((await writeTestModel.find({})).length).toEqual(2);

      await expect(editObject(
        hackerUser,
        'WriteTest',
        {
          field1: 'Banana',
        },
        {
          virtual: 'lol this shouldn\'t change',
        },
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
        virtual: 'virtualboi!',
      });
    });
  });
});

test('Flatten fields', () => {
  const result = flattenFields({
    foo: 123,
    bar: {
      beep: {
        bang: 456,
      },
      barf: 3563,
    },
    eek: [
      233,
    ],
  });

  expect(result).toEqual({
    foo: 123,
    'bar.beep.bang': 456,
    'bar.barf': 3563,
    'eek': [233],
  });
});

import { deleteObject } from '../../../controller/ModelController';
import { DeleteDeniedError } from '../../../types/types';
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

describe('Model Delete', () => {

  test('Does it actually delete?', async () => {
    const successDeleteTest = generateTestModel({
      deleteCheck: true,
      FIELDS: {
        field1: {
          type: String
        }
      },
    }, 'DeleteTest');
    const model = successDeleteTest['DeleteTest'].mongoose;

    // Create some objects to fill the DB
    await model.create({ field1: "Banana" });
    const fail1 = await model.create({});
    const fail2 = await model.create({});
    const resultObject1 = await model.find({});
    expect(resultObject1.length).toEqual(3);

    const data = await deleteObject(
      hackerUser,
      'DeleteTest',
      {
        field1: {
          $ne: "Banana" // We should only be deleting non-bananas
        }
      }, successDeleteTest);

    // Non-bananas deleted
    const resultObject2 = await model.find({});
    expect(resultObject2.length).toEqual(1);

    // Verify deleted IDs are returned
    expect(data).toContainEqual(fail1._id);
    expect(data).toContainEqual(fail2._id);
    expect(data.length).toEqual(2);
  });

  describe('Delete Check', () => {
    test('Success', async () => {
      const successDeleteTest = generateTestModel({
        deleteCheck: true,
        FIELDS: {},
      }, 'SuccessDeleteTest');
      const model = successDeleteTest['SuccessDeleteTest'].mongoose;

      // Create some objects to fill the DB
      const originalObject = await model.create({});
      const resultObject1 = await model.find({});
      expect(resultObject1.length).toEqual(1);

      const data = await deleteObject(
        hackerUser,
        'SuccessDeleteTest',
        {},
        successDeleteTest
      );

      // Object deleted
      const resultObject2 = await model.find({});
      expect(resultObject2.length).toEqual(0);

      // Verify deleted IDs are returned
      expect(data).toContainEqual(originalObject._id);
      expect(data.length).toEqual(1);
    });

    test('Fail', async () => {
      const successDeleteTest = generateTestModel({
        deleteCheck: false,
        FIELDS: {},
      }, 'FailDeleteTest');
      const model = successDeleteTest['FailDeleteTest'].mongoose;

      // Create some objects to fill the DB
      await model.create({});
      const resultObject1 = await model.find({});
      expect(resultObject1.length).toEqual(1);

      expect(deleteObject(
        hackerUser,
        'FailDeleteTest',
        {},
        successDeleteTest
      )).rejects.toThrow(DeleteDeniedError);

      // Database is still intact
      const resultObject2 = await model.find({});
      expect(resultObject2.length).toEqual(1);
    });
  });
});


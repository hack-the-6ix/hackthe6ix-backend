import { deleteObject } from '../../../controller/ModelController';
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

describe('Model Delete', () => {

  test('Does it actually delete?', (done: any) => {
    const successDeleteTest = generateTestModel({
      deleteCheck: true,
      FIELDS: {
        field1: {
          type: String
        }
      },
    }, 'DeleteTest');
    const model = successDeleteTest['DeleteTest'].mongoose;

    (async () => {

      // Create some objects to fill the DB
      await model.create({ field1: "Banana" });
      await model.create({});
      await model.create({});
      const resultObject = await model.find({});
      expect(resultObject.length).toEqual(3);

      deleteObject(
        hackerUser,
        'DeleteTest',
        {
          field1: {
            $ne: "Banana" // We should only be deleting non-bananas
          }
        },
        async (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

          try {
            // No errors
            expect(error).toBeFalsy();

            // Non-bananas deleted
            const resultObject = await model.find({});
            expect(resultObject.length).toEqual(1);

            done();
          } catch (e) {
            done(e);
          }

        }, successDeleteTest);
    })();

  });

  describe('Delete Check', () => {
    test('Success', (done: any) => {
      const successDeleteTest = generateTestModel({
        deleteCheck: true,
        FIELDS: {},
      }, 'SuccessDeleteTest');
      const model = successDeleteTest['SuccessDeleteTest'].mongoose;

      (async () => {

        // Create some objects to fill the DB
        await model.create({});
        const resultObject = await model.find({});
        expect(resultObject.length).toEqual(1);

        deleteObject(
          hackerUser,
          'SuccessDeleteTest',
          {},
          async (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

            try {
              // No error
              expect(error).toBeFalsy();

              // Object deleted
              const resultObject = await model.find({});
              expect(resultObject.length).toEqual(0);

              done();
            } catch (e) {
              done(e);
            }

          }, successDeleteTest);
      })();

    });

    test('Fail', (done: any) => {
      const successDeleteTest = generateTestModel({
        deleteCheck: false,
        FIELDS: {},
      }, 'FailDeleteTest');
      const model = successDeleteTest['FailDeleteTest'].mongoose;

      (async () => {

        // Create some objects to fill the DB
        await model.create({});
        const resultObject = await model.find({});
        expect(resultObject.length).toEqual(1);

        deleteObject(
          hackerUser,
          'FailDeleteTest',
          {},
          async (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

            try {
              // We get an error
              expect(error.message).toEqual('Delete check violation!');

              // Database is still intact
              const resultObject = await model.find({});
              expect(resultObject.length).toEqual(1);

              done();
            } catch (e) {
              done(e);
            }

          }, successDeleteTest);
      })();

    });
  });

});


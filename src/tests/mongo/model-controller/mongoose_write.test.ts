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

describe('Model Write', () => {

  test('Success', (done: any) => {
    const successWriteTestModel = generateTestModel({
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
                    writeCheck: (request: WriteCheckRequest<string>) => request.fieldValue === 'foobar',
                  },
                }
              }
            }
          }
        },
      }, 'SuccessWriteTest');
    const model = successWriteTestModel['SuccessWriteTest'].mongoose;

    (async () => {

      createObject(
        hackerUser,
        'SuccessWriteTest',
        {
          test: {
            huh: {
              field1: 'foobar',
            }
          }
        },
        async (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

          try {
            // Ensure no error
            expect(error).toBeFalsy();

            // Ensure object created
            const resultObject = await model.findOne({});
            expect(resultObject.length).toEqual(1);

            done();
          } catch (e) {
            done(e);
          }

        }, successWriteTestModel);

    })();

  });

  test('Fail', (done: any) => {
    createObject(
      hackerUser,
      'FailWriteTest',
      {
        test: {
          huh: {
            field1: 'barbar',
          }
        }
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
          test: {
            writeCheck: true,

            FIELDS: {
              huh: {
                writeCheck: true,

                FIELDS: {
                  field1: {
                    type: String,
                    writeCheck: (request: WriteCheckRequest<string>) => request.fieldValue === 'foobar',
                  },
                }
              }
            }
          }
        },
      }, 'FailWriteTest'));
  });

});

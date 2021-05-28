import { ObjectID } from 'bson';
import { createObject, deleteObject, editObject, getObject } from '../controller/ModelController';
import { IRequestUser } from '../types/types';
import jest from 'jest';

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


describe("wtf", () => {

  test("Wtf", () => {

    createObject({
        _id: new ObjectID("5f081f878c60690dd9b9fd57"),
        jwt: {
          roles: {
            organizer: true
          }
        }
      } as IRequestUser,
      'user',
      {
        firstName: "Test",
        lastName: "Testerson",
        samlNameID: "wtf",
        email: "test@test.ca",
        roles: {
          hacker: true,
          admin: false
        }
      },
      (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

        console.log(error, data);

      });
  });
});

import {PassThrough, Writable} from 'stream';
import { readGridFSFile, writeGridFSFile } from '../../../controller/GridFSController';
import { BadRequestError, NotFoundError } from '../../../types/errors';

import {
  runAfterAll,
  runAfterEach,
  runBeforeAllAndInject,
  runBeforeEach,
  SystemTestContext
} from '../../test-utils';

const context: SystemTestContext = {} as SystemTestContext;

beforeAll(runBeforeAllAndInject(context))
/**
 * Clear all test data after every test.
 */
afterEach(runAfterEach);

beforeEach(runBeforeEach);

/**
 * Remove and close the db and server.
 */
afterAll(runAfterAll);

/**
 * Skipping GridFS unit tests as we aren't able to read from GridFS using the mock DB for some reason????
 */
describe('GridFS Read', () => {
  test('File exists', (done) => {
    // const mongoose = await dbHandler.connect();

    const mockPayload = 'foobar';
    const mockFilename = 'foobar.txt';

    writeGridFSFile('resumes', mockFilename, context.mongoose, { 'data': mockPayload })
        .then(() => {
          const passThrough = new PassThrough();
          passThrough.on('data', (chunk: any) => {
            expect(chunk.toString()).toEqual(mockPayload);
            done();
          });

          readGridFSFile('resumes', mockFilename, context.mongoose, passThrough).catch((err) => done(err))
        }).catch((err) => done(err));
  })

  test('File doesn\'t exist', async () => {
    // const mongoose = await dbHandler.connect();

    await expect(readGridFSFile('resumes', 'foofoobar', context.mongoose, new Writable())).rejects.toThrow(NotFoundError);
  });

  test('File name not specified', async () => {
    // const mongoose = await dbHandler.connect();

    await expect(readGridFSFile('resumes', '', context.mongoose, new Writable())).rejects.toThrow(BadRequestError);
  });
});

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

const context = {} as SystemTestContext;

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

describe('GridFS Read/Write', () => {
  test('Read file exists', (done) => {
    const mockPayload = 'foobar';
    const mockFilename = 'foobar.txt';

    writeGridFSFile('resumes', mockFilename, context.mongoose, { 'data': mockPayload })
        .then(() => {
          const passThrough = new PassThrough();
          let allData = Buffer.alloc(0);

          passThrough.on('data', (chunk: any) => {
            allData = Buffer.concat([allData, chunk])
          });

          passThrough.on('end', () => {
            expect(allData.toString()).toEqual(mockPayload);
            done();
          });

          readGridFSFile('resumes', mockFilename, context.mongoose, passThrough).catch((err) => done(err))
        }).catch((err) => done(err));
    });

  test('Write file exists', (done) => {
      const mockPayload = 'foobar';
      const mock2ndPayload = 'barfoo';
      const mockFilename = 'foobar.txt';

      writeGridFSFile('resumes', mockFilename, context.mongoose, { 'data': mockPayload })
          .then(() => {
              writeGridFSFile('resumes', mockFilename, context.mongoose, { 'data': mock2ndPayload })
                  .then(() => {
                      const passThrough = new PassThrough();
                      let allData = Buffer.alloc(0);

                      passThrough.on('data', (chunk: any) => {
                          allData = Buffer.concat([allData, chunk])
                      });

                      passThrough.on('end', () => {
                          try {
                              expect(allData.toString()).toEqual(mock2ndPayload);
                              done();
                          }
                          catch(err) {
                              done(err);
                          }
                      })

                      readGridFSFile('resumes', mockFilename, context.mongoose, passThrough).catch((err) => done(err))
                  }).catch((err) => done(err));
          }).catch((err) => done(err));
  })

  test('Read file doesn\'t exist', async () => {
    await expect(readGridFSFile('resumes', 'foofoobar', context.mongoose, new Writable())).rejects.toThrow(NotFoundError);
  });

  test('Read file name not specified', async () => {
    await expect(readGridFSFile('resumes', '', context.mongoose, new Writable())).rejects.toThrow(BadRequestError);
  });

  test('Write file name not specified', async () => {
      await expect(writeGridFSFile('resumes', '', context.mongoose, { data: '' })).rejects.toThrow(BadRequestError);
  })
});

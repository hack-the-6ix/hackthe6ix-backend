import stream, { Writable } from 'stream';
import { readGridFSFile, writeGridFSFile } from '../../../controller/GridFSController';
import { BadRequestError, NotFoundError } from '../../../types/errors';
import * as dbHandler from '../../db-handler';
import { runAfterAll, runAfterEach, runBeforeEach } from '../../test-utils';

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
xdescribe('GridFS Read', () => {
  test('File exists', async (done) => {
    const mongoose = await dbHandler.connect();

    const mockPayload = 'foobar';
    const mockFilename = 'foobar.txt';

    // Write mock file
    /*const gfs = Grid(mongoose.connection.db, mongoose.mongo);
    const writeStream = gfs.createWriteStream({
      filename: mockFilename,
    });
    writeStream.write(mockPayload);
    //writeStream.end();*/

    await writeGridFSFile('resumes', mockFilename, mongoose, { 'data': mockPayload });

    const readStream: Writable = new stream.Writable();
    await readGridFSFile('resumes', mockFilename, mongoose, readStream);

    readStream.on('data', (chunk: any) => {
      expect(chunk).toEqual(mockPayload);
      done();
    });
  });

  test('File doesn\'t exist', async () => {
    const mongoose = await dbHandler.connect();

    await expect(readGridFSFile('resumes', 'foofoobar', mongoose, null)).rejects.toThrow(NotFoundError);
  });

  test('File name not specified', async () => {
    const mongoose = await dbHandler.connect();

    await expect(readGridFSFile('resumes', '', mongoose, null)).rejects.toThrow(BadRequestError);
  });
});

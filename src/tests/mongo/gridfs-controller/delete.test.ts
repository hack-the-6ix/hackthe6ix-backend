import {Writable} from 'stream';
import {deleteGridFSFile, readGridFSFile, writeGridFSFile} from '../../../controller/GridFSController';
import {BadRequestError, NotFoundError} from '../../../types/errors';

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

describe('GridFS Delete', () => {
    test('File exists', async () => {
        const mockPayload = 'foobar';
        const mockFilename = 'foobar.txt';

        await writeGridFSFile('resumes', mockFilename, context.mongoose, { 'data': mockPayload });
        await deleteGridFSFile('resumes', mockFilename, context.mongoose);

        await expect(readGridFSFile('resumes', mockFilename, context.mongoose, new Writable())).rejects.toThrow(NotFoundError);
    })

    test('File doesn\'t exist', async () => {
        await expect(deleteGridFSFile('resumes', 'foofoobar', context.mongoose)).rejects.toThrow(NotFoundError);
    });

    test('File name not specified', async () => {
        await expect(deleteGridFSFile('resumes', '', context.mongoose, new Writable())).rejects.toThrow(BadRequestError);
    });
});

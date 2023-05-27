import {PassThrough, Writable} from 'stream';
import { readGridFSFile, writeGridFSFile, exportAsZip } from '../../../controller/GridFSController';
import { BadRequestError, NotFoundError } from '../../../types/errors';
import * as unzipper from 'unzipper';

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

describe('GridFS export zip', () => {
    test('Export zip', (done) => {

        const payloads = ['foobar', 'barfoo'].map((name) => ({
            gfsfilename: `${name}.txt`,
            filename: `${name}.out`,
            payload: name
        }));

        const expectedFilenames = payloads.map((entry) => entry.filename);
        const encounteredFilenames = [] as string[];

        Promise.all(
            payloads.map(
                payload => writeGridFSFile('resumes', payload.gfsfilename, context.mongoose, { 'data': payload.payload })
            )
        ).then(() => {
            const unzipStream = unzipper.Parse()
                .on('entry', (entry) => {
                    const filename = entry.path;
                    const expectedFileInfo = payloads.find((entry) => entry.filename === filename);

                    if(expectedFileInfo) {
                        const passThrough = new PassThrough();
                        let allData = Buffer.alloc(0);

                        passThrough.on('data', (chunk: any) => {
                            allData = Buffer.concat([allData, chunk]);
                        });

                        passThrough.on('end', () => {
                            try {
                                expect(allData.toString()).toEqual(expectedFileInfo.payload);
                                encounteredFilenames.push(filename);
                            }
                            catch(err) {
                                done(err);
                            }
                        })

                        entry.pipe(passThrough);
                    }
                    else {
                        entry.autodrain().on('error', (err) => done(err));
                    }
                })
                .on('end', () => {
                    try {
                        expect(encounteredFilenames).toEqual(expect.arrayContaining(expectedFilenames));
                        done();
                    }
                    catch(err) {
                        done(err);
                    }
                });

            exportAsZip('resumes', payloads, context.mongoose, unzipStream)
        })
    });
});

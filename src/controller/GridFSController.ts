import {mongo, Mongoose} from 'mongoose';
import { pipeline } from 'node:stream/promises';
import stream, { Writable, PassThrough } from 'stream';
import { BadRequestError, NotFoundError } from '../types/errors';
import archiver from 'archiver';
import {resumeBucket} from "../services/mongoose_service";


// TODO: Fix the resumeBucket and _getFile types to be correct

const _getFile = async (filename: string): Promise<any> => {
  const cursor = resumeBucket.find({ filename: filename }, {
    limit: 1
  });

  const {done, value} = await cursor[Symbol.asyncIterator]().next();

  if(done) {
    throw new NotFoundError(`File ${filename} not found`);
  }

  return value;
}


/**
 * Reads an arbitrary file from GridFS and pipes it to the express response
 *
 * @param filename
 * @param mongoose
 * @param outputStream
 */
export const readGridFSFile = async (filename: string, mongoose: Mongoose, outputStream: Writable) => {
  if (!filename || filename.length === 0) {
    throw new BadRequestError('Invalid file name!');
  }

  const resume = await _getFile(filename);
  await pipeline(resumeBucket.openDownloadStream(resume._id), outputStream);

  return 'Success';
};

/**
 * Write a file to GridFS and optionally overwrite existing
 *
 * @param filename
 * @param mongoose
 * @param expressFile
 */
export const writeGridFSFile = async (filename: string, mongoose: Mongoose, expressFile: any) => {
  if (!filename || filename.length === 0) {
    throw new BadRequestError('Invalid file name!');
  }

  // Delete existing file
  try {
    await deleteGridFSFile(filename, mongoose);
  } catch (e) {
    if (!(e instanceof NotFoundError)) {
      throw e;
    }
  }

    // Save new resume
  const fileReadStream = new stream.PassThrough();
  fileReadStream.end(Buffer.from(expressFile.data));

  await pipeline(fileReadStream, resumeBucket.openUploadStream(filename));

  return 'Success';
};

/**
 * Delete a file from GridFS, if it exists
 *
 * @param filename
 * @param mongoose
 */
export const deleteGridFSFile = async (filename: string, mongoose: Mongoose) => {
  if (!filename || filename.length === 0) {
    throw new BadRequestError('Invalid file name!');
  }

  const resume = await _getFile(filename);

  await resumeBucket.delete(resume._id);

  return 'Success';
};

/**
 * Reads an arbitrary list of files and pipes it to a Writable as a ZIP
 * 
 * @param filesnames
 * @param mongoose
 * @param outputStream
 */
export const exportAsZip = async (filenameData: {gfsfilename: string, filename:string}[], mongoose: Mongoose, outputStream: Writable) => {

  // TODO: fix change to proper type when _getFile type is fixed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allExists:any[] = [];
  for(const {filename} of filenameData) {
    allExists.push(_getFile(filename))
  }

  const existsResult = await Promise.all(allExists);
  for(const result of existsResult){
    if(result.state === "rejected"){
      throw new NotFoundError(result.reason);
    }
  }

  return await new Promise<void> ((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 0 } // Don't compress to save CPU
    });

    outputStream.on('end', function (){
      return resolve();
    });

    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        // throw error
        return reject(err);
      }
    });

    archive.on('error', function(err) {
      return reject(err);
    });

    archive.pipe(outputStream);

    for(const result of existsResult) {
      const tStream = new PassThrough();
      archive.append(tStream, {name: result.value.filename});

      resumeBucket.openDownloadStream(result.value._id)
          .pipe(tStream);
    }

    archive.finalize();
  })

}
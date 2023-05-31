import mongoose, {Mongoose} from 'mongoose';
import type GridFSFile from "mongoose/node_modules/mongodb";
import { pipeline } from 'node:stream/promises';
import stream, { Writable, PassThrough } from 'stream';
import { BadRequestError, NotFoundError } from '../types/errors';
import archiver from 'archiver';
import {getBucket, SystemGridFSBucket} from "../services/gridfs";

const _getFile = async (bucket: SystemGridFSBucket, filename: string): Promise<GridFSFile.GridFSFile> => {
  const cursor = getBucket(bucket, mongoose.connection.db).find({ filename: filename }, {
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
export const readGridFSFile = async (bucket: SystemGridFSBucket, filename: string, mongoose: Mongoose, outputStream: Writable) => {
  if (!filename || filename.length === 0) {
    throw new BadRequestError('Invalid file name!');
  }

  const resume = await _getFile(bucket, filename);
  await pipeline(getBucket(bucket, mongoose.connection.db).openDownloadStream(resume._id), outputStream);

  return 'Success';
};

/**
 * Write a file to GridFS and optionally overwrite existing
 *
 * @param filename
 * @param mongoose
 * @param expressFile
 */
export const writeGridFSFile = async (bucket: SystemGridFSBucket, filename: string, mongoose: Mongoose, expressFile: any) => {
  if (!filename || filename.length === 0) {
    throw new BadRequestError('Invalid file name!');
  }

  // Delete existing file
  try {
    await deleteGridFSFile(bucket, filename, mongoose);
  } catch (e) {
    if (!(e instanceof NotFoundError)) {
      throw e;
    }
  }

    // Save new resume
  const fileReadStream = new stream.PassThrough();
  fileReadStream.end(Buffer.from(expressFile.data));

  await pipeline(fileReadStream, getBucket(bucket, mongoose.connection.db).openUploadStream(filename));

  return 'Success';
};

/**
 * Delete a file from GridFS, if it exists
 *
 * @param filename
 * @param mongoose
 */
export const deleteGridFSFile = async (bucket: SystemGridFSBucket, filename: string, mongoose: Mongoose) => {
  if (!filename || filename.length === 0) {
    throw new BadRequestError('Invalid file name!');
  }

  const resume = await _getFile(bucket, filename);

  await getBucket(bucket, mongoose.connection.db).delete(resume._id);

  return 'Success';
};

/**
 * Reads an arbitrary list of files and pipes it to a Writable as a ZIP
 * 
 * @param filesnames
 * @param mongoose
 * @param outputStream
 */
export const exportAsZip = async (bucket: SystemGridFSBucket, filenameData: {gfsfilename: string, filename:string}[], mongoose: Mongoose, outputStream: Writable) => {
  const gfsFilenameToFilename = Object.fromEntries(filenameData.map(entry => [entry.gfsfilename, entry.filename]));

  const allExists:Promise<GridFSFile.GridFSFile>[] = [];
  for(const {gfsfilename} of filenameData) {
    allExists.push(_getFile(bucket, gfsfilename))
  }

  const existsResult = await Promise.all(allExists);

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
      archive.append(tStream, {name: gfsFilenameToFilename[result.filename]});

      getBucket(bucket, mongoose.connection.db).openDownloadStream(result._id)
          .pipe(tStream);
    }

    archive.finalize();
  })

}
import { Response } from 'express';
import Grid from 'gridfs-stream';
import { Mongoose } from 'mongoose';
import stream from 'stream';
import { BadRequestError, NotFoundError } from '../types/errors';

/**
 * Reads an arbitrary file from GridFS and pipes it to the express response
 *
 * @param filename
 * @param mongoose
 * @param res
 */
export const readGridFSFile = async (filename: string, mongoose: Mongoose, res: Response) => {
  const gfs = Grid(mongoose.connection.db, mongoose.mongo);

  return await new Promise((resolve, reject) => {
    gfs.exist({ filename: filename }, (err: any, found: any) => {
      if (err) {
        return reject(err);
      }

      if (found) {
        gfs.createReadStream({ filename: filename }).pipe(res);
      } else {
        return reject(new NotFoundError(`File ${filename} not found`));
      }
    });
  });
};

/**
 * Write a file to GridFS and optionally overwrite existing
 *
 * @param filename
 * @param mongoose
 * @param expressFile
 */
export const writeGridFSFile = async (filename: string, mongoose: Mongoose, expressFile: any) => {
  const gfs = Grid(mongoose.connection.db, mongoose.mongo);

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

  const gridWriteStream = gfs.createWriteStream({
    filename: filename,
  });
  fileReadStream.pipe(gridWriteStream);

  return 'Success';
};

/**
 * Delete a file from GridFS, if it exists
 *
 * @param filename
 * @param mongoose
 */
export const deleteGridFSFile = async (filename: string, mongoose: Mongoose) => {
  const gfs = Grid(mongoose.connection.db, mongoose.mongo);

  return await new Promise((resolve, reject) => {
    gfs.exist({ filename: filename }, (err: any, found: any) => {
      if (err) {
        return reject(err);
      }

      if (found) {
        gfs.remove({ filename: filename }, (err: any) => {
          if (err) {
            return reject(err);
          }

          resolve('Success!');
        });
      } else {
        reject(new NotFoundError(`File ${filename} not found`));
      }
    });
  });
};

import Grid from 'gridfs-stream';
import { Mongoose } from 'mongoose';
import stream, { Writable, PassThrough } from 'stream';
import { BadRequestError, NotFoundError } from '../types/errors';
import {promisify} from 'util';
import archiver from 'archiver';

/**
 * Reads an arbitrary file from GridFS and pipes it to the express response
 *
 * @param filename
 * @param mongoose
 * @param outputStream
 */
export const readGridFSFile = async (filename: string, mongoose: Mongoose, outputStream: Writable) => {
  const gfs = Grid(mongoose.connection.db, mongoose.mongo);

  if (!filename || filename.length === 0) {
    throw new BadRequestError('Invalid file name!');
  }

  return await new Promise((resolve, reject) => {
    gfs.exist({ filename: filename }, (err: any, found: any) => {
      if (err) {
        return reject(err);
      }

      if (found) {
        return resolve(gfs.createReadStream({ filename: filename }).pipe(outputStream));
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
  await fileReadStream.pipe(gridWriteStream);

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

  if (!filename || filename.length === 0) {
    throw new BadRequestError('Invalid file name!');
  }

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

/**
 * Reads an arbitrary list of files and pipes it to a Writable as a ZIP
 * 
 * @param filesnames
 * @param mongoose
 * @param outputStream
 */
export const exportAsZip = async (filenameData: {gfsfilename: string, filename:string}[], mongoose: Mongoose, outputStream: Writable) => {
  const gfs = Grid(mongoose.connection.db, mongoose.mongo);

  const gfsExistPromise = promisify(gfs.exist);
  gfs.exist = gfsExistPromise;

  if (!Array.isArray(filenameData) || filenameData.length === 0) {
    throw new BadRequestError('No file names given!');
  }

  return await new Promise<void>((resolve, reject) => {
    const allExists:boolean[] = [];
    for(const filenameDatum of filenameData){
      //@ts-expect-error gfs.exist is reassigned to the promisified version
      allExists.push(gfs.exist({filename: filenameDatum.gfsfilename}));
    }

    Promise.all(allExists).then((existsResult) => {
      for(const result of existsResult){
        if(!result){
          return reject(new NotFoundError(`A given file does not exist!`));
        }
      }

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

      for(const filenameDatum of filenameData){
        const gfsStream = gfs.createReadStream({ filename: filenameDatum.gfsfilename });
        const tStream = new PassThrough();

        archive.append(tStream, {name: filenameDatum.filename});
        gfsStream.pipe(tStream);
      }

      archive.finalize();

    }).catch((err) => {
      return reject(err);
    });
  });
}
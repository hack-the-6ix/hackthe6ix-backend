import mongoose, {mongo} from 'mongoose';
import { database } from '../consts';
import {log} from "./logger";
import {EventEmitter} from 'events';

// We put the DB connection in a separate file so that we can access the driver from multiple files if needed
mongoose.set('strictQuery', false);

let dbState = false;

const dbEvents = new EventEmitter();

let resumeBucket: any;

mongoose.connect(database).then(async () => {
  log.info('MongoDB connected.');
  dbState = true;
  dbEvents.emit('connected');

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  resumeBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "resumes" });

}).catch((err) => {
  log.error('Error connecting to mongodb. Exiting.', err);
  process.exit(1);
});

function isConnected():boolean {
  return dbState;
}

export {
  mongoose, isConnected, dbEvents, resumeBucket
};

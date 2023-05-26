import mongoose from 'mongoose';
import { database } from '../consts';
import {log} from "./logger";
import {EventEmitter} from 'events';

// We put the DB connection in a separate file so that we can access the driver from multiple files if needed
mongoose.set('strictQuery', false);

let dbState = false;

const dbEvents = new EventEmitter();

mongoose.connect(database).then(async () => {
  log.info('MongoDB connected.');
  dbState = true;
  dbEvents.emit('connected');
}).catch((err) => {
  console.error("hello", err);
  log.error('Error connecting to mongodb. Exiting.', err);
  // process.exit(1);
});

function isConnected():boolean {
  return dbState;
}

export {
  mongoose, isConnected, dbEvents
};

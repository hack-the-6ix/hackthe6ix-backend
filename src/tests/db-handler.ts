// Source: https://dev.to/paulasantamaria/testing-node-js-mongoose-with-an-in-memory-database-32np
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
mongoose.set('strictQuery', false);

const mongod = new MongoMemoryServer();

/**
 * Connect to the in-memory database.
 */
export const connect = async () => {
  await mongod.ensureInstance();

  return await mongoose.connect(mongod.getUri(), {});
};

/**
 * Drop database, close the connection and stop mongod.
 */
export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

/**
 * Remove all the data for all db collections.
 */
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

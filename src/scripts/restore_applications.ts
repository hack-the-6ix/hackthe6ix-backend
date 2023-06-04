/**
 * Someone may or may not hav accidentally nuked all of the applications, so this may or may not
 * have been how that data was recovered :D
 */

import fs from 'fs';
import mongoose from 'mongoose';
import User from '../models/user/User';

const database = 'mongodb://10.8.0.1:27017/ht6-backend';

const main = async () => {
  const data = JSON.parse(fs.readFileSync('src/scripts/ranked_users.json').toString())['message'];

  const promises: any[] = [];

  for (const u of data) {
    const id = u.id;

    promises.push(User.findOneAndUpdate({
      _id: id,
    }, {
      hackerApplication: u.hackerApplication,
    }));
  }

  console.log('Alright, promising rn');
  await Promise.all(promises);
  console.log('Done!');
};

mongoose.set('strictQuery', false);
mongoose.connect(database).then(async () => {
  console.log('MongoDB started');
  main();
}).catch((err) => {
  console.log(err);
  console.log('Error connecting to mongodb. Exiting.');
  process.exit(1);
});
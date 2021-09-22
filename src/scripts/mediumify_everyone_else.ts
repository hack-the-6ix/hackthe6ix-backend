/**
 * Anyone who didn't submit a shirt size should receive a medium one
 */

import mongoose from 'mongoose';
import User from '../models/user/User';

const database = 'mongodb://10.8.0.1:27017/ht6-backend';

const main = async () => {
  const otherRequirements: any = {
    'status.checkedIn': true,
    'status.confirmed': true,
    'hackerApplication.wantSwag': true,
    'hackerApplication.shirtSize': null,
  };

  await User.updateMany(otherRequirements, {
    'hackerApplication.shirtSize': 'M',
  });

  console.log('Done');

};

mongoose.connect(database, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
}).then(async () => {
  console.log('MongoDB started');
  main();
}).catch((err) => {
  console.log(err);
  console.log('Error connecting to mongodb. Exiting.');
  process.exit(1);
});
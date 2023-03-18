/**
 * Basically the ops team forgot to include the shirt size question, so we're taking this opportunity
 * to handle any address updates and set all the shirt sizes at the same time.
 */

import fs from 'fs';
import mongoose from 'mongoose';
import User from '../models/user/User';

const database = 'mongodb://10.8.0.1:27017/ht6-backend';

const main = async () => {
  const swag = JSON.parse(fs.readFileSync('src/scripts/swag_out.json').toString());

  console.log(`Found ${Object.keys(swag).length} entries!`);

  const otherRequirements = {
    'status.checkedIn': true,
    'status.confirmed': true,
  };

  for (const entry of swag) {
    let u = await User.findOne({
      email: entry.email,
      ...otherRequirements,
    });

    if (!u) {
      u = await User.findOne({
        firstName: entry.firstName.trim(),
        lastName: entry.lastName.trim(),
        ...otherRequirements,
      });
    }

    if (!u) {
      console.log('Skipping entry -- no match', entry);
    } else {
      const uid = u._id;
      let update: any = {
        'hackerApplication.shirtSize': entry.shirtSize,
      };

      if (entry.addressChange) {
        update = {
          ...update,
          'hackerApplication.addressLine1': entry.address.addressLine1,
          'hackerApplication.addressLine2': entry.address.addressLine2,
          'hackerApplication.city': entry.address.city,
          'hackerApplication.province': entry.address.province,
          'hackerApplication.postalCode': entry.address.postalCode,
          'hackerApplication.wantSwag': true,
        };
      }

      await User.findOneAndUpdate({
        _id: uid,
      }, update);
    }
  }

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
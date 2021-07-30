import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { IStatus } from '../../../models/user/fields';
import User from '../../../models/user/User';

dotenv.config();

(async () => {

  await mongoose.connect('mongodb://localhost:27017/ht6backend', {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
  });

  console.log('Connected');

  for (let i = 0; i < 300; i++) {
    console.log('Creating', i);

    User.create({
      firstName: 'Test ' + i.toString(),
      lastName: 'Testerson',
      idpLinkID: 'wtf',
      email: 'test' + i.toString() + '@test.ca',
      groups: {
        hacker: true,
        admin: false,
        organizer: false,
        volunteer: false,
      },
      status: {
        applied: true,
      } as IStatus,
      created: i,
    }, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }
})();

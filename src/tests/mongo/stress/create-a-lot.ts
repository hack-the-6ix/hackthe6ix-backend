import dotenv from 'dotenv';
import mongoose from 'mongoose';
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
      samlNameID: 'wtf',
      email: 'test' + i.toString() + '@test.ca',
      roles: {
        hacker: true,
      },
      status: {
        applied: true,
      },
    });
  }
})();

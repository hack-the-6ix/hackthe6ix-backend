import { ObjectID } from 'bson';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { editObject } from '../../../controller/ModelController';
import { IUser } from '../../../models/user/fields';

dotenv.config();

(async () => {

  await mongoose.connect(process.env.DATABASE || 'mongodb://localhost:27017/ht6backend', {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
  });

  console.log('Connected');

  editObject({
      _id: new ObjectID('5f081f878c60690dd9b9fd57'),
      roles: {
        organizer: true,
      },
    } as IUser,
    'user',
    {}, {
      lastName: 'Meme!',
    },
    (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

      console.log(error, data);

    });

})();

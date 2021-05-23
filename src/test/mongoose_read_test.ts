import { ObjectID } from 'bson';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { getObject } from '../controller/ModelController';

dotenv.config();

(async () => {

  await mongoose.connect('mongodb://localhost:27017/ht6', {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
  });

  console.log("Connected")

  getObject({
      _id: new ObjectID("5f081f878c60690dd9b9fd57"),
      jwt: {
        roles: {
          organizer: true
        }
      }
    },
    'user', {
      page: "1",
      size: "1"
    }, (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

      console.log(error, data);

    });

})();

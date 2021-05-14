import dotenv from 'dotenv';
import { getObject } from '../controller/ModelController';
import { syncMailingLists } from '../services/mailer';

dotenv.config();

(async () => {
  getObject({
    _id: 1234
  },
    "user", {}, (error: { code: number, message: string, stacktrace?: string }, data?: any) => {

    console.log(error, data)

    })
})();

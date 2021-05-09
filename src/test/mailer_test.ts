import dotenv from 'dotenv';
import { sendEmail } from '../services/mailer';
import * as mailer from '../services/mailer';

dotenv.config();

(async () => {

  console.log(await sendEmail(
    'tester@henrytu.me',
    '2',
    'This is a test',
    {},
    (error: { code: number, message: string }, data?: any) => {
      console.log(error, data);
    }
  ));

})();

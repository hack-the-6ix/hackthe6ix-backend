import dotenv from 'dotenv';
import { syncMailingLists } from '../services/mailer';

dotenv.config();

/*
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

})();*/

(async () => {

  console.log(await syncMailingLists(
    'nCCDTUijMH',
    [
      'tester@henrytu.me',
      'tester4@henrytu.me',
      'tester13@henrytu.me'
    ],
    (error: { code: number, message: string }, data?: any) => {
      console.log(error, data);
    },
  ));

})();

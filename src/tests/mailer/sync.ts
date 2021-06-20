import dotenv from 'dotenv';
import { syncMailingLists } from '../../services/mailer';

dotenv.config();

(async () => {
  console.log(
    await syncMailingLists(
      'AtlPqHaQpw',
      [
        'tester@henrytu.me',
        'tester4@henrytu.me',
        'tester13@henrytu.me',
      ],
    ));
})();

import dotenv from 'dotenv';
import { syncMailingList } from '../../services/mailer';

dotenv.config();

(async () => {
  console.log(
    await syncMailingList(
      'AtlPqHaQpw',
      [
        'tester@henrytu.me',
        'tester4@henrytu.me',
        'tester13@henrytu.me',
      ],
    ));
})();

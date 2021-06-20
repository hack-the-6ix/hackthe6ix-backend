import axios from 'axios';
import fs from 'fs';
import path from 'path';
import querystring from 'querystring';
import { InternalServerError } from '../types/types';

/**
 * Sends a mock email, which just gets added to a log file
 *
 * @param recipientEmail
 * @param templateID
 * @param subject
 * @param tags
 */
export const mockSendEmail = (recipientEmail: string, templateID: string, subject: string, tags: { [key: string]: string }) => {
  const message = `[${new Date()}] Template ${templateID} was sent to ${recipientEmail} with submit ${subject} and tags ${JSON.stringify(tags)}\n`;

  fs.appendFile(path.resolve(__dirname, '../../dev_logs/mailer.log'), message, (err) => {
    if (err) {
      throw new InternalServerError('Unable to send mock email: ' + err.toString());
    }
  });
};

/**
 * Sends a singular email using the mailtrain transcation API
 *
 * @param recipientEmail
 * @param templateID
 */
export const sendEmail = async (recipientEmail: string, templateID: string, subject: string, tags: { [key: string]: string }) => {

  switch (process.env.NODE_ENV) {
    case 'development':
      return mockSendEmail(recipientEmail, templateID, subject, tags);
    case 'test':
      return;
  }

  try {
    const parsedTags: any = {};

    for (const t of Object.keys(tags)) {
      parsedTags[`TAGS[${t}]`] = tags[t];
    }

    const result = await axios.post(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/templates/${templateID}/send?access_token=${process.env.MAILTRAIN_API_KEY}`, querystring.stringify({
      EMAIL: recipientEmail,
      SUBJECT: subject,
      ...parsedTags,
    }));

    if (result.status != 200 || !result.data) {
      throw new InternalServerError('Unable to send email');
    }

    return { message: 'Success' };

  } catch (e) {
    throw new InternalServerError('Unable to send email', e);
  }
};

/**
 * Writes mailing list config to file for dev
 * @param mailingListID
 * @param emails
 */
export const mockSyncMailingLists = (mailingListID: string, emails: string[]) => {
  const message = JSON.stringify({
    timestamp: new Date().toString(),
    emails: emails,
    id: mailingListID,
  }, null, 2);

  fs.writeFile(path.resolve(__dirname, `../../dev_logs/mailing_lists/${mailingListID}log`), message, (err) => {
    if (err) {
      throw new InternalServerError('Unable to mock sync mailing lists email: ' + err.toString());
    }
  });
};

/**
 * Syncs mailtrain mailing list with list of emails that should be enrolled at this instant
 *
 * NOTE: MAILTRAIN QUERIES ARE BY DEFAULT MAXED AT 10000! Things will probably break if we have
 *       more than this many subscribers.
 *
 * @param mailingListName
 * @param emails - array of emails that should be in the mailing list. All other emails are removed.
 */
export const syncMailingLists = async (mailingListID: string, emails: string[]) => {

  switch (process.env.NODE_ENV) {
    case 'development':
      return mockSyncMailingLists(mailingListID, emails);
    case 'test':
      return;
  }

  /**
   * TODO: Inject custom field for the subscriber's name and other metadata
   */

  try {
    const afterSubscribers = new Set(emails);

    // Step 1: Fetch a list of the current emails from the relevant mailing list
    const currentEmailsResult = await axios.get(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/subscriptions/${mailingListID}?access_token=${process.env.MAILTRAIN_API_KEY}`);

    if (currentEmailsResult.status != 200 || !currentEmailsResult?.data?.data?.subscriptions) {
      throw new InternalServerError('Unable to fetch existing subscribers');
    }

    const beforeSubscribers = new Set<string>(
      currentEmailsResult?.data?.data?.subscriptions.map(
        (x: any) => x.email,
      ),
    );

    // Step 2: Subscribe users that aren't on the list yet that should be
    const toBeAdded = [...afterSubscribers].filter(x => !beforeSubscribers.has(x));

    /**
     * TODO: Update this to fetch the user's name from the database too
     */

    const subscribeNewResults = await Promise.all(toBeAdded.map(
      (userEmail: string) => axios.post(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/subscribe/${mailingListID}?access_token=${process.env.MAILTRAIN_API_KEY}`, querystring.stringify({
        EMAIL: userEmail,
      })),
    ));

    for (const result of subscribeNewResults) {
      if (result.status != 200 || !result.data) {
        throw new InternalServerError('Unable to update subscriber');
      }
    }

    // Step 3: Delete users that are on the list that shouldn't be
    const toBeDeleted = [...beforeSubscribers].filter(x => !afterSubscribers.has(x));

    const deleteOldResults = await Promise.all(toBeDeleted.map(
      (userEmail: string) => axios.post(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/delete/${mailingListID}?access_token=${process.env.MAILTRAIN_API_KEY}`, querystring.stringify({
        EMAIL: userEmail,
      })),
    ));

    for (const result of deleteOldResults) {
      if (result.status != 200 || !result.data) {
        throw new InternalServerError('Unable to delete subscriber');
      }
    }

    // Step 4: Verify sync was successful
    const updatedEmailsResult = await axios.get(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/subscriptions/${mailingListID}?access_token=${process.env.MAILTRAIN_API_KEY}`);

    if (updatedEmailsResult.status != 200 || !updatedEmailsResult?.data?.data?.subscriptions) {
      throw new InternalServerError('Unable to verify subscribers');
    }

    const updatedSubscribers = new Set<string>(
      updatedEmailsResult?.data?.data?.subscriptions.map(
        (x: any) => x.email,
      ),
    );

    // Verify length of mailing list
    if (updatedSubscribers.size != emails.length) {
      throw new InternalServerError('Mismatch length between updated and target emails!');
    }

    // Verify all emails in list are valid
    for (const email of emails) {
      if (!updatedSubscribers.has(email)) {
        throw new InternalServerError('Mismatch between updated and target emails!');
      }
    }


    return { message: 'Success', added: toBeAdded, deleted: toBeDeleted };
  } catch (e) {
    throw new InternalServerError('Unable to sync mailing list', e);
  }
};

import axios from 'axios';
import querystring from 'querystring';
import { Callback } from '../types/types';

/**
 * Sends a singular email using the mailtrain transcation API
 *
 * @param recipientEmail
 * @param templateID
 * @param callback
 */
export const sendEmail = async (recipientEmail: string, templateID: string, subject: string, tags: { [key: string]: string }, callback: Callback) => {

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
      return callback({ code: 500, message: 'Unable to send email' });
    }

    return callback(null, { message: 'Success' });

  } catch (e) {
    return callback({ code: 500, message: 'Unable to send email', stacktrace: e });
  }

};

/**
 * Syncs mailtrain mailing list with list of emails that should be enrolled at this instant
 *
 * NOTE: MAILTRAIN QUERIES ARE BY DEFAULT MAXED AT 10000! Things will probably break if we have
 *       more than this many subscribers.
 *
 * @param mailingListName
 * @param emails - array of emails that should be in the mailing list. All other emails are removed.
 * @param callback
 */
export const syncMailingLists = async (mailingListID: string, emails: string[], callback: Callback) => {

  /**
   * TODO: Inject custom field for the subscriber's name and other metadata
   */

  try {
    const afterSubscribers = new Set(emails);

    // Step 1: Fetch a list of the current emails from the relevant mailing list
    const currentEmailsResult = await axios.get(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/subscriptions/${mailingListID}?access_token=${process.env.MAILTRAIN_API_KEY}`);

    if (currentEmailsResult.status != 200 || !currentEmailsResult?.data?.data?.subscriptions) {
      return callback({ code: 500, message: 'Unable to fetch existing subscribers' });
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
        return callback({ code: 500, message: 'Unable to update subscriber' });
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
        return callback({ code: 500, message: 'Unable to delete subscriber' });
      }
    }

  } catch (e) {
    return callback({ code: 500, message: 'Unable to sync mailing list', stacktrace: e });
  }

  return callback(null, { message: 'Success' });
};

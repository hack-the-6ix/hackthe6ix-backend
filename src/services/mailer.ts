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
    return callback({ code: 500, message: e });
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

  const afterSubscribers = new Set(emails);
  let beforeSubscribers: Set<string>;

  // Step 1: Fetch a list of the current emails from the relevant mailing list
  try {
    const result = await axios.get(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/subscriptions/${mailingListID}?access_token=${process.env.MAILTRAIN_API_KEY}`);

    if (result.status != 200 || !result?.data?.data?.subscriptions) {
      return callback({ code: 500, message: 'Unable to fetch existing subscribers' });
    }

    beforeSubscribers = new Set<string>(
      result?.data?.data?.subscriptions.map(
        (x: any) => x.email,
      ),
    );
  } catch (e) {
    return callback({ code: 500, message: e });
  }

  // Step 2: Subscribe users that aren't on the list yet that should be
  const toBeAdded = [...afterSubscribers].filter(x => !beforeSubscribers.has(x));

  try {
    /**
     * TODO: Update this to fetch the user's name from the database too
     */

    const results = await Promise.all(toBeAdded.map(
      (userEmail: string) => axios.post(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/subscribe/${mailingListID}?access_token=${process.env.MAILTRAIN_API_KEY}`, querystring.stringify({
        EMAIL: userEmail,
      })),
    ));

    for (const result of results) {
      if (result.status != 200 || !result.data) {
        return callback({ code: 500, message: 'Unable to update subscriber' });
      }
    }
  } catch (e) {
    return callback({ code: 500, message: e });
  }

  // Step 3: Delete users that are on the list that shouldn't be
  const toBeDeleted = [...beforeSubscribers].filter(x => !afterSubscribers.has(x));

  try {
    const results = await Promise.all(toBeDeleted.map(
      (userEmail: string) => axios.post(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/delete/${mailingListID}?access_token=${process.env.MAILTRAIN_API_KEY}`, querystring.stringify({
        EMAIL: userEmail,
      })),
    ));

    for (const result of results) {
      if (result.status != 200 || !result.data) {
        return callback({ code: 500, message: 'Unable to delete subscriber' });
      }
    }
  } catch (e) {
    return callback({ code: 500, message: e });
  }

  return callback(null, { message: 'Success' });
};

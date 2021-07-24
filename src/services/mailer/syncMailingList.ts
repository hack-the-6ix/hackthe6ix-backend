import { systemUser } from '../../consts';
import { getObject } from '../../controller/ModelController';
import { InternalServerError } from '../../types/errors';
import {
  addSubscriptionRequest,
  deleteSubscriptionRequest,
  getMailingListSubscriptionsRequest,
} from './util/external';

/**
 * Syncs mailtrain mailing list with list of emails that should be enrolled at this instant
 *
 * NOTE: MAILTRAIN QUERIES ARE BY DEFAULT MAXED AT 10000! Things will probably break if we have
 *       more than this many subscribers.
 *
 * @param mailingListID
 * @param emails - array of emails that should be in the mailing list. All other emails are removed.
 * @param forceUpdate - if true, updates will be pushed out to ALL users in emails, not just the ones that haven't been synced
 * @param email - If truthy, this email will correspond to the only one that is operated on
 *                We can use this to sync mailing lists for a single user without having to update thousands of other users
 */
export default async (mailingListID: string, emails: string[], forceUpdate?: boolean, email?: string) => {
  const expctedAfterSubscribers = new Set(emails.filter(
    (e: string) => e && (!email || e === email), // If email is specified then we will only operate on it
  ));

  // Step 1: Fetch a list of the current emails from the relevant mailing list
  const currentEmailsResult = await getMailingListSubscriptionsRequest(mailingListID);

  if (currentEmailsResult.status != 200 || !currentEmailsResult?.data?.data?.subscriptions) {
    throw new InternalServerError('Unable to fetch existing subscribers');
  }

  const beforeSubscribers = new Set<string>(
    currentEmailsResult?.data?.data?.subscriptions.map(
      (x: any) => x.email,
    ).filter(
      (e: string) => e && (!email || e === email), // If email is specified then we will only operate on it
    ),
  );

  // Step 2: Subscribe users that aren't on the list yet that should be
  const toBeAdded = forceUpdate
    ? [...expctedAfterSubscribers]
    : [...expctedAfterSubscribers].filter(x => !beforeSubscribers.has(x) && x);

  const subscribeNewResults = await Promise.all(toBeAdded.map(
    async (userEmail: string) => {
      const user = (await getObject(systemUser, 'user', {
        filter: {
          email: userEmail,
        },
      }));

      return addSubscriptionRequest(mailingListID, userEmail, user[0]?.mailmerge || {});
    },
  ));

  for (const result of subscribeNewResults) {
    if (result.status != 200 || !result.data) {
      throw new InternalServerError('Unable to update subscriber');
    }
  }

  // Step 3: Delete users that are on the list that shouldn't be
  const toBeDeleted = [...beforeSubscribers].filter(x => !expctedAfterSubscribers.has(x) && x);

  const deleteOldResults = await Promise.all(toBeDeleted.map(
    (userEmail: string) => deleteSubscriptionRequest(mailingListID, userEmail),
  ));

  for (const result of deleteOldResults) {
    if (result.status != 200 || !result.data) {
      throw new InternalServerError('Unable to delete subscriber');
    }
  }

  // Step 4: Verify sync was successful
  const updatedEmailsResult = await getMailingListSubscriptionsRequest(mailingListID);

  if (updatedEmailsResult.status != 200 || !updatedEmailsResult?.data?.data?.subscriptions) {
    throw new InternalServerError('Unable to verify subscribers');
  }

  const updatedSubscribers = new Set<string>(
    updatedEmailsResult?.data?.data?.subscriptions.map(
      (x: any) => x.email,
    ).filter(
      (e: string) => e && (!email || e === email), // If email is specified then we will only operate on it
    ),
  );

  // Verify length of mailing list
  if (updatedSubscribers.size != expctedAfterSubscribers.size) {
    throw new InternalServerError('Mismatch length between updated and target emails!');
  }

  // Verify all emails in list are valid
  for (const email of expctedAfterSubscribers) {
    if (!updatedSubscribers.has(email)) {
      throw new InternalServerError('Mismatch between updated and target emails!');
    }
  }

  return { added: toBeAdded, deleted: toBeDeleted };
};

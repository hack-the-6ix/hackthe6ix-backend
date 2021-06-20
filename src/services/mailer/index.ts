import { IUser } from '../../models/user/fields';
import { Templates } from '../../types/mailer';
import { InternalServerError } from '../../types/types';
import {
  addSubscriptionRequest,
  deleteSubscriptionRequest,
  getMailingListSubscriptionsRequest,
  getTemplate,
  sendEmailRequest,
} from './external';


/**
 * Sends a singular email using the Mailtrain transaction API
 *
 * @param recipientEmail - address to send the email to
 * @param templateID - Mailtrain ID of email template
 * @param subject - email subject
 * @param tags - data to be substituted into the email
 */
export const sendEmail = async (recipientEmail: string, templateID: string, subject: string, tags?: { [key: string]: string }) => {
  try {
    const parsedTags: any = {};

    for (const t of Object.keys(tags || {})) {
      parsedTags[`TAGS[${t}]`] = tags[t];
    }

    const result = await sendEmailRequest(recipientEmail, templateID, subject, parsedTags);

    if (result.status != 200 || !result.data) {
      throw new InternalServerError('Unable to send email');
    }

    return { message: 'Success' };

  } catch (e) {
    throw new InternalServerError('Unable to send email', e);
  }
};

/**
 * Sends a singular email using the mailtrain transaction API. We use a user friendly template name to lookup the Mailtrain
 * templateID and subject.
 *
 * @param recipient - user object of recipient
 * @param templateName - internal template name of the email (we use this to fetch the templateID and subject)
 * @param tags - data to be substituted into the email
 */
export const sendTemplateEmail = async (recipient: IUser, templateName: Templates, tags?: { [key: string]: string }) => {
  const template = getTemplate(templateName);

  const templateID: string = template.templateID;
  const subject: string = template.subject;

  await sendEmail(recipient.email, templateID, subject, {
    ...(tags || {}),
    MERGE_FIRST_NAME: recipient.firstName,
    MERGE_LAST_NAME: recipient.lastName,
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

  /**
   * TODO: Inject custom field for the subscriber's name and other metadata
   */

  try {
    const afterSubscribers = new Set(emails);

    // Step 1: Fetch a list of the current emails from the relevant mailing list
    const currentEmailsResult = await getMailingListSubscriptionsRequest(mailingListID);

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
      (userEmail: string) => addSubscriptionRequest(mailingListID, userEmail),
    ));

    for (const result of subscribeNewResults) {
      if (result.status != 200 || !result.data) {
        throw new InternalServerError('Unable to update subscriber');
      }
    }

    // Step 3: Delete users that are on the list that shouldn't be
    const toBeDeleted = [...beforeSubscribers].filter(x => !afterSubscribers.has(x));

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

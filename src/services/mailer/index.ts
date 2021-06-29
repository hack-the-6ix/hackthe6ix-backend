import { systemUser } from '../../consts';
import { getObject } from '../../controller/ModelController';
import { IUser } from '../../models/user/fields';
import User from '../../models/user/User';
import { InternalServerError } from '../../types/errors';
import { Lists, Templates } from '../../types/mailer';
import {
  addSubscriptionRequest,
  deleteSubscriptionRequest,
  getList,
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

    return 'Success';

  } catch (e) {
    throw new InternalServerError('Unable to send email', e);
  }
};

/**
 * Sends a singular email using the mailtrain transaction API. We use a user friendly template name to lookup the Mailtrain
 * templateID and subject.
 *
 * @param email - address to send the email to
 * @param templateName - internal template name of the email (we use this to fetch the templateID and subject)
 * @param tags - data to be substituted into the email (they take precedence over the automatically generated mailmerge fields)
 */
export const sendTemplateEmail = async (email: string, templateName: Templates, tags?: { [key: string]: string }) => {
  const template = getTemplate(templateName);

  const templateID: string = template.templateID;
  const subject: string = template.subject;

  // Go and fetch the user's email
  const user = (await getObject(systemUser, 'user', {
    filter: {
      email: email,
    },
  }))[0];

  await sendEmail(email, templateID, subject, {
    ...(user?.mailmerge || {}),
    ...(tags || {}),
  });
};

/**
 * Send all available email templates to the requesting Admin user to verify
 * the integrity of the templates.
 *
 * @param requestUser
 */
export const sendAllTemplates = async (requestUser: IUser) => {
  const templateNames: string[] = [];

  const tags: any = {};

  for (const k of Object.keys(requestUser.mailmerge)) {
    tags[k] = `~${k} goes here~`;
  }

  for (const template in Templates) {
    templateNames.push(template);
    await sendTemplateEmail(
      requestUser.email,
      (Templates as any)[template],
      tags,
    );
  }

  return templateNames;
};

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
export const syncMailingList = async (mailingListID: string, emails: string[], forceUpdate?: boolean, email?: string) => {
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
      ).filter(
        (e: string) => !email || e === email, // If email is specified then we will only operate on it
      ),
    );

    // Step 2: Subscribe users that aren't on the list yet that should be
    const toBeAdded = forceUpdate
      ? [...afterSubscribers]
      : [...afterSubscribers].filter(x => !beforeSubscribers.has(x));

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
      ).filter(
        (e: string) => !email || e === email, // If email is specified then we will only operate on it
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

    return { added: toBeAdded, deleted: toBeDeleted };
  } catch (e) {
    throw new InternalServerError('Unable to sync mailing list', e);
  }
};

/**
 * Given a MailingList name, search for the relevant users that should be in the list and
 * sync with Mailtrain.
 *
 * If mailingList is not provided, sync all lists in the system.
 *
 * If forceUpdate is enabled, all users who are on the list will be synced (rather than just users
 * who are not yet on the Mailtrain list)
 *
 * @param inputMailingLists - list of mailing list names
 * @param forceUpdate - fully sync mailing lists, instead of just taking the delta
 * @param email - when specified, only changes involving this user will be performed (i.e. all other users
 *                will be untouched during the sync)
 */
export const syncMailingLists = async (inputMailingLists?: string[], forceUpdate?: boolean, email?: string) => {
  let mailingLists: string[] = [];

  if (inputMailingLists) {
    mailingLists = [...inputMailingLists];
  } else {
    for (const list in Lists) {
      mailingLists.push(list);
    }
  }

  for (const list of mailingLists) {
    const listConfig = getList(list);

    const query = {
      ...listConfig.query,
    };

    // We'll only make queries about this user
    if (email && !forceUpdate) {
      query.email = email;
    }

    if (!query) {
      throw new InternalServerError(`Query for "${list}" is falsy`);
    }

    const emails = (await User.find(query)).map((u: IUser) => u.email);

    await syncMailingList(
      list,
      emails,
      forceUpdate,
      email,
    );
  }

  return mailingLists;
};

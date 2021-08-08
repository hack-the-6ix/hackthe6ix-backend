import { IUser } from '../../models/user/fields';
import { MailingList } from '../../types/mailer';
import { addSubscriptionRequest, getList } from './util/external';

/**
 * This will add a user to every registered mailing list with the (expected)
 * name of the mailing list in their email.
 *
 * This can be used to verify that the correct list ID was used; however,
 * it does NOT verify that the query is correct.
 *
 * The request user's mail merge will be used for all of the test users.
 */
export default async (requestUser: IUser) => {
  const listNames: string[] = [];

  // We'll use the requester's mail merge details with the mock emails
  const mailmerge = requestUser.mailmerge;

  for (const list in MailingList) {
    const listConfig = getList(list);

    await addSubscriptionRequest(
      listConfig.listID,
      `${list}@localhost`,
      mailmerge,
    );

    listNames.push(list);
  }

  return listNames;
};

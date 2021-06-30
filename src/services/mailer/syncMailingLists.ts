import { IUser } from '../../models/user/fields';
import User from '../../models/user/User';
import { MailingList } from '../../types/mailer';
import syncMailingList from './syncMailingList';
import { getList } from './util/external';

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
export default async (inputMailingLists?: string[], forceUpdate?: boolean, email?: string) => {
  let mailingLists: string[] = [];

  if (inputMailingLists) {
    mailingLists = [...inputMailingLists];
  } else {
    for (const list in MailingList) {
      mailingLists.push(list);
    }
  }

  for (const list of mailingLists) {
    const listConfig = getList(list);

    const query = {
      ...listConfig.query || {},
    };

    // We'll only make queries about this user
    if (email && !forceUpdate) {
      query.email = email;
    }

    const emails = (await User.find(query)).map((u: IUser) => u.email);

    await syncMailingList(
      listConfig.listID || '',
      emails,
      forceUpdate,
      email,
    );
  }

  return mailingLists;
};

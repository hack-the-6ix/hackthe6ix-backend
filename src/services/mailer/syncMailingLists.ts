import { IUser } from '../../models/user/fields';
import User from '../../models/user/User';
import { MailingList } from '../../types/mailer';
import syncMailingList from './syncMailingList';
import { getList } from './util/external';
import DynamicCacheProvider from "../cache";

const mailingListCache = new DynamicCacheProvider(async (list: string) => {
  return await getList(list)
}, {
  stdTTL: 60
});

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
    const listConfig = await mailingListCache.get(list);

    const query = {
      ...listConfig?.query || {},
    };

    const filterQuery = {
      ...listConfig?.filterQuery || {},
    };

    // We'll only make queries about this user
    if (email && !forceUpdate) {
      query.email = email;
    }

    const emails = (await User.find(query))
    .filter((u: IUser) => {
      // We use filter queries to narrow down the list of emails even further.
      // In some cases (such as with virtual fields), we cannot rely on mongodb to filter for us.
      for (const field in filterQuery) {
        const query = field.split('.');

        if (query.length > 0) {
          let runner: any = u;

          for (let i = 0; i < query.length; i++) {
            if (runner !== undefined) {
              runner = runner[query[i]];
            } else {
              return false;
            }
          }

          if (runner !== filterQuery[field]) {
            return false;
          }
        }
      }

      return true;
    })
    .map((u: IUser) => u.email);

    await syncMailingList(
      listConfig?.listID || '',
      emails,
      forceUpdate,
      email,
    );
  }

  return mailingLists;
};

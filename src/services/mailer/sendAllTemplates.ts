import { IUser } from '../../models/user/fields';
import { MailTemplate } from '../../types/mailer';
import sendTemplateEmail from './sendTemplateEmail';

/**
 * Send all available email templates to the requesting Admin user to verify
 * the integrity of the templates.
 *
 * @param requestUser
 */
export default async (requestUser: IUser) => {
  const templateNames: string[] = [];

  const tags: any = {};

  for (const k of Object.keys(requestUser.mailmerge)) {
    tags[k] = `~${k} goes here~`;
  }

  for (const template in MailTemplate) {
    templateNames.push(template);
    await sendTemplateEmail(
      requestUser.email,
      (MailTemplate as any)[template],
      tags,
    );
  }

  return templateNames;
};

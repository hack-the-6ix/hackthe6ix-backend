import User from '../../models/user/User';
import { MailTemplate } from '../../types/mailer';
import sendEmail from './sendEmail';
import { getTemplate } from './util/external';

/**
 * Sends a singular email using the mailtrain transaction API. We use a user friendly template name to lookup the Mailtrain
 * templateID and subject.
 *
 * @param email - address to send the email to
 * @param templateName - internal template name of the email (we use this to fetch the templateID and subject)
 * @param tags - data to be substituted into the email (they take precedence over the automatically generated mailmerge fields)
 */
export default async (email: string, templateName: MailTemplate, tags?: { [key: string]: string }) => {
  const template = getTemplate(templateName);

  const templateID: string = template.templateID;
  const subject: string = template.subject;

  // Go and fetch the user's email
  const user = await User.findOne({
    email: email,
  });

  await sendEmail(email, templateID, subject, {
    ...(user?.toJSON()?.mailmerge || {}),
    ...(tags || {}),
  });

  return 'Success';
};

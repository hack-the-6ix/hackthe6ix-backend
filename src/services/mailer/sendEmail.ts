import { InternalServerError } from '../../types/errors';
import { sendEmailRequest } from './util/external';

/**
 * Sends a singular email using the Mailtrain transaction API
 *
 * @param recipientEmail - address to send the email to
 * @param templateID - Mailtrain ID of email template
 * @param subject - email subject
 * @param tags - data to be substituted into the email
 */
export default async (recipientEmail: string, templateID: string, subject: string, tags?: { [key: string]: string }) => {
  const parsedTags: any = {};

  if(tags) {
    for (const t of Object.keys(tags)) {
      parsedTags[`TAGS[${t}]`] = tags[t];
    }
  }

  const result = await sendEmailRequest(recipientEmail, templateID, subject, parsedTags);

  if (result.status != 200 || !result.data) {
    throw new InternalServerError('Unable to send email');
  }

  return 'Success';
};

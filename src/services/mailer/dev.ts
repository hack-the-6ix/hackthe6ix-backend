import fs from 'fs';
import path from 'path';
import { InternalServerError } from '../../types/types';

export const okResponse = { status: 200, data: {} as any };

/**
 * Sends a mock email, which just gets added to a log file
 *
 * @param recipientEmail - address to send the email to
 * @param templateID - Mailtrain ID of email template
 * @param subject - email subject
 * @param tags - data to be substituted into the email
 */
export const mockSendEmail = async (recipientEmail: string, templateID: string, subject: string, tags: { [key: string]: string }) => {
  const message = `[${new Date()}] Template ${templateID} was sent to ${recipientEmail} with submit ${subject} and tags ${JSON.stringify(tags)}\n`;

  fs.appendFile(path.resolve(__dirname, '../../dev_logs/mailer.log'), message, (err) => {
    if (err) {
      throw new InternalServerError('Unable to send mock email: ' + err.toString());
    }
  });

  return okResponse;
};

const getMailingListLogFileName = (mailingListID: string) => path.resolve(__dirname, `../../dev_logs/mailing_lists/${mailingListID}log`);

/**
 * Get subscriptions from dev mailing list
 * @param mailingListID
 */
export const mockGetSubscriptions = async (mailingListID: string) => {
  const existingFile = fs.readFileSync(getMailingListLogFileName(mailingListID), 'utf8') || '{"emails": []}';

  return {
    status: 200, data: {
      data: {
        subscriptions: JSON.parse(existingFile).emails,
      },
    },
  };
};

/**
 * Adds subscription from dev mailing list
 * @param mailingListID
 * @param email
 */
export const mockAddSubscription = async (mailingListID: string, email: string) => {
  const existingFile = fs.readFileSync(getMailingListLogFileName(mailingListID), 'utf8') || '{"emails": []}';

  const emails = JSON.parse(existingFile).emails;

  if (emails.indexOf(email) === -1) {
    emails.push(email);
  }

  const message = JSON.stringify({
    timestamp: new Date().toString(),
    emails: emails,
    id: mailingListID,
  }, null, 2);

  try {
    fs.writeFileSync(getMailingListLogFileName(mailingListID), message);
  } catch (err) {
    throw new InternalServerError('Unable to mock sync mailing lists email: ' + err.toString());
  }

  return okResponse;
};

/**
 * Deletes subscription from dev mailing list
 * @param mailingListID
 * @param email
 */
export const mockDeleteSubscription = async (mailingListID: string, email: string) => {
  const existingFile = fs.readFileSync(getMailingListLogFileName(mailingListID), 'utf8') || '{"emails": []}';

  const emails = JSON.parse(existingFile).emails;

  if (emails.indexOf(email) !== -1) {
    emails.splice(emails.indexOf(email), 1);
  }

  const message = JSON.stringify({
    timestamp: new Date().toString(),
    emails: emails,
    id: mailingListID,
  }, null, 2);

  try {
    fs.writeFileSync(getMailingListLogFileName(mailingListID), message);
  } catch (err) {
    throw new InternalServerError('Unable to mock sync mailing lists email: ' + err.toString());
  }

  return okResponse;
};

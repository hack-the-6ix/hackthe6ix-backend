import fs from 'fs';
import path from 'path';
import { InternalServerError } from '../../../types/errors';

export const okResponse = { status: 200, data: {} as any };
const devLogPath = '../../../../dev_logs';
const defaultSubscriptions = {
  emails: [] as string[],
  mailmerges: [] as string[],
};

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

  fs.appendFile(path.resolve(__dirname, devLogPath + '/mailer.log'), message, (err) => {
    if (err) {
      throw new InternalServerError('Unable to send mock email: ' + err.toString());
    }
  });

  return okResponse;
};

const getMailingListLogFileName = (mailingListID: string) => path.resolve(__dirname, devLogPath + `/mailing_lists/${mailingListID}.log`);

const readLog = (mailingListID: string) => {
  const path = getMailingListLogFileName(mailingListID);
  const existingFile = fs.existsSync(path)
    ? fs.readFileSync(path, 'utf8')
    : JSON.stringify(defaultSubscriptions);

  return existingFile;
};

/**
 * Get subscriptions from dev mailing list
 * @param mailingListID
 */
export const mockGetSubscriptions = async (mailingListID: string) => {
  const existingFile = readLog(mailingListID);

  return {
    status: 200, data: {
      data: {
        subscriptions: JSON.parse(existingFile).emails.map((email: string) => (
          {
            email: email,
          }
        )),
      },
    },
  };
};

/**
 * Adds subscription from dev mailing list
 * @param mailingListID
 * @param email
 * @param mailmerge
 */
export const mockAddSubscription = async (mailingListID: string, email: string, mailmerge: any) => {
  const existingFile = readLog(mailingListID);

  const emails = JSON.parse(existingFile).emails || [];
  const mailmerges = JSON.parse(existingFile).mailmerges || [];

  if (emails.indexOf(email) === -1) {
    emails.push(email);
    mailmerges.push(mailmerge || {});
  }

  const message = JSON.stringify({
    timestamp: new Date().toString(),
    emails: emails,
    mailmerges: mailmerges,
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
  const existingFile = readLog(mailingListID);

  const emails = JSON.parse(existingFile).emails;
  const mailmerges = JSON.parse(existingFile).mailmerges;

  if (emails.indexOf(email) !== -1) {
    const index = emails.indexOf(email);
    emails.splice(index, 1);
    mailmerges.splice(index, 1);
  }

  const message = JSON.stringify({
    timestamp: new Date().toString(),
    emails: emails,
    mailmerges: mailmerges,
    id: mailingListID,
  }, null, 2);

  try {
    fs.writeFileSync(getMailingListLogFileName(mailingListID), message);
  } catch (err) {
    throw new InternalServerError('Unable to mock sync mailing lists email: ' + err.toString());
  }

  return okResponse;
};

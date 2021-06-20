/**
 * Abstract the actual API calls to make it easier to unit test
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import querystring from 'querystring';
import { InternalServerError } from '../../types/types';
import {
  mockAddSubscription,
  mockDeleteSubscription,
  mockGetSubscriptions,
  mockSendEmail,
  okResponse,
} from './dev';

// Do not actually use the real config during unit tests
const mailerConfig = process.env.NODE_ENV === 'test'
  ? {}
  : JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'config', 'mailer.json')).toString('utf8'));

export const getTemplate = (templateName: string) => {
  const template = process.env.NODE_ENV === 'test'
    ? {
      templateID: 'foo',
      subject: 'cool subject bro',
    }
    : mailerConfig.templates[templateName];

  if (template) {
    return template;
  } else {
    throw new InternalServerError(`Unable to fetch template with name: ${templateName}`);
  }
};

export const sendEmailRequest = async (recipientEmail: string, templateID: string, subject: string, parsedTags: any) => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return mockSendEmail(recipientEmail, templateID, subject, parsedTags);
    case 'test':
      return okResponse;
  }

  return axios.post(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/templates/${templateID}/send?access_token=${process.env.MAILTRAIN_API_KEY}`, querystring.stringify({
    EMAIL: recipientEmail,
    SUBJECT: subject,
    ...parsedTags,
  }));
};

export const getMailingListSubscriptionsRequest = async (mailingListID: string) => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return mockGetSubscriptions(mailingListID);
    case 'test':
      return okResponse;
  }

  return axios.get(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/subscriptions/${mailingListID}?access_token=${process.env.MAILTRAIN_API_KEY}`);
};

export const addSubscriptionRequest = async (mailingListID: string, userEmail: string) => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return mockAddSubscription(mailingListID, userEmail);
    case 'test':
      return okResponse;
  }

  return axios.post(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/subscribe/${mailingListID}?access_token=${process.env.MAILTRAIN_API_KEY}`, querystring.stringify({
    EMAIL: userEmail,
  }));
};

export const deleteSubscriptionRequest = async (mailingListID: string, userEmail: string) => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return mockDeleteSubscription(mailingListID, userEmail);
    case 'test':
      return okResponse;
  }

  return axios.post(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/delete/${mailingListID}?access_token=${process.env.MAILTRAIN_API_KEY}`, querystring.stringify({
    EMAIL: userEmail,
  }));
};

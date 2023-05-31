/**
 * Abstract the actual API calls to make it easier to unit test
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import querystring from 'querystring';
import { NotFoundError } from '../../../types/errors';
import {
  mockAddSubscription,
  mockDeleteSubscription,
  mockGetSubscriptions,
  mockSendEmail,
} from './dev';

import MailerTemplate from "../../../models/mailertemplate/MailerTemplate";
import MailerList from "../../../models/mailerlist/MailerList";
import {IMailerTemplate} from "../../../models/mailertemplate/fields";
import {IMailerList} from "../../../models/mailerlist/fields";

// TODO: Update all usages of getTemplate and getList to use async version!

export const getTemplate = async (templateName: string):Promise<IMailerTemplate> => {
  const template = await MailerTemplate.findOne({
    name: templateName
  });

  if (template) {
    return template;
  } else {
    throw new NotFoundError(`Unable to fetch template with name: ${templateName}`);
  }
};

export const getList = async (listName: string):Promise<IMailerList> => {
  const list = await MailerList.findOne({
    name: listName
  });

  if (list) {
    return list;
  } else {
    throw new NotFoundError(`Unable to fetch list with name: ${list}`);
  }
};

export const sendEmailRequest = async (recipientEmail: string, templateID: string, subject: string, parsedTags: any) => {
  if (process.env.NODE_ENV === 'development') {
    return mockSendEmail(recipientEmail, templateID, subject, parsedTags);
  }

  return axios.post(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/templates/${templateID}/send?access_token=${process.env.MAILTRAIN_API_KEY}`, querystring.stringify({
    EMAIL: recipientEmail,
    SUBJECT: subject,
    ...parsedTags,
  }));
};

export const getMailingListSubscriptionsRequest = async (mailingListID: string) => {
  if (process.env.NODE_ENV === 'development') {
    return mockGetSubscriptions(mailingListID);
  }

  return axios.get(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/subscriptions/${mailingListID}?access_token=${process.env.MAILTRAIN_API_KEY}`);
};

export const addSubscriptionRequest = async (mailingListID: string, userEmail: string, mailmerge: any) => {
  if (process.env.NODE_ENV === 'development') {
    return mockAddSubscription(mailingListID, userEmail, mailmerge);
  }

  return axios.post(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/subscribe/${mailingListID}?access_token=${process.env.MAILTRAIN_API_KEY}`, querystring.stringify({
    EMAIL: userEmail,
    ...mailmerge,
  }));
};

export const deleteSubscriptionRequest = async (mailingListID: string, userEmail: string) => {
  if (process.env.NODE_ENV === 'development') {
    return mockDeleteSubscription(mailingListID, userEmail);
  }

  return axios.post(`${process.env.MAILTRAIN_PUBLIC_ROOT_PATH}/api/delete/${mailingListID}?access_token=${process.env.MAILTRAIN_API_KEY}`, querystring.stringify({
    EMAIL: userEmail,
  }));
};

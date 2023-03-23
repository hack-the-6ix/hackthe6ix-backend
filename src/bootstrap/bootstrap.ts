import * as fs from 'fs';
import * as path from 'path';

import "../services/mongoose_service";

import InitializationRecord from "../models/initializationrecord/InitializationRecord";
import Settings from '../models/settings/Settings';
import MailerList from "../models/mailerlist/MailerList";
import MailerTemplate from "../models/mailertemplate/MailerTemplate";
import {MailingList, MailTemplate} from "../types/mailer";
import {verifyConfigEntity} from "../services/mailer/util/verify_config";

// TODO: ADd this script to run first before all npm scripts and Docker container!

async function initializeSettings() {
  const initKey = "settings";

  const initCheck = await InitializationRecord.findOne({
    key: initKey
  })

  if(!initCheck) {
    const settingsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'config', 'settings.json')).toString('utf8'));
    await Settings.findOneAndUpdate({}, settingsData, {
      upsert: true
    })

    await InitializationRecord.create({
      key: initKey
    });

    return true;
  }

  return false;
}

async function initializeTemplates() {
  const initKey = "mailer.templates";

  const initCheck = await InitializationRecord.findOne({
    key: initKey
  })

  if(!initCheck) {
    const mailerData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'config', 'mailer.json')).toString('utf8'));

    // Verify templates
    verifyConfigEntity(mailerData, MailTemplate, 'templates', ['subject', 'templateID']);

    const dataRoot = mailerData["templates"]
    await MailerTemplate.create(Object.keys(dataRoot).map((name) => {
      return {
        name,
        subject: dataRoot[name]["subject"],
        templateID: dataRoot[name]["templateID"]
      }
    }));

    await InitializationRecord.create({
      key: initKey
    });

    return true;
  }

  return false;
}

async function initializeLists() {
  const initKey = "mailer.lists";

  const initCheck = await InitializationRecord.findOne({
    key: initKey
  })

  if(!initCheck) {
    const mailerData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'config', 'mailer.json')).toString('utf8'));

    // Verify lists
    verifyConfigEntity(mailerData, MailingList, 'lists', ['listID', 'query']);

    const dataRoot = mailerData["lists"]
    await MailerList.create(Object.keys(dataRoot).map((name) => {
      return {
        name,
        listID: dataRoot[name]["listID"],
        query: dataRoot[name]["query"]
      }
    }));

    await InitializationRecord.create({
      key: initKey
    });

    return true;
  }

  return false;
}

async function ensureInit():Promise<void> {
  const promises = [
      initializeSettings(), initializeTemplates(), initializeLists()
  ]
  const results = await Promise.allSettled(promises);
  for(const result of results){
    if(result.status === "rejected") {
      throw result.reason;
    }
  }
}

ensureInit().then(() => {
  console.log("Finished database initialization. Starting backend.")
}).catch((err) => {
  console.error("Encountered error during database initialization.", err);
})
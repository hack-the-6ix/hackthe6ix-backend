// import { IdentityProvider, SAMLAssertResponse, ServiceProvider } from 'saml2-js';

import axios from 'axios';

import {BadRequestError, NotFoundError} from '../types/errors';
import { ArrayElement } from '../../@types/utilitytypes';
import { ISettings } from '../models/settings/fields';
import { ITokenset } from '../models/tokenset/fields';
import { ActionSpec } from '../../@types/logger';
import Tokenset from '../models/tokenset/Tokenset';
import Settings from '../models/settings/Settings';
import User from '../models/user/User';

// import syncMailingLists from '../services/mailer/syncMailingLists';
// import { fetchSAMLBundle } from '../services/multisaml';
import * as permissions from '../services/permissions';
import {BackendTokenset} from "../types/types";
// import { BadRequestError, InternalServerError } from '../types/errors';
//

let settingsCache = {} as ISettings;
let settingsTime = 0;

async function _getCachedSettings():Promise<ISettings> {
  if(settingsTime + parseInt(process.env.AUTH_SETTINGS_CACHE_EVICT) < Date.now()){
    const settings = await Settings.findOne({}, 'openID');

    settingsCache = settings;
    settingsTime = Date.now();

    return settings;
  }

  return settingsCache;
}

export const getProviderByName = (settings: ISettings, providerName: string): ArrayElement<ISettings['openID']['providers']> | undefined => {
  for (const provider of settings['openID']['providers']) {
    if (provider['name'] === providerName) {
      return provider;
    }
  }
  return;
};

export async function getUserData (url: string, token: string): Promise<Record<string, any>> {
  const response = await axios({
    method: 'GET',
    url: url,
    headers: {
      Authorization: 'Bearer ' + token,
    },
  });

  return response.data;
};

export async function issueLocalToken (assertAttributes: Record<string, any>): Promise<string> {
  const groups: any = {};

  // Update the groups this user is in in the database
  for (const group of assertAttributes.groups || []) {
    // Remove the leading /
    groups[group.substring(1)] = true;
  }

  const userInfo = await User.findOneAndUpdate({
    idpLinkID: assertAttributes.sub,
  }, {
    email: assertAttributes.email.toLowerCase(),
    firstName: assertAttributes.given_name,
    lastName: assertAttributes.family_name,
    groups: groups,
  }, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });

  console.log(assertAttributes);

  const token = permissions.createJwt({
    id: userInfo._id,
    idpLinkID: assertAttributes.sub,
    roles: userInfo.roles,
  });

  return token;
};

async function _refreshToken(client_id: string, client_secret: string, url: string, refreshToken: string): Promise<{
  token: string,
  refreshToken: string
}> {
  const params = new URLSearchParams();
  params.append('client_id', client_id);
  params.append('client_secret', client_secret);
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  const response = await axios.post(url, params);

  return {
    token: response.data.access_token,
    refreshToken: response.data.refresh_token,
  };
}

export const handleRefresh = async (providerName: string, refreshToken: string):Promise<{
  token: string,
  refreshToken: string
}> => {
  const settings = await _getCachedSettings();
  const provider = getProviderByName(settings, providerName);

  try {
    const newTokens = await _refreshToken(provider.client_id, provider.client_secret, provider.token_url, refreshToken);

    const userData = await getUserData(provider.userinfo_url, newTokens['token']);

    const token = await issueLocalToken(userData);

    return {
      token: token,
      refreshToken: newTokens['refreshToken']
    }
  } catch (err) {
    console.log(err);
    throw new BadRequestError("Unable to refresh token");
  }
}

export const handleLogout = async (providerName:string, refreshToken:string):Promise<ActionSpec> => {
  const tokenInfo = permissions.decodeToken(refreshToken);
  const settings = await _getCachedSettings();
  const provider = getProviderByName(settings, providerName);

  if(!refreshToken){
    throw new BadRequestError('No refresh token provided.');
  }

  try {
    await User.findOneAndUpdate({
      idpLinkID: tokenInfo.sub,
    }, {
      lastLogout: Date.now(),
    });
  } catch (err) {
    console.log('Unable to revoke past sessions.');
  }
  
  try {
    const params = new URLSearchParams();
    params.append('refresh_token', refreshToken);

    await axios({
      url: provider.logout_url,
      method: "POST",
      data: params
    });
  } catch(err) {
    console.log(err);
    console.log('Unable to log out of IDP session.');
  }

  return {
    action: "redirect",
    data: provider.logout_redirect_url
  };

}

export const retrieveTokenset = async (tokensetID:string):Promise<BackendTokenset> => {
  if(!tokensetID){
    throw new BadRequestError('Field tokensetID missing.');
  }

  const tokens = await _retrieveTokenset(tokensetID);

  if(tokens){
    return {
      token: tokens.token,
      refreshToken: tokens.refreshToken
    }
  }
  else {
    throw new NotFoundError('Token set not found.');
  }

}

export const pushTokenset = async (token: string, refreshToken:string):Promise<string> => {
  const tokenset = await Tokenset.create({
    token, refreshToken
  });

  return tokenset.id;
}

async function _retrieveTokenset(tokensetID:string):Promise<ITokenset> {

  const tokenset = await Tokenset.findOneAndDelete({
    _id: tokensetID
  });

  return tokenset;
}
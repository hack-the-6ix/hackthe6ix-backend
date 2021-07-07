import {AuthorizationCode} from "simple-oauth2";
import Settings from '../models/settings/Settings';

const clientCache: {
  [key: string]: AuthorizationCode
} = {};

export const loadProvider = async (name: string, all = false): Promise<void> => {
  const settings = await Settings.findOne({}, 'openID');
  let found = false;
  if (settings) {
    for (const provider of settings['openID']['providers']) {
      if (provider['name'] === name || all) {
        found = true;
        // Build and cache the ServiceProvider and IdentityProvider as they will probably not be modified
        const tokenURL = new URL(provider.token_url);
        const authorizeURL = new URL(provider.authorization_url);
        const client = new AuthorizationCode({
            client: {
                id: provider.client_id,
                secret: provider.client_secret
            },
            auth: {
                tokenHost: tokenURL.origin,
                tokenPath: tokenURL.pathname,
                authorizePath: authorizeURL.pathname
            }
        });

        clientCache[name] = client;
      }
    }
  }

  if (!found) {
    throw Error(`Unable to load OpenID provider '${name}': Provider not found.`);
  }
};

export const fetchClient = async (provider: string): Promise<AuthorizationCode> => {
  provider = provider.toLowerCase();

  if (!Object.prototype.hasOwnProperty.call(clientCache, provider)) {
    await loadProvider(provider);
  }
  return clientCache[provider];
};

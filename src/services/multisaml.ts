import * as saml2 from 'saml2-js';
import Settings from '../models/settings/Settings';

const spCache: {
    [key: string]: saml2.ServiceProvider
} = {};

const idpCache: {
    [key: string]: saml2.IdentityProvider
} = {};

export const loadProvider = async (name: string, all=false):Promise<void> => {
    const samlInfo = await Settings.findOne({}, 'saml');
    let found = false;
    if(samlInfo){
        for(const provider of samlInfo["saml"]["providers"]){
            if(provider["name"] === name || all){
                found = true;
                // Build and cache the ServiceProvider and IdentityProvider as they will probably not be modified
                const sp = new saml2.ServiceProvider({
                    entity_id: process.env.BACKEND_HOST + `/auth/${name}/metadata.xml`,
                    private_key: Buffer.from(samlInfo["saml"]["private_key"], 'base64').toString(),
                    certificate: Buffer.from(samlInfo["saml"]["certificate"], 'base64').toString(),
                    assert_endpoint: process.env.BACKEND_HOST + `/auth/${name}/acs`,
                    sign_get_request: true
                });

                const idp = new saml2.IdentityProvider({
                    sso_login_url: provider["sso_login_url"],
                    sso_logout_url: provider["sso_logout_url"],
                    certificates: [Buffer.from(provider["idpCertificate"], 'base64').toString()]
                });

                spCache[name] = sp;
                idpCache[name] = idp;
            }
        }
    }

    if(!found){
        throw Error(`Unable to load SAML provider '${name}': Provider not found.`);
    }
};

export const fetchSP = async (provider:string): Promise<saml2.ServiceProvider> => {
    provider = provider.toLowerCase();

    if(!Object.prototype.hasOwnProperty.call(spCache, provider)){
        await loadProvider(provider);
    }
    return spCache[provider];
};

export const fetchIDP = async (provider:string): Promise<saml2.IdentityProvider> => {
    provider = provider.toLowerCase();

    if(!Object.prototype.hasOwnProperty.call(idpCache, provider)) {
        await loadProvider(provider);
    }
    return idpCache[provider];
};

export const fetchSAMLBundle = async(provider: string): Promise<{
    sp: saml2.ServiceProvider,
    idp: saml2.IdentityProvider
}> => {
    return {
        sp: await fetchSP(provider),
        idp: await fetchIDP(provider)
    }
};

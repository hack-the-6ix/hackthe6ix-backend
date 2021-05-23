import * as mongoose from "mongoose";

const SAMLProvider = {
    name: {
        type: String,
        required: true
    },
    idpCertificate: {
        type: String,
        required: true
    },
    sso_login_url: {
        type: String,
        required: true
    },
    sso_logout_url: {
        type: String,
        required: true
    }
}
export const fields = {
    saml: {
        private_key: {
            type: String,
            required: true
        },
        certificate: {
            type: String,
            required: true
        },
        providers: {
            type: [SAMLProvider]
        }
    }
}

export interface ISettings extends mongoose.Document {
    saml: {
        private_key: string,
        certificate: string,
        providers: {
            name: string,
            idpCertificate: string,
            sso_login_url: string,
            sso_logout_url: string
        }[]
    }
}
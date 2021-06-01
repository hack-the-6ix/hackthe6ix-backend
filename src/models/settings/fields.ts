import * as mongoose from 'mongoose';
import { WriteCheckRequest } from '../../types/types';
import { isOrganizer } from '../validator';

const SAMLProvider = {
  name: {
    type: String,
    required: true,
  },
  idpCertificate: {
    type: String,
    required: true,
  },
  sso_login_url: {
    type: String,
    required: true,
  },
  sso_logout_url: {
    type: String,
    required: true,
  },
};

const saml = {

  writeCheck: false,
  readCheck: false,

  FIELDS: {
    private_key: {
      type: String,
      required: true,
    },
    certificate: {
      type: String,
      required: true,
    },
    providers: {
      type: [SAMLProvider],
    },
  },
};

export const fields = {

  readCheck: true,
  writeCheck: (request: WriteCheckRequest<any>) => isOrganizer(request.requestUser) || (!request.targetObject.status.applied && request.universeState.globalApplicationOpen),

  FIELDS: {
    saml: saml,
  },
};

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

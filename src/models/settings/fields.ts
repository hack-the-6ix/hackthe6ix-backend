import * as mongoose from 'mongoose';
import { ReadCheckRequest, WriteCheckRequest } from '../../types/checker';
import { UniverseState } from '../../types/types';
import { isAdmin, isOrganizer } from '../validator';

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
    permittedRedirectHosts: {
      type: [String],
      required: true
    },
    providers: {
      type: [SAMLProvider],
    },
  },
};

/**
 * System states
 */
const universe = {

  writeCheck: (request: WriteCheckRequest<any, ISettings>) => isAdmin(request.requestUser),
  readCheck: true,

  FIELDS: {
    public: {
      readCheck: true,
      writeCheck: true,

      FIELDS: {
        globalApplicationDeadline: {
          type: Number,
          default: Date.now() + 31104000000,
          required: true,

          readCheck: true,
          writeCheck: true,
        },
        globalConfirmationDeadline: {
          type: Number,
          default: Date.now() + 31104000000,
          required: true,

          readCheck: true,
          writeCheck: true,
        },
      },

    },

    private: {

      readCheck: (request: ReadCheckRequest<ISettings>) => isOrganizer(request.requestUser),
      writeCheck: true,

      FIELDS: {
        // Only organizers know how many people will be let through
        maxAccepted: {
          type: Number,
          default: 500,
          required: true,

          readCheck: true,
          writeCheck: true,
        },

        maxWaitlist: {
          type: Number,
          default: 100,
          required: true,

          readCheck: true,
          writeCheck: true,
        },
      },
    },
  },
};

export const fields = {

  readCheck: true,
  writeCheck: (request: WriteCheckRequest<any, ISettings>) => isAdmin(request.requestUser),

  FIELDS: {
    saml: saml,

    universe: universe,
  },
};

export interface ISettings extends mongoose.Document {
  saml: {
    private_key: string,
    certificate: string,
    permittedRedirectHosts: string[],
    providers: {
      name: string,
      idpCertificate: string,
      sso_login_url: string,
      sso_logout_url: string
    }[]
  },

  universe: UniverseState
}

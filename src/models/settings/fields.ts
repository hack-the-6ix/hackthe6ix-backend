import * as mongoose from 'mongoose';
import { ReadCheckRequest, WriteCheckRequest } from '../../types/checker';
import { UniverseState } from '../../types/types';
import { isAdmin, isOrganizer } from '../validator';

const OpenIDProvider = {
  name: {
    type: String,
    required: true,
  },
  authorization_url: {
    type: String,
    required: true,
  },
  token_url: {
    type: String,
    required: true,
  },
  client_id: {
    type: String,
    required: true,
  },
  client_secret: {
    type: String,
    required: true,
  },
  callback_url: {
    type: String,
    required: true,
  },
  userinfo_url: {
    type: String,
    required: true,
  },
  logout_url: {
    type: String,
    required: true,
  },
  logout_redirect_url: {
    type: String,
    required: true,
  },
};

const openID = {

  writeCheck: false,
  readCheck: false,

  FIELDS: {
    providers: {
      type: [OpenIDProvider],
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
        globalWaitlistAcceptedConfirmationDeadline: {
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
    openID: openID,

    universe: universe,
  },
};

export interface ISettings extends mongoose.Document {
  openID: {
    providers: {
      name: string,
      authorization_url: string,
      token_url: string,
      client_id: string,
      client_secret: string,
      callback_url: string,
      userinfo_url: string,
      logout_url: string,
      logout_redirect_url: string
    }[]
  },

  universe: UniverseState
}

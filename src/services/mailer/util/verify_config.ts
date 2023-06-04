/**
 * Verified the mailer.json file is configured properly for boot
 */

import { InternalServerError } from '../../../types/errors';

export const verifyConfigEntity = (configObj: any, configObjEnum: any, entityName: string, expectedFields: string[]) => {
  if (configObj[entityName]) {
    for (const entry in configObjEnum) {
      if (!configObj[entityName][entry]) {
        throw new InternalServerError(`${entityName} "${entry}" was not found in the config!\nPlease check README.md for information about setting up config`);
      }

      for (const field of expectedFields) {
        if (!configObj[entityName][entry][field]) {
          throw new InternalServerError(`Field "${field}" was not found in the config for ${entry}!\nPlease check README.md for information about setting up config`);
        }
      }
    }
  } else {
    throw new InternalServerError('MailTemplate is falsy!\nPlease check README.md for information about setting up config');
  }
};

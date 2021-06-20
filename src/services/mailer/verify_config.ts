/**
 * Verified the mailer.json file is configured properly for boot
 */

import { InternalServerError } from '../../types/errors';
import { Lists, Templates } from '../../types/mailer';
import { mailerConfig } from './external';

const verifyConfigEntity = (configObj: any, configObjEnum: any, entityName: string, expectedFields: string[]) => {
  if (configObj[entityName]) {
    for (const entry in configObjEnum) {
      if (!configObj[entityName][entry]) {
        throw new InternalServerError(`${entityName} "${entry}" was not found in the config!`);
      }

      for (const field of expectedFields) {
        if (!configObj[entityName][entry][field]) {
          throw new InternalServerError(`Field "${field}" was not found in the config for ${entry}!`);
        }
      }
    }
  } else {
    throw new InternalServerError('Templates is falsy!');
  }
};

if (mailerConfig) {

  // Verify templates
  verifyConfigEntity(mailerConfig, Templates, 'templates', ['subject', 'templateID']);

  // Verify mailing lists
  verifyConfigEntity(mailerConfig, Lists, 'lists', []);

} else {
  throw new InternalServerError('Mailer Config is falsy!');
}

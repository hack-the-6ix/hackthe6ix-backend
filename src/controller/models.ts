import { fields as settingsFields } from '../models/settings/fields';
import Settings from '../models/settings/Settings';
import { fields as userFields } from '../models/user/fields';
import User from '../models/user/User';

export default {
  user: {
    mongoose: User,
      rawFields: userFields,
  },
  settings: {
    mongoose: Settings,
      rawFields: settingsFields,
  },
}

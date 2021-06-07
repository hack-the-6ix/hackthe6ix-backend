import { fields as settingsFields } from '../models/settings/fields';
import Settings from '../models/settings/Settings';
import { fields as userFields } from '../models/user/fields';
import User from '../models/user/User';
import { UniverseState } from '../types/types';

const models = {
  user: {
    mongoose: User,
      rawFields: userFields,
  },
  settings: {
    mongoose: Settings,
      rawFields: settingsFields,
  },
};

export const getModels = () => models;

/**
 * Fetch metadata about the universe first that might be necessary for making validation decisions
 * e.g. whether applications are currently open, etc.
 */
export const fetchUniverseState = async (): Promise<UniverseState> => {
  const settings = await Settings.findOne({}) || { universe: {} as UniverseState };
  return settings.universe;
};

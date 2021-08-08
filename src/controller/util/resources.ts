/**
 * NOTE: This module is mocked for the unit tests, so do NOT put anything in here that won't be
 *       mocked.
 */

import APIToken from '../../models/apitoken/APIToken';
import { fields as apiTokenFields } from '../../models/apitoken/fields';
import ExternalUser from '../../models/externaluser/ExternalUser';
import { fields as externalUserFields } from '../../models/externaluser/fields';
import { fields as meetingFields } from '../../models/meeting/fields';
import Meeting from '../../models/meeting/Meeting';
import { fields as meetingAttendanceFields } from '../../models/meetingattendance/fields';
import MeetingAttendance from '../../models/meetingattendance/MeetingAttendance';
import { fields as settingsFields, ISettings } from '../../models/settings/fields';
import Settings from '../../models/settings/Settings';
import { fields as teamFields } from '../../models/team/fields';
import Team from '../../models/team/Team';
import { fields as userFields } from '../../models/user/fields';
import User from '../../models/user/User';
import { UniverseState } from '../../types/types';

export const getModels = () => ({
  user: {
    mongoose: User,
    rawFields: userFields,
  },
  settings: {
    mongoose: Settings,
    rawFields: settingsFields,
  },
  team: {
    mongoose: Team,
    rawFields: teamFields,
  },
  externaluser: {
    mongoose: ExternalUser,
    rawFields: externalUserFields,
  },
  apitoken: {
    mongoose: APIToken,
    rawFields: apiTokenFields,
  },
  meeting: {
    mongoose: Meeting,
    rawFields: meetingFields,
  },
  meetingattendance: {
    mongoose: MeetingAttendance,
    rawFields: meetingAttendanceFields,
  },
});

/**
 * Fetch metadata about the universe first that might be necessary for making validation decisions
 * e.g. whether applications are currently open, etc.
 */
export const fetchUniverseState = async (): Promise<UniverseState> => {
  const settings = await Settings.findOne({}) || { universe: {} as UniverseState };
  return settings.universe;
};

/**
 * Sometimes mongoose decides to execute the getter for virtual fields without actually populating
 * it, so we end up with an empty user object. This ensures that we end up with a valid universe
 * object, even if it's falsy.
 */
export const extractUniverse = (settings: ISettings) => settings?.universe || ({ public: {} } as UniverseState);

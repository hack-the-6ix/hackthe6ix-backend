import { ITeam } from '../models/team/fields';
import Team from '../models/team/Team';
import { IUser } from '../models/user/fields';
import User from '../models/user/User';
import { AlreadyInTeamError, InternalServerError, UnknownTeamError } from '../types/types';
import { getObject } from './ModelController';
import { testCanUpdateApplication } from './util/checker';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new team + add the request user to it.
 *
 * The return object is the team object
 *
 * @param requestUser
 */
export const createTeam = async (requestUser: IUser) => {
  await testCanUpdateApplication(requestUser);

  if (requestUser.hackerApplication.teamCode?.length > 0) {
    throw new AlreadyInTeamError();
  }

  const code = uuidv4().substring(0, 8);

  const newTeam = await Team.create({
    code: code,
    memberIDs: [
      requestUser._id
    ]
  });

  // Update user object
  await User.findOneAndUpdate({
    _id: requestUser._id
  }, {
    'hackerApplication.teamCode': newTeam.code
  });

  // We must use getObject to ensure the user fields are correctly intercepted
  const sanitizedTeam = await getObject(requestUser, 'team', {
    filter: {
      _id: newTeam._id
    }
  });

  if (!sanitizedTeam || sanitizedTeam.length !== 1) {
    throw new InternalServerError("Unable to fetch new team");
  }

  return sanitizedTeam[0] as ITeam;
};

/**
 * Add requestUser to the team specified if there is enoughr oom
 *
 * @param requestUser
 * @param teamCode
 */
export const joinTeam = async (requestUser: IUser, teamCode: string) => {
  await testCanUpdateApplication(requestUser);

  if (requestUser.hackerApplication.teamCode?.length > 0) {
    throw new AlreadyInTeamError();
  }

};

/**
 * Remove requestUser from their current team. If they are the last member,
 * the team will be deleted.
 *
 * @param requestUser
 */
export const leaveTeam = async (requestUser: IUser) => {
  await testCanUpdateApplication(requestUser);

  if (!requestUser.hackerApplication.teamCode || requestUser.hackerApplication.teamCode.length === 0) {
    throw new UnknownTeamError();
  }

};

/**
 * Return the team associated with the requestUser
 *
 * @param requestUser
 */
export const getTeam = async (requestUser: IUser) => {

  if (!requestUser.hackerApplication.teamCode || requestUser.hackerApplication.teamCode.length === 0) {
    throw new UnknownTeamError();
  }

};

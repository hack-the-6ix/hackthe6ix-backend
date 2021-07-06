import { v4 as uuidv4 } from 'uuid';
import { ITeam } from '../models/team/fields';
import Team from '../models/team/Team';
import { IUser } from '../models/user/fields';
import User from '../models/user/User';
import {
  AlreadyInTeamError,
  BadRequestError,
  InternalServerError,
  TeamFullError,
  UnknownTeamError,
} from '../types/errors';
import { getObject } from './ModelController';
import { testCanUpdateTeam } from './util/checker';

const getSanitizedTeam = async (requestUser: IUser, teamCode: string) => {
  // We must use getObject to ensure the user fields are correctly intercepted
  const sanitizedTeam = await getObject(requestUser, 'team', {
    filter: {
      code: teamCode,
    },
  });

  if (!sanitizedTeam || sanitizedTeam.length !== 1) {
    throw new InternalServerError('Unable to fetch new team');
  }

  return sanitizedTeam[0] as ITeam;
};

/**
 * Creates a new team + add the request user to it.
 *
 * The return object is the team object
 *
 * @param requestUser
 */
export const createTeam = async (requestUser: IUser) => {
  await testCanUpdateTeam(requestUser);

  if (requestUser.hackerApplication.teamCode?.length > 0) {
    throw new AlreadyInTeamError();
  }

  const code = uuidv4().substring(0, 8);

  const newTeam = await Team.create({
    code: code,
    memberIDs: [
      requestUser._id,
    ],
  });

  // Update user object
  await User.findOneAndUpdate({
    _id: requestUser._id,
  }, {
    'hackerApplication.teamCode': newTeam.code,
  });

  return await getSanitizedTeam(requestUser, code);
};

/**
 * Add requestUser to the team specified if there is enoughr oom
 *
 * @param requestUser
 * @param teamCode
 */
export const joinTeam = async (requestUser: IUser, teamCode: string) => {
  if (!teamCode) {
    throw new BadRequestError('Invalid team code!');
  }

  await testCanUpdateTeam(requestUser);

  if (requestUser.hackerApplication.teamCode?.length > 0) {
    throw new AlreadyInTeamError();
  }

  const team = await Team.findOne({
    code: teamCode,
  });

  if (!team) {
    throw new UnknownTeamError('Invalid team code!');
  }

  if (team.memberIDs.length >= 4) {
    throw new TeamFullError();
  }

  // Update team object
  await Team.findOneAndUpdate({
    code: teamCode,
  }, {
    $push: {
      memberIDs: requestUser._id,
    },
  });

  // Update user object
  await User.findOneAndUpdate({
    _id: requestUser._id,
  }, {
    'hackerApplication.teamCode': teamCode,
  });

  return await getSanitizedTeam(requestUser, teamCode);
};

/**
 * Remove requestUser from their current team. If they are the last member,
 * the team will be deleted.
 *
 * @param requestUser
 */
export const leaveTeam = async (requestUser: IUser) => {
  await testCanUpdateTeam(requestUser);

  if (!requestUser.hackerApplication.teamCode || requestUser.hackerApplication.teamCode.length === 0) {
    throw new UnknownTeamError();
  }

  // Update user object
  await User.findOneAndUpdate({
    _id: requestUser._id,
  }, {
    'hackerApplication.teamCode': undefined,
  });

  // Update team object
  const updatedTeam = await Team.findOneAndUpdate({
    code: requestUser.hackerApplication.teamCode,
  }, {
    $pull: {
      memberIDs: requestUser._id,
    },
  }, {
    new: true,
  });

  // Delete team if no users are left
  if (updatedTeam.memberIDs.length === 0) {
    await Team.findOneAndRemove({
      code: requestUser.hackerApplication.teamCode,
    });
  }

  return 'Success';
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

  return await getSanitizedTeam(requestUser, requestUser.hackerApplication.teamCode);
};

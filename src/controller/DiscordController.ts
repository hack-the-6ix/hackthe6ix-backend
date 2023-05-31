import ExternalUser from '../models/externaluser/ExternalUser';
import { IRoles, IUser } from '../models/user/fields';
import User from '../models/user/User';
import { BadRequestError, NotFoundError } from '../types/errors';
import { BasicUser, DiscordVerifyInfo } from '../types/types';

const _assembleReturnInfo = (userInfo: BasicUser): DiscordVerifyInfo => {
  const returnInfo = {
    firstName: userInfo.firstName,
    lastName: userInfo.lastName,
    email: userInfo.email,
    roles: [],
  } as DiscordVerifyInfo;

  if (userInfo.discord?.suffix !== undefined) {
    returnInfo.suffix = userInfo.discord.suffix;
  }

  if (Array.isArray(userInfo.discord?.additionalRoles)) {
    returnInfo.roles.push(...userInfo.discord.additionalRoles);
  }

  const fullUser = userInfo as IUser;

  if (fullUser.roles) {
    for (const roleName of Object.keys(fullUser.roles)) {
      if (fullUser.roles[roleName as keyof IRoles] && roleName !== '$init') {
        returnInfo.roles.push(roleName);
      }
    }
  }

  return returnInfo;
};

export const verifyDiscordUser = async (email: string, discordID: string, discordUsername: string, timeOverride?: number): Promise<DiscordVerifyInfo> => {
  if (!email || !discordID) {
    throw new BadRequestError('email and discordID fields are required.');
  }

  const queryFilters = [
    {
      email: email.toLowerCase(),
    },
    {
      $or: [
        {
          'discord.discordID': discordID,
        }, {
          'discord.discordID': {
            $exists: false,
          },
        },
      ],
    },
  ];

  let userInfo: BasicUser | null = await User.findOneAndUpdate({
    $and: [{
      'groups.admin': false,
    }, {
      'groups.organizer': false,
    }, {
      'status.confirmed': true,
    }, ...queryFilters],
  }, {
    'discord.discordID': discordID,
    'discord.username': discordUsername,
    'discord.verifyTime': timeOverride || Date.now(),
    'status.checkedIn': true,
  });

  if (userInfo) {
    return _assembleReturnInfo(userInfo);
  } else {
    userInfo = await ExternalUser.findOneAndUpdate({
      $and: queryFilters,
    }, {
      'discord.discordID': discordID,
      'discord.username': discordUsername,
      'discord.verifyTime': timeOverride || Date.now(),
    });

    if (!userInfo) {
      throw new NotFoundError('No user found with the given email or the account has already been linked.');
    }

    return _assembleReturnInfo(userInfo);
  }
};
import User from '../models/user/User';
import {IUser, IRoles} from '../models/user/fields';
import ExternalUser from '../models/externaluser/ExternalUser';
import { BasicUser, DiscordVerifyInfo } from '../types/types';
import { BadRequestError, NotFoundError } from '../types/errors';

const _assembleReturnInfo = (userInfo:BasicUser):DiscordVerifyInfo => {
    const returnInfo = {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userInfo.email,
        suffix: userInfo.discord?.suffix,
        roles: []
    } as DiscordVerifyInfo;

    if(Array.isArray(userInfo.discord?.additionalRoles)){
        returnInfo.roles.push(...userInfo.discord.additionalRoles);
    }

    const fullUser = userInfo as IUser;

    if(fullUser.roles){
        for(const roleName of Object.keys(fullUser.roles)){
            if(fullUser.roles[roleName as keyof IRoles]){
                returnInfo.roles.push(roleName);
            }
        }
    }

    return returnInfo;
}

export const fetchUserInfo = async (email: string):Promise<DiscordVerifyInfo> => {
    let userInfo:BasicUser = await User.findOne({
        email: email
    })

    if(!userInfo) {
        userInfo = await ExternalUser.findOne({
            email: email
        })
    }

    if(!userInfo) {
        throw new NotFoundError('No user found with the given email.');
    }
    
    return _assembleReturnInfo(userInfo);
}

export const verifyDiscordUser = async (email: string, discordID: string, discordUsername: string):Promise<DiscordVerifyInfo> => {
    if(!email || !discordID){
        throw new BadRequestError("email and discordID fields are required.");
    }

    const queryFilters = [
        {
            email: email
        },
        {
            $or: [
                {
                    "discord.discordID": discordID
                },{
                    "discord.discordID": {
                        $exists: false
                    }
                }
            ]
        }
    ]

    let userInfo:BasicUser = await User.findOneAndUpdate({
        $and: [{
            $or: [
                {
                    "groups.admin": true
                },{
                    "groups.organizer": true
                }, {
                    "status.confirmed": true
                }
            ]
        }, ...queryFilters]
    }, {
        "discord.discordID": discordID,
        "discord.username": discordUsername,
        "discord.verifyTime": Date.now()
    })

    if(userInfo){
        return _assembleReturnInfo(userInfo);
    }
    else {
        userInfo = await ExternalUser.findOneAndUpdate({
            $and: queryFilters
        }, {
            "discord.discordID": discordID,
            "discord.username": discordUsername,
            "discord.verifyTime": Date.now()
        })

        if(!userInfo) {
            throw new NotFoundError('No user found with the given email or the account has already been linked.');
        }

        return _assembleReturnInfo(userInfo);
    }
}

/**
 * Retrieves a user from their Discord ID
 *
 * @param discordID
 */
 export const fetchUserByDiscordID = async(discordID: string): Promise<BasicUser> => {
    if(!discordID) {
        throw new BadRequestError("No discordID given.");
    }
    let userInfo:BasicUser = await User.findOne({
        "discord.discordID": discordID
    });
  
    if(!userInfo) {
        userInfo = await ExternalUser.findOne({
            "discord.discordID": discordID
        });
    }
  
    if(!userInfo) {
        throw new NotFoundError('No user found with the given email.');
    }
  
    return userInfo;
  }
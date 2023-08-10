import {mongoose} from '../services/mongoose_service';
import {IUser} from "../models/user/fields";
import {IExternalUser} from "../models/externaluser/fields";
import {Model} from "mongoose";

export type ErrorMessage = { status: number, message: string, error?: string };
export type DiscordSyncState = "SUCCESS" | "SOFTFAIL" | "HARDFAIL";

/**
 * Status of the universe
 */
export type UniverseState = {
  public: {
    globalApplicationOpen: number,
    globalApplicationDeadline: number,
    globalConfirmationDeadline: number,
    globalWaitlistAcceptedConfirmationDeadline: number
  },
  private: {
    maxAccepted: number,
    maxWaitlist: number,
  }
}

export interface IRSVP {
  attending: boolean,
  form: Record<string, any>
}

export interface BasicUser extends mongoose.Document {
  firstName: string,
  lastName: string,
  email: string,
  checkInQR: string,
  checkInTime?: number,
  discord: {
    discordID?: string,
    username?: string,
    verifyTime?: number,
    additionalRoles?: string[],
    suffix?: string,
    accessToken?: string,
    accessTokenExpireTime?: number,
    refreshToken?: string,
    lastSyncTime?: number,
    lastSyncStatus?: DiscordSyncState
  },
  checkInNotes: string[]
}

export interface DiscordVerifyInfo {
  suffix?: string,
  roles: string[],
  firstName: string,
  lastName: string,
  email: string
}

export type AllUserTypes = "User" | "ExternalUser"
export type AllUserTypeInterfaces = IUser | IExternalUser
export type AllUserTypeModels = Model<IUser> | Model<IExternalUser>

export interface QRCodeGenerateRequest {
  userID: string,
  userType: AllUserTypes
}

export interface QRCodeGenerateBulkResponse {
  userID: string,
  userType: AllUserTypes,
  code: string
}
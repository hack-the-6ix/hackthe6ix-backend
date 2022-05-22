import mongoose from '../services/mongoose_service';
import {IUser} from "../models/user/fields";
import {IExternalUser} from "../models/externaluser/fields";
import {Model} from "mongoose";

export type ErrorMessage = { status: number, message: string, error?: string };

/**
 * Status of the universe
 */
export type UniverseState = {
  public: {
    globalApplicationDeadline: number,
    globalConfirmationDeadline: number,
    globalWaitlistAcceptedConfirmationDeadline: number,
  },
  private: {
    maxAccepted: number,
    maxWaitlist: number,
  }
}

export interface IRSVP {
  attending: boolean
}

export interface BasicUser extends mongoose.Document {
  firstName: string,
  lastName: string,
  email: string,
  checkInQR: string,
  discord: {
    discordID?: string,
    username?: string,
    verifyTime?: number,
    additionalRoles?: string[],
    suffix?: string
  }
}

export interface DiscordVerifyInfo {
  suffix?: string,
  roles?: string[],
  firstName: string,
  lastName: string,
  email: string
}

export type AllUserTypes = "User" | "ExternalUser"
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
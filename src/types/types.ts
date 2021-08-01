import mongoose from "../services/mongoose_service";

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

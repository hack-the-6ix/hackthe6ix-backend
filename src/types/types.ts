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

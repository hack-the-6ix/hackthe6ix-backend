import Request from 'express';

/**
 * message - user facing message (do not include confidential information)
 * stacktrace - full stack trace sent to logger
 */
export type Callback = (error: { code: number, message: string, stacktrace?: string }, data?: any) => void;

/**
 * We will inject the executor user's object into the request
 */
export interface UserRequest extends Request {
  executor: any
}

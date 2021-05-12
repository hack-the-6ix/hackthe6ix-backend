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

/**
 * When writing a model, this object is passed onto the validator
 */
export type WriteCheckRequest<T> = {
  value: T,
  requestUser: any,
  targetUser: any,
  universeState: any
}

/**
 * Passed into the write interceptor
 */
export type WriteInterceptRequest<T> = WriteCheckRequest<T>;

/**
 * When reading a model, this object is passed onto the verifier
 */
export type ReadCheckRequest = {
  requestUser: any,
  targetUser: any,
  universeState: any
}

/**
 * Passed into the read interceptor
 */
export type ReadInterceptRequest<T> = WriteCheckRequest<T>;

/**
 * When deleting a model, this object is passed onto the verifier
 */
export type DeleteCheckRequest = {
  requestUser: any,
  targetUser: any,
  universeState: any
}


/*
 * TODO: Add a state for model creation? I don't think we really need it right now
 */

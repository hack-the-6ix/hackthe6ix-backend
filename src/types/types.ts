import Request from 'express';
import { IUser } from '../models/user/fields';

export type ErrorMessage = { status: number, message: string, stacktrace?: string };

/**
 * message - user facing message (do not include confidential information)
 * stacktrace - full stack trace sent to logger
 */
export type Callback = (error: ErrorMessage, data?: any) => void;

/**
 * We will inject the executor user's object into the request
 */
export interface UserRequest extends Request {
  executor: any
}

/**
 * Status of the universe
 */
export type UniverseState = {
  public: {
    globalApplicationDeadline: number,
    globalConfirmationDeadline: number,
  },
  private: {
    maxAccepted: number,
    maxWaitlist: number,
  }
}

/**
 * When writing a model, this object is passed onto the validator
 */
export type WriteCheckRequest<T, O> = {
  fieldValue: T,      // Field we're updating
  requestUser: IUser,   // User producing the request
  targetObject: O,   // State of the object we're modifying (the entire raw object)
  universeState: UniverseState  // External variables that may be relevant to us
}

/**
 * Passed into the write interceptor
 */
export type WriteInterceptRequest<T, O> = WriteCheckRequest<T, O>;

/**
 * When reading a model, this object is passed onto the verifier
 */
export type ReadCheckRequest<O> = {
  requestUser: IUser,
  targetObject: O,
  universeState: UniverseState
}

/**
 * Passed into the read interceptor
 */
export type ReadInterceptRequest<T, O> = WriteCheckRequest<T, O>;

/**
 * When deleting a model, this object is passed onto the verifier
 */
export type DeleteCheckRequest<O> = {
  requestUser: IUser,
  targetObject: O,
  universeState: UniverseState
}

/**
 * When creating a model, this object is passed onto the verifier
 */
export type CreateCheckRequest<T> = {
  fieldValue: T,      // Field we're updating
  requestUser: IUser,
  universeState: UniverseState
}

export class CreateDeniedException extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, CreateDeniedException.prototype);
  }
}

export class WriteDeniedException extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, WriteDeniedException.prototype);
  }
}

export class DeleteDeniedException extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, DeleteDeniedException.prototype);
  }
}

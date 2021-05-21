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
 * Status of the universe
 */
export type UniverseState = {
  globalApplicationOpen: boolean
}

/**
 * When writing a model, this object is passed onto the validator
 */
export type WriteCheckRequest<T> = {
  fieldValue: T,      // Field we're updating
  requestUser: any,   // User producing the request
  targetObject: any,   // State of the object we're modifying (the entire raw object)
  universeState: UniverseState  // External variables that may be relevant to us
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
  targetObject: any,
  universeState: UniverseState
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
  targetObject: any,
  universeState: UniverseState
}

/**
 * When creating a model, this object is passed onto the verifier
 */
export type CreateCheckRequest<T> = {
  fieldValue: T,      // Field we're updating
  requestUser: any,
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

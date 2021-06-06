import Request from 'express';
import { IUser } from '../models/user/fields';

export type ErrorMessage = { status: number, message: string, stacktrace?: string };

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

/**
 * Corresponds to HTTP error codes
 */
export class HTTPError extends Error {
  status: number;
  stacktrace: string;
  message: string;
  name: string;

  constructor(name: string, status: number, message: string, stacktrace?: string | Error) {
    super(`${name} - ${message || 'An error occurred'}\n${stacktrace}`);
    this.status = status;
    this.stacktrace = (stacktrace || '').toString();
    this.message = message;
    this.name = name;
  }
}

export class InternalServerError extends HTTPError {
  constructor(message?: string, stacktrace?: string | Error) {
    super('InternalServerError', 500, message, stacktrace);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export class BadRequestError extends HTTPError {
  constructor(message?: string, stacktrace?: string | Error) {
    super('BadRequest', 400, message, stacktrace);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends HTTPError {
  constructor(message?: string, stacktrace?: string | Error) {
    super('Unauthorized', 401, message, stacktrace);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends HTTPError {
  constructor(message?: string, stacktrace?: string | Error) {
    super('Forbidden', 403, message, stacktrace);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends HTTPError {
  constructor(message?: string, stacktrace?: string | Error) {
    super('Not Found', 404, message, stacktrace);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class CreateDeniedError extends ForbiddenError {
  constructor(stacktrace: string) {
    super("Create Denied", stacktrace);
    Object.setPrototypeOf(this, CreateDeniedError.prototype);
  }
}

export class WriteDeniedError extends ForbiddenError {
  constructor(stacktrace: string) {
    super("Write Denied", stacktrace);
    Object.setPrototypeOf(this, WriteDeniedError.prototype);
  }
}

export class DeleteDeniedError extends ForbiddenError {
  constructor(stacktrace: string) {
    super("Delete Denied", stacktrace);
    Object.setPrototypeOf(this, DeleteDeniedError.prototype);
  }
}

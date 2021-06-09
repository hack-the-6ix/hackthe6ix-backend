import Request from 'express';
import { IUser } from '../models/user/fields';

export type ErrorMessage = { status: number, message: string, error?: string };

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
  submissionObject: O, // Object we are submitting
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
export type ReadInterceptRequest<T, O> = {
  fieldValue: T,      // Field we're updating
  requestUser: IUser,   // User producing the request
  targetObject: O,   // State of the object we're modifying (the entire raw object)
  universeState: UniverseState  // External variables that may be relevant to us
};

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
export type CreateCheckRequest<T, O> = {
  fieldValue: T,      // Field we're updating
  requestUser: IUser,
  submissionObject: O, // Object we are submitting
  universeState: UniverseState
}

/**
 * Corresponds to HTTP error codes
 */
export class HTTPError extends Error {
  status: number;
  error: any;
  publicMessage: string;
  name: string;
  errorIsPublic: boolean;

  constructor(name: string, status: number, message: string, error?: any, errorIsPublic?: boolean) {
    super(`${message || 'An error occurred'}\n${error}`);
    this.status = status;
    this.error = error || '';
    this.publicMessage = message;
    this.name = name;
    this.errorIsPublic = errorIsPublic;
  }
}

export class InternalServerError extends HTTPError {
  constructor(message?: string, error?: any, errorIsPublic?: boolean) {
    super('InternalServerError', 500, message, error, errorIsPublic);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export class BadRequestError extends HTTPError {
  constructor(message?: string, error?: any, errorIsPublic?: boolean) {
    super('BadRequest', 400, message, error, errorIsPublic);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends HTTPError {
  constructor(message?: string, error?: any, errorIsPublic?: boolean) {
    super('Unauthorized', 401, message, error, errorIsPublic);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends HTTPError {
  constructor(message?: string, error?: any, errorIsPublic?: boolean) {
    super('Forbidden', 403, message, error, errorIsPublic);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends HTTPError {
  constructor(message?: string, error?: any, errorIsPublic?: boolean) {
    super('Not Found', 404, message, error, errorIsPublic);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class CreateDeniedError extends ForbiddenError {
  constructor(policy: any, request: CreateCheckRequest<any, any>) {
    super('Create Denied', `Create check failed with policy ${policy}\n    and request ${JSON.stringify(request, null, 2)}`);
    Object.setPrototypeOf(this, CreateDeniedError.prototype);
  }
}

export class WriteDeniedError extends ForbiddenError {
  constructor(fieldMetadata: any, policy: any, request: WriteCheckRequest<any, any>) {
    super('Write Denied', `Write check failed at field: ${JSON.stringify(fieldMetadata)}\n    with policy ${policy}\n    and request:\n${JSON.stringify(request, null, 2)}`);
    Object.setPrototypeOf(this, WriteDeniedError.prototype);
  }
}

export class SubmissionDeniedError extends ForbiddenError {
  constructor(errors: string[]) {
    super('Submission Denied', errors, true);
    Object.setPrototypeOf(this, SubmissionDeniedError.prototype);
  }
}

export class DeleteDeniedError extends ForbiddenError {
  constructor(policy: any, request: DeleteCheckRequest<any>) {
    super('Delete Denied', `Delete check failed with policy ${policy}\n    and request ${JSON.stringify(request, null, 2)}`);
    Object.setPrototypeOf(this, DeleteDeniedError.prototype);
  }
}

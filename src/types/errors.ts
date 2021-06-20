import { CreateCheckRequest, DeleteCheckRequest, WriteCheckRequest } from './checker';

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

export class ForbiddenError extends HTTPError {
  constructor(message?: string, error?: any, errorIsPublic?: boolean) {
    super('Forbidden', 403, message, error, errorIsPublic);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
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
  constructor(errors: any) {
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

export class DeadlineExpiredError extends ForbiddenError {
  constructor(message?: string, error?: any, errorIsPublic?: boolean) {
    super(message || 'Deadline Expired', error, errorIsPublic);
    Object.setPrototypeOf(this, DeadlineExpiredError.prototype);
  }
}

export class AlreadySubmittedError extends ForbiddenError {
  constructor(message?: string, error?: any, errorIsPublic?: boolean) {
    super(message || 'Form already submitted', error, errorIsPublic);
    Object.setPrototypeOf(this, AlreadySubmittedError.prototype);
  }
}

export class AlreadyInTeamError extends ForbiddenError {
  constructor(message?: string, error?: any, errorIsPublic?: boolean) {
    super(message || 'You are already in a team!', error, errorIsPublic);
    Object.setPrototypeOf(this, AlreadyInTeamError.prototype);
  }
}

export class UnknownTeamError extends ForbiddenError {
  constructor(message?: string, error?: any, errorIsPublic?: boolean) {
    super(message || 'You are not in a team!', error, errorIsPublic);
    Object.setPrototypeOf(this, UnknownTeamError.prototype);
  }
}

export class TeamFullError extends ForbiddenError {
  constructor(message?: string, error?: any, errorIsPublic?: boolean) {
    super(message || 'Unable to join - team is full!', error, errorIsPublic);
    Object.setPrototypeOf(this, TeamFullError.prototype);
  }
}

export class RSVPRejectedError extends ForbiddenError {
  constructor(message?: string, error?: any, errorIsPublic?: boolean) {
    super(message || 'You are not eligible to RSVP!', error, errorIsPublic);
    Object.setPrototypeOf(this, RSVPRejectedError.prototype);
  }
}

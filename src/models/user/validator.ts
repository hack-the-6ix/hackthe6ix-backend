/* Permissions */

// Admins can do anything and bypass validation
import { IRequestUser, WriteCheckRequest } from '../../types/types';

export const isAdmin = (requestUser: IRequestUser) => requestUser.jwt.roles.organizer;

export const isUserOrAdmin = (requestUser: IRequestUser, targetUser: any) => isAdmin(requestUser) || (requestUser._id && requestUser._id.equals(targetUser._id));

/* Value properties */
export const maxLength = (maxLength: number) => (request: WriteCheckRequest<string | any[]>) => request.fieldValue && request?.fieldValue.length <= maxLength;
export const minLength = (minLength: number) => (request: WriteCheckRequest<string | any[]>) => request.fieldValue && request?.fieldValue.length >= minLength;

// Validate that all selections are valid
export const multiInEnum = (validStates: string[]) => (request: WriteCheckRequest<string[]>) => {
  for (const x of request?.fieldValue || []) {
    if (validStates.indexOf(x) == -1) {
      return false;
    }
  }

  return true;
};

export const inEnum = (validStates: string[]) => (request: WriteCheckRequest<string>) => validStates.indexOf(request?.fieldValue) != -1;

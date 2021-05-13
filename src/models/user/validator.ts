/* Permissions */

// Admins can do anything and bypass validation
import { WriteCheckRequest } from '../../types/types';

export const isAdmin = (requestUser: any) => requestUser.jwt.roles.organizer;

export const isUserOrAdmin = (requestUser: any, targetUser: any) =>
  isAdmin(requestUser) || requestUser._id == targetUser._id;

/* Value properties */
export const maxLength = (maxLength: number) => (request: WriteCheckRequest<string | any[]>) => request.value && request?.value.length <= maxLength;
export const minLength = (minLength: number) => (request: WriteCheckRequest<string | any[]>) => request.value && request?.value.length >= minLength;

// Validate that all selections are valid
export const multiInEnum = (validStates: string[]) => (request: WriteCheckRequest<string[]>) => {
  for (const x of request?.value || []) {
    if (validStates.indexOf(x) == -1) {
      return false;
    }
  }

  return true;
};

export const inEnum = (validStates: string[]) => (request: WriteCheckRequest<string>) => validStates.indexOf(request?.value) != -1;

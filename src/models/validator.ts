/* Permissions */

// Admins can do anything and bypass validation
import { WriteCheckRequest } from '../types/types';
import { IUser } from './user/fields';

export const isAdmin = (requestUser: IUser) => requestUser.roles.admin;
export const isOrganizer = (requestUser: IUser) => requestUser.roles.organizer;
export const isVolunteer = (requestUser: IUser) => requestUser.roles.volunteer;

export const isUserOrOrganizer = (requestUser: IUser, targetUser: IUser) => isOrganizer(requestUser) || (requestUser._id && requestUser._id.equals(targetUser._id));

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

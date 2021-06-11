/* Permissions */

// Admins can do anything and bypass validation
import { WriteCheckRequest } from '../types/types';
import { IUser } from './user/fields';

export const isAdmin = (requestUser: IUser) => requestUser.roles.admin;
export const isOrganizer = (requestUser: IUser) => requestUser.roles.organizer;
export const isVolunteer = (requestUser: IUser) => requestUser.roles.volunteer;
export const isUser = (requestUser: IUser, targetUser: IUser) => requestUser._id && requestUser._id.equals(targetUser._id);

export const isUserOrOrganizer = (requestUser: IUser, targetUser: IUser) => isOrganizer(requestUser) || isUser(requestUser, targetUser);

/* Value properties */
export const maxLength = (maxLength: number) => (request: WriteCheckRequest<string | any[], any>) => !request.fieldValue || request?.fieldValue.length <= maxLength;
export const minLength = (minLength: number) => (request: WriteCheckRequest<string | any[], any>) => request.fieldValue && request?.fieldValue.length >= minLength;

export const maxWordLength = (maxLength: number) => (request: WriteCheckRequest<string, any>) => !request.fieldValue || request?.fieldValue?.split(' ').length <= maxLength;
export const minWordLength = (minLength: number) => (request: WriteCheckRequest<string, any>) => request.fieldValue && request?.fieldValue?.split(' ').length >= minLength;

// Validate that all selections are valid
export const multiInEnum = (validStates: string[]) => (request: WriteCheckRequest<string[], any>) => {
  for (const x of request?.fieldValue || []) {
    if (validStates.indexOf(x) == -1) {
      return false;
    }
  }

  return true;
};

export const inEnum = (validStates: string[]) => (request: WriteCheckRequest<string, any>) => validStates.indexOf(request?.fieldValue) != -1;

export const isApplied = (request: WriteCheckRequest<any, IUser>) => request.requestUser.status.applied;
export const isApplicationOpen = (request: WriteCheckRequest<any, IUser>) => request.universeState.public.globalApplicationDeadline >= new Date().getTime() || request.requestUser.personalApplicationDeadline >= new Date().getTime();

export const canUpdateApplication = () => (request: WriteCheckRequest<any, IUser>) =>
  isOrganizer(request.requestUser) ||
  (
    isUser(request.requestUser, request.targetObject) &&
    !isApplied(request) &&
    isApplicationOpen(request)
  );

export const validatePostalCode = () => (request: WriteCheckRequest<string, any>) => !!request.fieldValue?.match(/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i);

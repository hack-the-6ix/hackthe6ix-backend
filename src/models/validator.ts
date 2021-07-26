/* Permissions */

import { WriteCheckRequest } from '../types/checker';
// Admins can do anything and bypass validation
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

/**
 * @param validStates
 * @param unstrict - when true, falsy values will pass the test
 */
export const inEnum = (validStates: string[], unstrict?: boolean) => (request: WriteCheckRequest<string, any>) => (unstrict && !request?.fieldValue) || validStates.indexOf(request?.fieldValue) != -1;

export const isApplied = (request: WriteCheckRequest<any, IUser>) => request?.requestUser?.status?.applied;
export const isDeclined = (request: WriteCheckRequest<any, IUser>) => request?.requestUser?.status?.declined;

// NOTE: Personal deadlines will override global deadlines if they are set.
export const getApplicationDeadline = (request: WriteCheckRequest<any, IUser>) => request.requestUser.personalApplicationDeadline === undefined ? request.universeState.public.globalApplicationDeadline : request.requestUser.personalApplicationDeadline;
export const getConfirmationDeadline = (request: WriteCheckRequest<any, IUser>) => request.requestUser.personalConfirmationDeadline === undefined ? request.universeState.public.globalConfirmationDeadline : request.requestUser.personalConfirmationDeadline;

export const isApplicationOpen = (request: WriteCheckRequest<any, IUser>) => getApplicationDeadline(request) >= new Date().getTime();
export const isConfirmationOpen = (request: WriteCheckRequest<any, IUser>) => getConfirmationDeadline(request) >= new Date().getTime();

export const canUpdateApplication = () => (request: WriteCheckRequest<any, IUser>) => (
  !isApplied(request) &&
  isApplicationOpen(request)
);

export const canConfirm = () => (request: WriteCheckRequest<any, IUser>) => (
  !isDeclined(request) &&
  isConfirmationOpen(request)
);

export const validatePostalCode = () => (request: WriteCheckRequest<string, any>) => !!request.fieldValue?.match(/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i);

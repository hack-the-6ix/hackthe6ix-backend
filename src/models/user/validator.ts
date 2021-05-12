/* Permissions */

// Admins can do anything and bypass validation
import { WriteCheckRequest } from '../../types/types';

export const admin = (requestUser: any, targetUser: any) => requestUser.jwt.roles.organizer;

export const userOrAdmin = (requestUser: any, targetUser: any) =>
  admin(requestUser, targetUser) || requestUser._id == targetUser._id;

export const notApplied = (requestUser: any, targetUser: any) =>
  admin(requestUser, targetUser) || !requestUser?.status?.applied;


/* Value properties */
export const maxLength = (maxLength: number) => (request: WriteCheckRequest<string>) => request?.value.length < maxLength;

export const inEnum = (validStates: string[]) => (request: WriteCheckRequest<string>) => validStates.indexOf(request?.value) != -1;

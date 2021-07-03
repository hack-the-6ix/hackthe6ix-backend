import { IUser } from '../models/user/fields';
import { UniverseState } from './types';

export type WriteCheckRequest<T, O> = {
  fieldValue: T,      // Field we're updating
  requestUser: IUser,   // User producing the request
  targetObject: O,   // State of the object we're modifying (the entire raw object)
  submissionObject: O, // Object we are submitting
  universeState: UniverseState  // External variables that may be relevant to us
}
export type WriteInterceptRequest<T, O> = WriteCheckRequest<T, O>;
export type ReadCheckRequest<O> = {
  requestUser: IUser,
  targetObject: O,
  universeState: UniverseState
}
export type ReadInterceptRequest<T, O> = {
  fieldValue: T,      // Field we're updating
  requestUser: IUser,   // User producing the request
  targetObject: O,   // State of the object we're modifying (the entire raw object)
  universeState: UniverseState  // External variables that may be relevant to us
};
export type DeleteCheckRequest<O> = {
  requestUser: IUser,
  targetObject: O,
  universeState: UniverseState
}
export type CreateCheckRequest<T, O> = {
  fieldValue: T,      // Field we're updating
  requestUser: IUser,
  submissionObject: O, // Object we are submitting
  universeState: UniverseState
}

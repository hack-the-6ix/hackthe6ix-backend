import { ReadInterceptRequest } from '../../types/checker';
import { isOrganizer } from '../validator';
import { IUser } from './fields';

// When the user does not have statusReleased set to true, we intercept and mask the true fieldValue
export const maskStatus = <T>(defaultValue: T) => (request: ReadInterceptRequest<T, IUser>) => {
  if (!request.targetObject.status.statusReleased && !isOrganizer(request.requestUser)) {
    return defaultValue;
  }

  return request.fieldValue;
};

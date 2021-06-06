import { ReadInterceptRequest } from '../../types/types';
import { IUser } from './fields';

// When the user does not have statusReleased set to true, we intercept and mask the true fieldValue
export const maskStatus = <T>(defaultValue: T) => (request: ReadInterceptRequest<T, IUser>) => {
  if (!request.targetObject.status.statusReleased && (!request.requestUser._id || request.requestUser._id.equals(request.targetObject._id)) && !request.requestUser.roles.admin) {
    return defaultValue;
  }

  return request.fieldValue;
};

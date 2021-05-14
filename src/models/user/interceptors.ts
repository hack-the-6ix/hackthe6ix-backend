import { ReadInterceptRequest } from '../../types/types';

// When the user does not have statusReleased set to true, we intercept and mask the true fieldValue
export const maskStatus = <T>(defaultValue: T) => (request: ReadInterceptRequest<T>) => {
  if (!request.targetObject.status.statusReleased && request.requestUser._id == request.targetObject._id) {
    return defaultValue;
  }

  return request.fieldValue;
};

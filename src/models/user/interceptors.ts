import { ReadInterceptRequest } from '../../types/types';

// When the user does not have statusReleased set to true, we intercept and mask the true value
export const maskStatus = <T>(defaultValue: T) => (request: ReadInterceptRequest<T>) => {
  if (!request.targetUser.status.statusReleased && request.requestUser._id == request.targetUser._id) {
    return defaultValue;
  }

  return request.value;
};

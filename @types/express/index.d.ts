import { IRequestUser } from '../../src/types/types';

declare global {
  namespace Express {
    interface Request {
      executor?: IRequestUser
    }
  }
}

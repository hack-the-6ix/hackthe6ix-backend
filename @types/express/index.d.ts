import { IUser } from '../../src/models/user/fields';

declare global {
  namespace Express {
    interface Request {
      executor?: IUser
    }
  }
}

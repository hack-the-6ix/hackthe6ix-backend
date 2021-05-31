import * as jwt from 'jsonwebtoken';
import User from '../models/user/User';
import { IRequestUser } from '../types/types';

export const verifyToken = (token: string): Record<string, any> => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: 'hackthe6ix-backend',
  }) as Record<string, any>;
};

export const createJwt = (data: Record<string, unknown>): string => {
  return jwt.sign(data, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1 hour',
    issuer: 'hackthe6ix-backend',
    audience: 'hackthe6ix-backend',
  });
};

export const authenticate = async (token: string): Promise<IRequestUser> | null => {
  const tokenData = verifyToken(token);
  const userInfo = {
    ...await User.findOne({
      samlNameID: tokenData.samlNameID,
    }),
    jwt: tokenData,
  } as IRequestUser;

  if (userInfo.lastLogout > tokenData.iat) {
    return null;
  }

  return userInfo;
};

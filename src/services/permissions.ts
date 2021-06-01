import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import User from '../models/user/User';
import { ErrorMessage, IRequestUser } from '../types/types';

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

export const getTokenFromHeader = (req: Request): string => req['headers']['x-access-token'] || req.body.token;

/**
 * Returns  true iff login token is valid and was injected successfully
 */
export const injectExecutor = async (req: Request): Promise<boolean> => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      return false;
    }

    const user = await authenticate(token);

    if (!user) {
      return false;
    }

    req.executor = user;
  } catch (e) {
    return false;
  }

  return true;
};

export const isAdmin = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  if (!await injectExecutor(req)) {
    return res.status(401).send({
      message: 'Access Denied',
      code: 401,
    } as ErrorMessage);
  }

  if (req.executor.roles.admin) {
    return res.status(403).send({
      message: 'Access Denied',
      code: 403,
    } as ErrorMessage);
  }

  next();
};

export const isHacker = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  if (!await injectExecutor(req)) {
    return res.status(401).send({
      message: 'Access Denied',
      code: 401,
    } as ErrorMessage);
  }

  if (req.executor.roles.hacker) {
    return res.status(403).send({
      message: 'Access Denied',
      code: 403,
    } as ErrorMessage);
  }

  next();
};

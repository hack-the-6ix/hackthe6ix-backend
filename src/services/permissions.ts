import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import APIToken from '../models/apitoken/APIToken';
import { IUser } from '../models/user/fields';
import User from '../models/user/User';
import { ErrorMessage } from '../types/types';
import { jsonify, log } from './logger';

export const verifyToken = (token: string): Record<string, any> => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: 'hackthe6ix-backend',
  }) as Record<string, any>;
};

export const decodeToken = (token: string): Record<string, any> => {
  return jwt.decode(token) as Record<string, any>;
};

export const createJwt = (data: Record<string, unknown>): string => {
  return jwt.sign(data, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1 day',
    issuer: 'hackthe6ix-backend',
    audience: 'hackthe6ix-backend',
  });
};

export const authenticate = async (token: string): Promise<IUser> | null => {
  const tokenData = verifyToken(token);
  const userInfo = await User.findOne({
    idpLinkID: tokenData.idpLinkID,
  }) as IUser;

  if (userInfo.lastLogout > tokenData.iat * 1000) {
    return null;
  }

  return userInfo;
};

export const getBearerToken = (header: string|string[]):string | boolean => {
  if(!header){
    return false;
  }

  if(Array.isArray(header)){
    header = header[0];
  }

  if (header.startsWith("Bearer ")){
    return header.substring(7, header.length);
  } else {
    return false;
  }
}

export const getTokenFromHeader = (req: Request): string => req['headers']['x-access-token'] || getBearerToken(req['headers']['authorization']) || req.body.token;
export const getAPITokenFromHeader = (req: Request): string => req['headers']['x-api-token'] as string;

/**
 * Returns  true iff login token is valid and was injected successfully
 */
export const injectExecutor = async (req: Request): Promise<boolean> => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      const apiToken = getAPITokenFromHeader(req);

      if (!apiToken) {
        return false;
      }

      const apiTokenInfo = await APIToken.findOne({
        token: apiToken,
      });

      if (!apiTokenInfo) {
        return false;
      }

      const user = await User.findOne({
        _id: apiTokenInfo.internalUserID,
      });

      if (!user) {
        return false;
      }

      req.executor = user;
    } else {
      const user = await authenticate(token);

      if (!user) {
        return false;
      }

      req.executor = user;
    }


  } catch (e) {
    return false;
  }

  return true;
};

const isRole = async (req: Request, res: Response, next: NextFunction, role: 'hacker' | 'volunteer' | 'organizer' | 'admin'): Promise<Response> => {
  if (!await injectExecutor(req)) {
    log.error(`[INVALID TOKEN]`, jsonify({
      requestURL: req.url,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      uid: req.executor?._id || 'N/A',
      requestBody: req.body,
      role: role,
      responseBody: 'Invalid Token',
      executorUser: req.executor,
    }));

    return res.status(401).send({
      message: 'Access Denied - Invalid Token',
      status: 401,
    } as ErrorMessage);
  }

  if (!req.executor.roles[role]) {
    log.error(`[INSUFFICIENT PERMISSIONS]`, jsonify({
      requestURL: req.url,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      uid: req.executor?._id || 'N/A',
      requestBody: req.body,
      role: role,
      responseBody: 'Invalid Token',
      executorUser: req.executor,
    }));

    return res.status(403).send({
      message: 'Access Denied - Insufficient permissions',
      status: 403,
    } as ErrorMessage);
  }

  next();
};

export const isAdmin = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  return isRole(req, res, next, 'admin');
};

export const isOrganizer = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  return isRole(req, res, next, 'organizer');
};

export const isVolunteer = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  return isRole(req, res, next, 'volunteer');
};

export const isHacker = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  return isRole(req, res, next, 'hacker');
};

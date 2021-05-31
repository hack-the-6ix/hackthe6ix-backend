/*
 * Authentication Service
 **/

import { NextFunction, Request, Response } from 'express';
import { ErrorMessage } from '../types/types';
import { authenticate } from './permissions';

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
    return false
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

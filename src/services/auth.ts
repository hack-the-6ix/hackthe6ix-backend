/*
* Authentication Service
* */

import { NextFunction, Response, Request } from 'express';

export const injectExecutor = (req: Request, res: Response, next: NextFunction) => {

  next();
};

/**
 * TODO: Check if admin here
 * @param req
 * @param res
 * @param next
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {

  // TODO: Inject executor user object into the request

  next();

};

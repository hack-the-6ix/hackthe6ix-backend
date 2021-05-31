/*
* Authentication Service
* */

import { NextFunction, Response, Request } from 'express';

export const getToken = (req: Request) => {
  let token = req['headers']['x-access-token'] || false;

  if (!token) {
    token = req.body.token;
  }

  return token;
};

export const injectExecutor = (req: Request, res: Response) => {

};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  injectExecutor(req, res);

  next();
};

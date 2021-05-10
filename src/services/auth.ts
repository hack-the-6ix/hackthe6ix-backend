/*
* Authentication Service
* */

import { NextFunction, Response, Request } from 'express';

export const injectExecutor = (req: Request, res: Response, next: NextFunction) => {

  next();
};

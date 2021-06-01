import express, { Request, Response } from 'express';
import { getObject } from '../controller/ModelController';
import { logResponse } from '../services/logger';
import { isHacker } from '../services/permissions';
import { ErrorMessage } from '../types/types';

const actionRouter = express.Router();

/**
 * (Hacker)
 *
 * Get hacker profile
 */
actionRouter.get('/profile', isHacker,(req: Request, res: Response) => {
  getObject(req.executor,
    "user",
    {
      filter: {
        _id: req.executor._id
      }
    },
    (error: ErrorMessage, data: any) => {

      let result: any;

      if (!error) {
        // We only want the first result, if any
        result = data[0];

        if (!result) {
          error = {
            code: 500,
            message: "Unable to fetch user profile"
          }
        }
      }

      logResponse(req, res)(error, result);
    }
  );
});

/**
 * TODO: Add endpoint to submit application
 */

export default actionRouter;

/**
 * Primary APIs (basically model independent)
 *
 * For more model dependent endpoints, see actions.ts
 */

import express, { Request, Response } from 'express';
import { getObject } from '../controller/ModelController';
import { isAdmin } from '../services/auth';

const apiRouter = express.Router();

apiRouter.use(express.json());

/**
 * (Admin)
 *
 * Fetch an object given its ID
 */
apiRouter.get('/getOne/:objectType/:objectID', isAdmin, (req: Request, res: Response) => {

  getObject(null, //req.executor, TODO: Inject the executor user object + permissions here
    req.params.objectType,
    {
      _id: req.params.objectID,
    },
    null, // TODO: call logger here
  );
});

/**
 * (Admin)
 *
 * Get the result of a search query for any object type.
 */
apiRouter.get('/getMany/:objectType', isAdmin,(req: Request, res: Response) => {

  getObject(null, //req.executor, TODO: Inject the executor user object + permissions here
    req.params.objectType,
    req.query,
    null, // TODO: call logger here
  );
});

export default apiRouter;

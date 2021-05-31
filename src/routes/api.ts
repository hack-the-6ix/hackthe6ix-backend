/**
 * Primary APIs (basically model independent)
 *
 * For more model dependent endpoints, see actions.ts
 */

import express, { Request, Response } from 'express';
import { createObject, deleteObject, editObject, getObject } from '../controller/ModelController';
import { isAdmin } from '../services/auth';

const apiRouter = express.Router();

apiRouter.use(express.json());

/**
 * (Admin)
 *
 * Get the result of a search query for any object type.
 */
apiRouter.post('/get/:objectType', isAdmin,(req: Request, res: Response) => {
  getObject(req.executor,
    req.params.objectType,
    req.body,
    null, // TODO: call logger here
  );
});

/**
 * (Admin)
 *
 * Edit object
 */
apiRouter.post('/edit/:objectType', isAdmin,(req: Request, res: Response) => {
  editObject(req.executor,
    req.params.objectType,
    req.body?.filter,
    req.body?.changes,
    null, // TODO: call logger here
  );
});

/**
 * (Admin)
 *
 * Delete objects based on a query
 */
apiRouter.post('/delete/:objectType', isAdmin,(req: Request, res: Response) => {
  deleteObject(req.executor,
    req.params.objectType,
    req.body,
    null, // TODO: call logger here
  );
});

/**
 * (Admin)
 *
 * Create object
 */
apiRouter.post('/create/:objectType', isAdmin,(req: Request, res: Response) => {
  createObject(req.executor,
    req.params.objectType,
    req.body,
    null, // TODO: call logger here
  );
});


export default apiRouter;

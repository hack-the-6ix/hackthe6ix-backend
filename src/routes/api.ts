/**
 * Primary APIs (basically model independent)
 *
 * For more model dependent endpoints, see actions.ts
 */

import express, { Request, Response } from 'express';
import { createObject, deleteObject, editObject, getObject } from '../controller/ModelController';
import { logResponse } from '../services/logger';
import { isAdmin, isOrganizer } from '../services/permissions';

const apiRouter = express.Router();

apiRouter.use(express.json());

/**
 * (Organizer)
 *
 * Get the result of a search query for any object type.
 */
apiRouter.post('/get/:objectType', isOrganizer,(req: Request, res: Response) => {
  logResponse(
    req,
    res,
    getObject(req.executor,
      req.params.objectType,
      req.body
    )
  );
});

/**
 * (Organizer)
 *
 * Edit object
 */
apiRouter.post('/edit/:objectType', isOrganizer,(req: Request, res: Response) => {
  logResponse(
    req,
    res,
    editObject(req.executor,
      req.params.objectType,
      req.body.filter,
      req.body.changes
    )
  );
});

/**
 * (Admin)
 *
 * Delete objects based on a query
 */
apiRouter.post('/delete/:objectType', isAdmin,(req: Request, res: Response) => {
  logResponse(
    req,
    res,
    deleteObject(req.executor,
      req.params.objectType,
      req.body
    )
  );
});

/**
 * (Admin)
 *
 * Create object
 */
apiRouter.post('/create/:objectType', isAdmin,(req: Request, res: Response) => {
  logResponse(
    req,
    res,
    createObject(req.executor,
      req.params.objectType,
      req.body
    )
  );
});

/**
 * TODO: Add endpoint to fetch a list of fields and their caption from the schema
 */

/**
 * TODO: Add API to read from gridFS (Organizers)
 */

/**
 * TODO: Add API to write to GridFS (Organizers)
 */

export default apiRouter;

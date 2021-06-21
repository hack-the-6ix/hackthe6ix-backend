/**
 * Primary APIs (basically model independent)
 *
 * For more model dependent endpoints, see actions.ts
 */

import express, { Request, Response } from 'express';
import { deleteGridFSFile, readGridFSFile, writeGridFSFile } from '../controller/GridFSController';
import { createObject, deleteObject, editObject, getObject } from '../controller/ModelController';
import { logResponse } from '../services/logger';
import mongoose from '../services/mongoose_service';
import { isAdmin, isOrganizer } from '../services/permissions';

const apiRouter = express.Router();

apiRouter.use(express.json());

/**
 * (Organizer)
 *
 * Get the result of a search query for any object type.
 */
apiRouter.post('/get/:objectType', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    getObject(req.executor,
      req.params.objectType,
      req.body,
    ),
  );
});

/**
 * (Organizer)
 *
 * Edit object
 */
apiRouter.post('/edit/:objectType', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    editObject(req.executor,
      req.params.objectType,
      req.body.filter,
      req.body.changes,
    ),
  );
});

/**
 * (Admin)
 *
 * Delete objects based on a query
 */
apiRouter.post('/delete/:objectType', isAdmin, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    deleteObject(req.executor,
      req.params.objectType,
      req.body,
    ),
  );
});

/**
 * (Admin)
 *
 * Create object
 */
apiRouter.post('/create/:objectType', isAdmin, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    createObject(req.executor,
      req.params.objectType,
      req.body,
    ),
  );
});

/**
 * (Organizer)
 *
 * Get file from GridFSS
 */
apiRouter.get('/gridfs', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    readGridFSFile(
      req.query.filename as string,
      mongoose,
      res,
    ),
  );
});

/**
 * (Organizer)
 *
 * Write file to GridFSS
 */
apiRouter.put('/gridfs', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    writeGridFSFile(
      req.query.filename as string,
      mongoose,
      (req as any)?.files?.file,
      req.query.replace === undefined ? true : (req.query?.replace?.toString()?.toLowerCase() === 'true'),
    ),
  );
});

/**
 * (Organizer)
 *
 * Delete file from GridFSS
 */
apiRouter.delete('/gridfs', isOrganizer, (req: Request, res: Response) => {
  logResponse(
    req,
    res,
    deleteGridFSFile(
      req.query.filename as string,
      mongoose,
    ),
  );
});

export default apiRouter;

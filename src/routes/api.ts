import express, { Request, Response } from 'express';
import { getObject } from '../controller/ModelController';

const apiRouter = express.Router();

apiRouter.use(express.json());

/**
 * TODO: Figure out if we need to check for permission here before processing fetch request
 */

// Get a single object
apiRouter.get('/getOne/:objectType/:objectID', (req: Request, res: Response) => {
  console.log(req.params);

  getObject(null, //req.executor, TODO: Inject the executor user object + permissions here
    req.params.objectType,
    {
      _id: req.params.objectID,
    },
    null, // TODO: call logger here
  );
});

// Get many objects
apiRouter.get('/getMany/:objectType', (req: Request, res: Response) => {
  console.log(req.query);
});

export default apiRouter;

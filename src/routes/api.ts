import express from 'express';
import { getObject } from '../controller/ModelController';

const apiRouter = express.Router();

apiRouter.use(express.json());

/**
 * TODO: Figure out if we need to check for permission here before processing fetch request
 */

// Get a single object
apiRouter.get('/getOne/:objectType/:objectID', (req: express.Request, res: express.Response) => {
  console.log(req.params);

  getObject('', //req.token, // TODO: Inject JWT token in here using middleware. Will need a modified interface too
    req.params.objectType,
    {
      _id: req.params.objectID,
    },
    null, // TODO: call logger here
  );
});

// Get many objects
apiRouter.get('/getMany/:objectType', (req: express.Request, res: express.Response) => {
  console.log(req.query);
});

export default apiRouter;

import express, { Request, Response, Router } from 'express';

import { fetchSP } from '../services/multisaml';

import {logResponse} from "../services/logger";
import {handleACS, handleLogin, handleLogout} from "../controller/AuthController";

const router: Router = express.Router();

// Endpoint to retrieve metadata
router.get('/:provider/metadata.xml', async (req: Request, res: Response) => {
  const sp = await fetchSP(req.params.provider.toLowerCase());
  res.type('application/xml');
  res.send(sp.create_metadata());
});

// Starting point for login
router.get('/:provider/login', async (req: Request, res: Response) => {
  logResponse(
      req,
      res,
      handleLogin(req.params.provider, req.query.redirectTo as string)
  )
});

// Assert endpoint for when login completes
router.post('/:provider/acs', async (req: Request, res: Response) => {
  logResponse(
      req,
      res,
      handleACS(req.params.provider, req.body),
      true
  )
});

// Starting point for logout
router.post('/:provider/logout', async (req: Request, res: Response) => {
  logResponse(
      req,
      res,
      handleLogout(req.params.provider, req.body.token)
  )
});
export default router;

import { Request, Response } from 'express';
import { HTTPError } from '../types/types';

/**
 * Handles the promise from APIs calls and handles errors, or forwards data for a successful req.
 *
 * @param req
 * @param res
 * @param promise
 */
export const logResponse = (req: Request, res: Response, promise: Promise<any>) => {

  promise
  .then((data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date()}] Req: ${JSON.stringify(req.body)} Full Response: ${JSON.stringify(data)}`);
    }

    return res.json({
      status: 200,
      message: data,
    });
  })
  .catch((error) => {
    // TODO: Add proper logger here
    console.log(`[${new Date()}] Req: ${JSON.stringify(req.body)} Full Response: ${error.toString()}`);

    const status = error.status || 500;

    // When we send out the actual error, we do NOT send the stacktrace by default for security
    const body: any = {
      status: status,
    };

    if (error instanceof HTTPError || req?.executor?.roles?.organizer) {
      body.message = error.message;
    } else {
      body.message = "An error occurred";
    }

    if (req?.executor?.roles?.organizer) {
      body.stacktrace = error.stacktrace;
    }

    return res.status(status).json(body);
  });

};

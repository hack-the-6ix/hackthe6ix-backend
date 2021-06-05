import { Request, Response } from 'express';
import { ErrorMessage } from '../types/types';

/**
 * Intercepts the callback from APIs calls and handles errors, or forwards data for a successful req.
 *
 * @param req
 * @param res
 */
export const logResponse = (req: Request, res: Response) => (error: ErrorMessage, data?: any) => {
  if (error) {
    // TODO: Add proper logger here
    console.log(`[${new Date()}] Req: ${JSON.stringify(req.body)} Full Response: ${JSON.stringify(error)}`);

    // When we send out the actual error, we do NOT send the stacktrace by default for security
    const body: any = {
      message: error.message,
      code: error.code
    };

    if (req?.executor?.roles?.organizer) {
      body.stacktrace = error.stacktrace;
    }

    return res.status(error.code || 500).json(body);
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date()}] Req: ${JSON.stringify(req.body)} Full Response: ${JSON.stringify(data)}`);
    }

    return res.json({
      code: 200,
      message: data
    });
  }
};

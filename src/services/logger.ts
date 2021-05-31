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
    console.log(`[${ new Date() }] ${ JSON.stringify(error) }`);

    // When we send out the actual error, we do NOT send the stacktrace for security
    return res.status(error.code || 500).json({ message: error.message, code: error.code });
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${ new Date() }] ${ JSON.stringify(data) }`);
    }

    return res.json(data);
  }
};

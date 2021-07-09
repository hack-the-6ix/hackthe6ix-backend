import { Request, Response } from 'express';
import { HTTPError } from '../types/errors';

import winston from 'winston';
import * as util from 'util';
import {LoggingWinston} from "@google-cloud/logging-winston";

const prepareMessage = function(args: any) {
  const msg = args.map((e:any) => {
    if(e === undefined || e === null){
      return String(e);
    }

    if (e.toString() === '[object FileList]')
      return util.inspect(e.toArray(), false, 10);
    else if (e.toString() === '[object File]')
      return util.inspect(e.toObject(), false, 10);
    else if (e.toString() === '[object Object]') {
      return util.inspect(e, false, 5);
    }
    else if (e instanceof Error)
      return e.stack
    else
      return e;
  }).join(' ');

  return msg;
}

const cFormat = winston.format.printf(({ level, message, label, timestamp}) => {
  return `${timestamp} [${label}] [${level.toUpperCase()}]: ${message}`;
});

function createWinstonLogger() {
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
    silly: 5
  };

  const loggingFormat = winston.format.combine(winston.format.timestamp(), winston.format.label({label: "HT6-BACKEND"}), cFormat);

  const logger = winston.createLogger({
    level: 'info',
    format: loggingFormat,
    defaultMeta: { service: 'user-service' },
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log`
      // - Write all logs error (and below) to `error.log`.
      //
      new winston.transports.File({ filename: 'logs/error.log' , level:'error', handleExceptions: true}),
      new winston.transports.File({ filename: 'logs/combined.log' })
    ]//,
    // exceptionHandlers: [
    //     new winston.transports.File({ filename: 'exceptions.log' }),
    //     loggingWinston
    // ]
  });
  winston.loggers.add('default', logger);
  //
  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  //
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: loggingFormat,
      level: 'silly',
      handleExceptions: true
    }));
  }

  // Only log to StackDriver in production
  if (process.env.NODE_ENV === 'production'){
    const loggingWinston = new LoggingWinston({
      projectId: process.env.GCP_LOGGING_PROJECTID,
      keyFilename: process.env.GCP_LOGGING_KEYFILEPATH,
      logName: 'hackthe6ix-backend',
      level: 'info',
    });
    logger.add(loggingWinston)
  }
  return logger;
}

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
      log.debug(`[${req.url}] Req: ${JSON.stringify(req.body)} Full Response: ${JSON.stringify(data)}`);
    }
    log.info(`[${req.url}] Req: ${JSON.stringify(req.body)} Full Response: ${JSON.stringify(data)}`);
    return res.json({
      status: 200,
      message: data,
    });
  })
  .catch((error: HTTPError) => {

    const status = error.status || 500;

    // When we send out the response, we do NOT send the full error by default for security
    const body: any = {
      status: status,
    };

    if (error instanceof HTTPError || req?.executor?.roles?.organizer) {
      body.message = error.publicMessage;
    } else {
      body.message = 'An error occurred';
    }

    if (req?.executor?.roles?.organizer || error.errorIsPublic) {
      body.error = error.error;
    }

    log.error(`[${req.url}] Req: ${JSON.stringify(req.body)} Full Response: ${error.toString()} ${JSON.stringify(body)}`);

    return res.status(status).json(body);
  });

};

export const winstonLogger = createWinstonLogger();

const logLevels =  ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
type logLevels = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';

const logFunctions = {} as Record<logLevels, (...args:any) => void>;

for (const logLevel of logLevels) {
  logFunctions[logLevel as logLevels] = (...args:any) =>{
    winstonLogger.log(logLevel, prepareMessage(args));
  }
}

export const log = logFunctions;
import bodyParser from 'body-parser';
import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import 'express-async-errors';
import fileUpload from 'express-fileupload';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
// Bootstrap scripts
import './bootstrap/settings';
import { database, port } from './consts';
import actionRouter from './routes/action';
import apiRouter from './routes/api';
import authRouter from './routes/auth';
import { logResponse } from './services/logger';
import { InternalServerError } from './types/types';

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Sanitize requests with mongoDB ops
app.use(mongoSanitize());
app.use(fileUpload({
  // We add one byte here so that all the excess data get truncated, but we can still trigger the filesize error in our code
  limits: { fileSize: 5000001 },
}));

app.use('/api', apiRouter);
app.use('/api/action', actionRouter);
app.use('/auth', authRouter);

app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
  logResponse(req, res, (
    async () => {
      throw new InternalServerError('An error occurred', err.stack);
    }
  )());
} as ErrorRequestHandler);

mongoose.connect(database, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
}).then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch((err) => {
  console.log(err);
  console.log('Error connecting to mongodb. Exiting.');
  process.exit(1);
});

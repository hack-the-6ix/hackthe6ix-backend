import bodyParser from 'body-parser';
import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import 'express-async-errors';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
// Bootstrap scripts
import './bootstrap/settings';
import actionRouter from './routes/action';
import apiRouter from './routes/api';
import authRouter from './routes/auth';
import { logResponse } from './services/logger';
import { InternalServerError } from './types/types';

const port = process.env.PORT || 6972;
const database = process.env.DATABASE || 'mongodb://localhost:27017/ht6backend';

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Sanitize requests with mongoDB ops
app.use(mongoSanitize());

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

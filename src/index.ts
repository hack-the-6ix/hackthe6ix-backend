import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import actionRouter from './routes/action';

import apiRouter from './routes/api';
import authRouter from './routes/auth';

const app = express();
dotenv.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/** *
 * TODO: Add middleware to inject requester user object. If the requester does not have a db entry (i.e. organizer, then generate it using SAML/jwt data)
 *
 * TODO: Do not send the full internal error message to the client in production mode (for security reasons)
 *
 * TODO: setup nodemon
 *
 * Setup routes here
 * - /api/action
 *   - endpoints that trigger a more complicated action, such as joining a team
 *
 * - /api
 *   - main APIs for reading/writing
 *
 * - /auth
 *   - exchange SAML token with JWT
 *
 * For permissions:
 * - When a request comes in, we'll have access to the user's JWT token, which
 *   will encode their permission level
 * - We can use this in the anonymous functions written for each field of the database
 */

app.use('/api', apiRouter);
app.use('/api/action', actionRouter);
app.use('/auth', authRouter);

app.listen(process.env.PORT, () => {
  console.log(`Sewvew wunnying on powt owo ${process.env.PORT}`);
});

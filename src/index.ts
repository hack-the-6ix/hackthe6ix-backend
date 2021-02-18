import bodyParser from 'body-parser';
import express from 'express';
import dotenv from 'dotenv';

const app = express();
dotenv.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.listen(process.env.PORT, () => {
  console.log(`Sewvew wunnying on powt owo ${process.env.PORT}`);
});

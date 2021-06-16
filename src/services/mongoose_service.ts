import mongoose from "mongoose";
import { database } from '../consts';

// We put the DB connection in a separate file so that we can access the driver from multiple files if needed

mongoose.connect(database, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
}).then(() => {
  console.log('MongoDB started');
}).catch((err) => {
  console.log(err);
  console.log('Error connecting to mongodb. Exiting.');
  process.exit(1);
});

export default mongoose;
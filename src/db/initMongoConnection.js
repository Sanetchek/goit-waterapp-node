import mongoose from 'mongoose';
import { env } from '../utils/env.js';

export const initMongoConnection = async () => {
  try {
    const user = env('MONGODB_USER');
    const password = env('MONGODB_PASSWORD');
    const url = env('MONGODB_URL');
    const dbName = env('MONGODB_DB');
    const DB_HOST = `mongodb+srv://${user}:${password}@${url}/${dbName}
?retryWrites=true&w=majority&appName=Cluster0`;
    await mongoose.connect(DB_HOST);

    console.log('Mongo connection successfully established!');
  } catch (error) {
    console.log('Mongo connection error', error.message);
    throw error;
  }
};

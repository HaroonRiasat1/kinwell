import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`[db] connected to ${mongoose.connection.host}/${mongoose.connection.name}`);
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

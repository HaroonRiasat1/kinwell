import mongoose from 'mongoose';
import { env } from './env.js';
import { runMigrations } from './migrations.js';

export async function connectDb(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`[db] connected to ${mongoose.connection.host}/${mongoose.connection.name}`);
  await runMigrations().catch((err) => console.error('[db] migration failed', err.message));
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

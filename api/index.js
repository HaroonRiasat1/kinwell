// Vercel serverless entry: the whole Express API runs as one function at /api/*.
import { createApp } from '../server/src/app.js';
import { connectDb } from '../server/src/config/db.js';

const app = createApp();
let connection; // reused across invocations while the function stays warm

export default async function handler(req, res) {
  connection ??= connectDb().catch((err) => {
    connection = undefined; // retry on the next request
    throw err;
  });
  await connection;
  return app(req, res);
}

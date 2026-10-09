// Vercel serverless entry: the whole Express API runs as one function at /api/*.
import { createApp } from '../server/src/app.js';
import { connectDb } from '../server/src/config/db.js';

const app = createApp();
let connection; // reused across invocations while the function stays warm

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.url === '/api/health') return send(res, 200, { ok: true, database: Boolean(process.env.MONGO_URI) });
  if (!process.env.MONGO_URI) {
    return send(res, 503, { error: { message: 'The database is not configured. Set MONGO_URI in the Vercel project settings.' } });
  }
  try {
    connection ??= connectDb();
    await connection;
  } catch (err) {
    connection = undefined; // retry on the next request
    console.error('[db] connection failed:', err.message);
    return send(res, 503, { error: { message: "We couldn't reach the database. Please try again shortly." } });
  }
  return app(req, res);
}

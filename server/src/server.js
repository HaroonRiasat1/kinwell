import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

await connectDb();
createApp().listen(env.port, () => console.log(`[api] listening on http://localhost:${env.port}`));

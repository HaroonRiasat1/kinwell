const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing environment variable ${name}`);
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(required('PORT', 4000)),
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/kinwell'),
  jwtSecret: required('JWT_SECRET', 'dev-only-secret'),
  jwtExpiresIn: required('JWT_EXPIRES_IN', '7d'),
  clientOrigin: required('CLIENT_ORIGIN', 'http://localhost:5173'),
  publicUrl: process.env.PUBLIC_URL ?? 'https://kinwell-sepia.vercel.app',
  twilio: { sid: process.env.TWILIO_ACCOUNT_SID, token: process.env.TWILIO_AUTH_TOKEN, from: process.env.TWILIO_FROM },
};

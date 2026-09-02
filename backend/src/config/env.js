import dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_FILE ?? '../.env' });
dotenv.config();

function bool(value, fallback) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function int(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: int(process.env.PORT, 3001),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  cookieSecure: bool(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  maxUploadSizeMb: int(process.env.MAX_UPLOAD_SIZE_MB, 5),
};

if (env.nodeEnv === 'production' && (env.jwtAccessSecret === 'change-me' || env.jwtAccessSecret.length < 32)) {
  throw new Error('JWT_ACCESS_SECRET must be changed and at least 32 characters in production');
}

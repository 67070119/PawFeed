import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export const AUTH_COOKIE = 'pawfeed_access';

export function requireAuth(req, _res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return next(new AppError(401, 'AUTH_REQUIRED', 'กรุณาเข้าสู่ระบบก่อนดำเนินการ'));

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret, { algorithms: ['HS256'] });
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(new AppError(401, 'INVALID_SESSION', 'เซสชันไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่'));
  }
}

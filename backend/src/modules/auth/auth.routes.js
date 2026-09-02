import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { AUTH_COOKIE, requireAuth } from '../../middlewares/auth.js';
import { AppError } from '../../utils/app-error.js';
import { sendSuccess } from '../../utils/response.js';
import { loginSchema, parse, registerSchema } from '../../utils/validation.js';

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.nodeEnv === 'production',
  path: '/',
};

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}

authRouter.post('/register', asyncHandler(async (req, res) => {
  const input = parse(registerSchema, req.body, 'ข้อมูลสมัครสมาชิกไม่ถูกต้อง');
  const email = input.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'อีเมลนี้ถูกใช้งานแล้ว');

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({ data: { name: input.name, email, passwordHash } });
  return sendSuccess(res, publicUser(user), 201);
}));

authRouter.post('/login', asyncHandler(async (req, res) => {
  const input = parse(loginSchema, req.body, 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง');
  const email = input.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');

  const token = jwt.sign({ email: user.email }, env.jwtAccessSecret, {
    subject: user.id,
    expiresIn: env.jwtAccessExpiresIn,
    algorithm: 'HS256',
  });
  res.cookie(AUTH_COOKIE, token, cookieOptions);
  return sendSuccess(res, publicUser(user));
}));

authRouter.post('/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  return sendSuccess(res, { loggedOut: true });
});

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new AppError(401, 'INVALID_SESSION', 'ไม่พบผู้ใช้ของเซสชันนี้ กรุณาเข้าสู่ระบบใหม่');
  return sendSuccess(res, publicUser(user));
}));

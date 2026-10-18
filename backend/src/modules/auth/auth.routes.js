import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { sendPasswordResetEmail } from '../../lib/mailer.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { AUTH_COOKIE, requireAuth } from '../../middlewares/auth.js';
import { AppError } from '../../utils/app-error.js';
import { sendSuccess } from '../../utils/response.js';
import { forgotPasswordSchema, loginSchema, parse, registerSchema, resetPasswordSchema } from '../../utils/validation.js';

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.cookieSecure,
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

authRouter.post('/forgot-password', asyncHandler(async (req, res) => {
  const input = parse(forgotPasswordSchema, req.body, 'ข้อมูลอีเมลไม่ถูกต้อง');
  const email = input.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  // Always return the same message to prevent user enumeration
  if (!user) {
    return sendSuccess(res, {
      message: 'หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งคำแนะนำในการตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณแล้ว',
    });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = `${env.frontendUrl}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  });

  return sendSuccess(res, {
    message: 'หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งคำแนะนำในการตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณแล้ว',
  });
}));

authRouter.get('/verify-reset-token', asyncHandler(async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  if (!token) {
    throw new AppError(400, 'INVALID_TOKEN', 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new AppError(400, 'INVALID_OR_EXPIRED_TOKEN', 'ลิงก์รีเซ็ตรหัสผ่านนี้หมดอายุหรือไม่ถูกต้อง กรุณาทำรายการใหม่อีกครั้ง');
  }

  return sendSuccess(res, { valid: true, email: resetToken.user.email });
}));

authRouter.post('/reset-password', asyncHandler(async (req, res) => {
  const input = parse(resetPasswordSchema, req.body, 'ข้อมูลการตั้งรหัสผ่านใหม่ไม่ถูกต้อง');
  const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new AppError(400, 'INVALID_OR_EXPIRED_TOKEN', 'ลิงก์รีเซ็ตรหัสผ่านนี้หมดอายุหรือไม่ถูกต้อง กรุณาทำรายการใหม่อีกครั้ง');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });
    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });
    await tx.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId, id: { not: resetToken.id } },
    });
  });

  return sendSuccess(res, { message: 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่' });
}));

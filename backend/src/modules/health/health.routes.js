import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { sendSuccess } from '../../utils/response.js';

export const healthRouter = Router();

healthRouter.get('/live', (_req, res) => sendSuccess(res, { status: 'live' }));

healthRouter.get('/ready', asyncHandler(async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(res, { status: 'ready', database: 'up' });
  } catch {
    return res.status(503).json({
      success: false,
      error: { code: 'DEPENDENCY_UNAVAILABLE', message: 'ฐานข้อมูลยังไม่พร้อมใช้งาน' },
    });
  }
}));

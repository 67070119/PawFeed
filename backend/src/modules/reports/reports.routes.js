import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { AppError } from '../../utils/app-error.js';
import { sendSuccess } from '../../utils/response.js';
import { parse, reportSchema } from '../../utils/validation.js';

export const reportsRouter = Router({ mergeParams: true });

reportsRouter.post('/', requireAuth, asyncHandler(async (req, res) => {
  const input = parse(reportSchema, req.body, 'ประเภทรายงานไม่ถูกต้อง');
  const point = await prisma.strayPoint.findUnique({ where: { id: req.params.id }, select: { id: true, lastSeenAt: true } });
  if (!point) throw new AppError(404, 'POINT_NOT_FOUND', 'ไม่พบจุดสัตว์จรจัดนี้');

  const now = new Date();
  const report = await prisma.$transaction(async (tx) => {
    const created = await tx.pointReport.create({
      data: { pointId: point.id, userId: req.user.id, type: input.type },
    });
    if (input.type === 'STILL_HERE') {
      await tx.strayPoint.update({ where: { id: point.id }, data: { lastSeenAt: now } });
    }
    return created;
  });

  return sendSuccess(res, {
    report,
    lastSeenAt: input.type === 'STILL_HERE' ? now : point.lastSeenAt,
  }, 201);
}));

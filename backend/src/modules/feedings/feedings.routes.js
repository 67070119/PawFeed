import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { AppError } from '../../utils/app-error.js';
import { sendSuccess } from '../../utils/response.js';
import { feedingSchema, parse } from '../../utils/validation.js';

export const feedingsRouter = Router({ mergeParams: true });

async function ensurePoint(pointId) {
  const point = await prisma.strayPoint.findUnique({ where: { id: pointId }, select: { id: true } });
  if (!point) throw new AppError(404, 'POINT_NOT_FOUND', 'ไม่พบจุดสัตว์จรจัดนี้');
}

feedingsRouter.get('/', asyncHandler(async (req, res) => {
  await ensurePoint(req.params.id);
  const feedings = await prisma.feeding.findMany({
    where: { pointId: req.params.id },
    orderBy: { fedAt: 'desc' },
    include: { user: { select: { id: true, name: true } } },
  });
  return sendSuccess(res, {
    items: feedings,
    latestFeedingAt: feedings[0]?.fedAt ?? null,
  });
}));

feedingsRouter.post('/', requireAuth, asyncHandler(async (req, res) => {
  const input = parse(feedingSchema, req.body, 'ข้อมูลการให้อาหารไม่ถูกต้อง');
  await ensurePoint(req.params.id);

  const feeding = await prisma.feeding.create({
    data: {
      pointId: req.params.id,
      userId: req.user.id,
      note: input.note,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return sendSuccess(res, {
    feeding,
    latestFeedingAt: feeding.fedAt,
  }, 201);
}));

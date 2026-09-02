import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { sendSuccess } from '../../utils/response.js';

export const profileRouter = Router();
profileRouter.use(requireAuth);

profileRouter.get('/points', asyncHandler(async (req, res) => {
  const points = await prisma.strayPoint.findMany({
    where: { createdByUserId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      images: { take: 1, orderBy: { createdAt: 'asc' }, select: { imageUrl: true } },
      feedings: { take: 1, orderBy: { fedAt: 'desc' }, select: { fedAt: true } },
    },
  });
  return sendSuccess(res, points.map((point) => ({
    ...point,
    imageUrl: point.images[0]?.imageUrl ?? null,
    latestFeedingAt: point.feedings[0]?.fedAt ?? null,
    images: undefined,
    feedings: undefined,
  })));
}));

profileRouter.get('/feedings', asyncHandler(async (req, res) => {
  const feedings = await prisma.feeding.findMany({
    where: { userId: req.user.id },
    orderBy: { fedAt: 'desc' },
    include: {
      point: {
        select: {
          id: true,
          animalType: true,
          description: true,
          images: { take: 1, orderBy: { createdAt: 'asc' }, select: { imageUrl: true } },
        },
      },
    },
  });
  return sendSuccess(res, feedings);
}));

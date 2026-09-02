import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { AppError } from '../../utils/app-error.js';
import { sendSuccess } from '../../utils/response.js';
import { boundingBoxSchema, createPointSchema, parse, updatePointSchema } from '../../utils/validation.js';
import { removeSavedFile, savePointImage, upload } from '../../utils/upload.js';

export const pointsRouter = Router();

const pointDetailInclude = {
  images: { orderBy: { createdAt: 'asc' } },
  feedings: {
    orderBy: { fedAt: 'desc' },
    take: 50,
    include: { user: { select: { id: true, name: true } } },
  },
  reports: { orderBy: { createdAt: 'desc' }, take: 20 },
  createdBy: { select: { id: true, name: true } },
};

pointsRouter.get('/', asyncHandler(async (req, res) => {
  const bounds = parse(boundingBoxSchema, req.query, 'ขอบเขตแผนที่ไม่ถูกต้อง');
  const points = await prisma.strayPoint.findMany({
    where: {
      status: 'ACTIVE',
      latitude: { gte: bounds.minLat, lte: bounds.maxLat },
      longitude: { gte: bounds.minLng, lte: bounds.maxLng },
    },
    orderBy: { updatedAt: 'desc' },
    take: 500,
    select: {
      id: true,
      animalType: true,
      estimatedCount: true,
      latitude: true,
      longitude: true,
      usualTime: true,
      lastSeenAt: true,
      updatedAt: true,
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

pointsRouter.get('/:id', asyncHandler(async (req, res) => {
  const point = await prisma.strayPoint.findUnique({ where: { id: req.params.id }, include: pointDetailInclude });
  if (!point) throw new AppError(404, 'POINT_NOT_FOUND', 'ไม่พบจุดสัตว์จรจัดนี้');
  return sendSuccess(res, {
    ...point,
    latestFeedingAt: point.feedings[0]?.fedAt ?? null,
  });
}));

pointsRouter.post('/', requireAuth, upload.single('image'), asyncHandler(async (req, res) => {
  const input = parse(createPointSchema, req.body, 'ข้อมูลจุดสัตว์จรจัดไม่ถูกต้อง');
  let savedFile;
  try {
    savedFile = await savePointImage(req.file);
    const point = await prisma.$transaction(async (tx) => tx.strayPoint.create({
      data: {
        createdByUserId: req.user.id,
        animalType: input.animalType,
        estimatedCount: input.estimatedCount,
        description: input.description,
        latitude: input.latitude,
        longitude: input.longitude,
        usualTime: input.usualTime,
        lastSeenAt: new Date(),
        images: { create: { imageUrl: savedFile.publicUrl } },
      },
      include: pointDetailInclude,
    }));
    return sendSuccess(res, { ...point, latestFeedingAt: null }, 201);
  } catch (error) {
    await removeSavedFile(savedFile?.absolutePath);
    throw error;
  }
}));

pointsRouter.patch('/:id', requireAuth, asyncHandler(async (req, res) => {
  const input = parse(updatePointSchema, req.body, 'ข้อมูลที่ต้องการแก้ไขไม่ถูกต้อง');
  const existing = await prisma.strayPoint.findUnique({ where: { id: req.params.id }, select: { id: true, createdByUserId: true } });
  if (!existing) throw new AppError(404, 'POINT_NOT_FOUND', 'ไม่พบจุดสัตว์จรจัดนี้');
  if (existing.createdByUserId !== req.user.id) throw new AppError(403, 'POINT_UPDATE_FORBIDDEN', 'คุณไม่มีสิทธิ์แก้ไขจุดนี้');

  const point = await prisma.strayPoint.update({ where: { id: existing.id }, data: input, include: pointDetailInclude });
  return sendSuccess(res, { ...point, latestFeedingAt: point.feedings[0]?.fedAt ?? null });
}));

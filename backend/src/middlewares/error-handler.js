import multer from 'multer';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error.js';
import { sendError } from '../utils/response.js';

export function notFoundMiddleware(req, _res, next) {
  next(new AppError(404, 'ROUTE_NOT_FOUND', 'ไม่พบเส้นทางที่ร้องขอ'));
}

export function errorMiddleware(error, req, res, _next) {
  let normalized = error;

  if (error instanceof multer.MulterError) {
    normalized = error.code === 'LIMIT_FILE_SIZE'
      ? new AppError(413, 'FILE_TOO_LARGE', 'ไฟล์รูปมีขนาดใหญ่เกินกำหนด')
      : new AppError(400, 'UPLOAD_ERROR', 'ไม่สามารถรับไฟล์อัปโหลดได้');
  } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    normalized = new AppError(409, 'CONFLICT', 'ข้อมูลนี้มีอยู่ในระบบแล้ว');
  }

  const statusCode = normalized.statusCode ?? normalized.status ?? 500;
  if (statusCode >= 500) {
    console.error(JSON.stringify({
      level: 'error',
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      code: normalized.code ?? 'INTERNAL_ERROR',
      message: normalized.message,
    }));
  }

  return sendError(res, {
    statusCode,
    code: normalized.code ?? 'INTERNAL_ERROR',
    message: statusCode >= 500 ? 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง' : normalized.message,
    requestId: req.requestId,
    details: statusCode < 500 ? normalized.details : undefined,
  });
}

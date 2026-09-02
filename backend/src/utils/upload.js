import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from './app-error.js';

const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadSizeMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimes.has(file.mimetype)) {
      return callback(new AppError(415, 'UNSUPPORTED_IMAGE_TYPE', 'รองรับเฉพาะไฟล์ JPEG, PNG และ WebP'));
    }
    return callback(null, true);
  },
});

function detectImageExtension(buffer) {
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return 'png';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

export async function savePointImage(file) {
  if (!file) throw new AppError(400, 'IMAGE_REQUIRED', 'ต้องอัปโหลดรูปอย่างน้อย 1 รูป');

  const extension = detectImageExtension(file.buffer);
  if (!extension) throw new AppError(415, 'INVALID_IMAGE_CONTENT', 'เนื้อหาไฟล์ไม่ใช่รูปภาพที่รองรับ');

  await fs.mkdir(env.uploadDir, { recursive: true });
  const filename = `${crypto.randomUUID()}.${extension}`;
  const absolutePath = path.join(env.uploadDir, filename);
  await fs.writeFile(absolutePath, file.buffer, { flag: 'wx' });

  return {
    filename,
    absolutePath,
    publicUrl: `/uploads/${filename}`,
  };
}

export async function removeSavedFile(absolutePath) {
  if (!absolutePath) return;
  try { await fs.unlink(absolutePath); } catch (error) {
    if (error.code !== 'ENOENT') console.error('upload cleanup failed', error);
  }
}

export function isSupportedImageBuffer(buffer) {
  return Boolean(detectImageExtension(buffer));
}

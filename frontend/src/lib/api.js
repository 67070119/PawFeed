'use client';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export class ApiError extends Error {
  constructor(status, code, message, requestId) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body && !isForm && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    const err = payload?.error || {};
    throw new ApiError(response.status, err.code || 'REQUEST_FAILED', err.message || 'เกิดข้อผิดพลาดในการทำรายการ', err.requestId);
  }
  return payload?.data;
}

export function assetUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function relativeTime(value) {
  if (!value) return 'ยังไม่มีข้อมูล';
  const time = new Date(value).getTime();
  const diff = Math.max(0, Date.now() - time);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
}

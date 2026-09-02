export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function sendError(res, { statusCode = 500, code = 'INTERNAL_ERROR', message = 'เกิดข้อผิดพลาดภายในระบบ', requestId, details }) {
  const error = { code, message };
  if (requestId) error.requestId = requestId;
  if (details !== undefined) error.details = details;
  return res.status(statusCode).json({ success: false, error });
}

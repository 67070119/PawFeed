import crypto from 'node:crypto';

export function requestIdMiddleware(req, res, next) {
  req.requestId = req.get('x-request-id') || crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
}

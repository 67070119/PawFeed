export function requestLogMiddleware(req, res, next) {
  const startedAt = Date.now();
  const requestPath = req.originalUrl.split('?')[0];

  res.on('finish', () => {
    console.log(JSON.stringify({
      level: 'info',
      requestId: req.requestId,
      method: req.method,
      path: requestPath,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    }));
  });
  next();
}

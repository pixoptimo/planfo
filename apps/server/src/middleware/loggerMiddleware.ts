import type { Request, Response, NextFunction } from 'express';
import { logger } from '@cms/utils';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/media/')) {
      logger.info('HTTP Request', {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration,
        ip: req.ip
      });
    }
  });

  next();
}

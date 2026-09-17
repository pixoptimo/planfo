import type { Request, Response, NextFunction } from 'express';
import { logger } from '@cms/utils';
import { config } from '../config/env.js';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const errorObj = err instanceof Error ? err : new Error(String(err));

  logger.error('Unhandled API Error', {
    method: req.method,
    url: req.originalUrl,
    message: errorObj.message,
    ...(config.NODE_ENV !== 'production' ? { stack: errorObj.stack } : {})
  });

  const statusCode = (err as { status?: number; statusCode?: number }).status ||
                     (err as { status?: number; statusCode?: number }).statusCode ||
                     500;

  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.NODE_ENV === 'production' ? 'An unexpected error occurred' : errorObj.message
    }
  });
}

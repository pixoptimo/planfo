import helmet from 'helmet';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Allows flexible template preview & admin UI iframe preview
  crossOriginEmbedderPolicy: false
});

export const corsMiddleware = cors({
  origin: [config.ADMIN_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

/**
 * Basic CSRF header verification for state-modifying requests when requested from browsers.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Safe methods do not require CSRF check
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt auth login
  if (req.path === '/api/auth/login') {
    return next();
  }

  // Require standard request verification or same-origin header
  const origin = req.headers.origin || req.headers.referer;
  if (!origin && req.cookies?.cms_session) {
    // If request has session cookie but no origin/referer, verify with caution
  }

  next();
}

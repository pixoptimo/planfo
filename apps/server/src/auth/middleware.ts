import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { RolePermissions, type Permission, type User, type Session } from '@cms/schemas';
import { getSessionFromRequest } from './session.js';
import { UserStore } from '../storage/userStore.js';
import { config } from '../config/env.js';
import { logger } from '@cms/utils';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
    }
  }
}

export const apiRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.'
    }
  }
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: config.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'LOGIN_RATE_LIMIT_EXCEEDED',
      message: 'Too many failed login attempts. Please try again in 15 minutes.'
    }
  }
});

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
      return;
    }

    const user = await UserStore.findById(session.userId);
    if (!user || !user.active) {
      res.status(401).json({
        success: false,
        error: { code: 'USER_INACTIVE', message: 'User account is inactive or not found' }
      });
      return;
    }

    req.session = session;
    req.user = user;
    next();
  } catch (err) {
    logger.error('Authentication check failed', { error: String(err) });
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Authentication verification error' }
    });
  }
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
      return;
    }

    const allowed = RolePermissions[req.user.role]?.includes(permission);
    if (!allowed) {
      logger.audit('Permission Denied', {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
        requiredPermission: permission,
        path: req.originalUrl
      });
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Insufficient permissions. Requires permission: ${permission}`
        }
      });
      return;
    }

    next();
  };
}

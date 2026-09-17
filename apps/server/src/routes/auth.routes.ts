import { Router, type Request, type Response } from 'express';
import { LoginCredentialsSchema } from '@cms/schemas';
import { UserStore } from '../storage/userStore.js';
import { verifyPassword } from '../auth/password.js';
import { createSession, destroySession } from '../auth/session.js';
import { requireAuth, loginRateLimiter } from '../auth/middleware.js';
import { logger } from '@cms/utils';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const result = LoginCredentialsSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid credentials format', details: result.error.format() }
    });
    return;
  }

  const { email, password } = result.data;
  const user = await UserStore.findByEmail(email);

  if (!user || !user.active) {
    logger.audit('Login Failed - User not found or inactive', { email });
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    logger.audit('Login Failed - Invalid password', { email });
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    });
    return;
  }

  const session = await createSession(user, res);
  logger.audit('Login Success', { userId: user.id, email: user.email, role: user.role });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      session
    }
  });
});

// POST /api/auth/logout
authRouter.post('/logout', requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (req.user) {
    logger.audit('Logout', { userId: req.user.id, email: req.user.email });
  }
  await destroySession(req, res);
  res.json({
    success: true,
    data: { message: 'Logged out successfully' }
  });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not logged in' }
    });
    return;
  }

  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        createdAt: req.user.createdAt
      }
    }
  });
});

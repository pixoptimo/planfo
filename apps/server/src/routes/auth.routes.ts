import { Router, type Request, type Response } from 'express';
import { LoginCredentialsSchema, type User } from '@cms/schemas';
import { UserStore } from '../storage/userStore.js';
import { verifyPassword, hashPassword } from '../auth/password.js';
import { createSession, destroySession } from '../auth/session.js';
import { requireAuth, loginRateLimiter } from '../auth/middleware.js';
import { SettingsStore } from '../storage/settingsStore.js';
import { logger } from '@cms/utils';

export const authRouter = Router();

// GET /api/auth/setup-status (Check if initial setup wizard is required)
authRouter.get('/setup-status', async (_req: Request, res: Response): Promise<void> => {
  const users = await UserStore.getAllUsers();
  const hasAdmin = users.some((u) => u.role === 'admin' && u.active);
  res.json({
    success: true,
    data: {
      isSetupRequired: !hasAdmin
    }
  });
});

// POST /api/auth/setup (Complete First-Run QuickLaunch Setup Wizard)
authRouter.post('/setup', async (req: Request, res: Response): Promise<void> => {
  const users = await UserStore.getAllUsers();
  const hasAdmin = users.some((u) => u.role === 'admin' && u.active);

  if (hasAdmin) {
    res.status(403).json({
      success: false,
      error: { code: 'SETUP_COMPLETED', message: 'Setup has already been completed.' }
    });
    return;
  }

  const { email, password, name, siteName, tagline, enableCatalog, themeId } = req.body;

  if (!email || !email.includes('@')) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'A valid email address is required.' }
    });
    return;
  }

  if (!password || password.length < 8) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters long.' }
    });
    return;
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const adminUser: User = {
    id: `usr_master_${Date.now()}`,
    email: email.trim().toLowerCase(),
    name: name || 'Admin',
    passwordHash,
    role: 'admin',
    active: true,
    createdAt: now,
    updatedAt: now
  };

  await UserStore.saveUser(adminUser);

  // Configure initial settings
  await SettingsStore.update({
    siteName: siteName?.trim() || 'Aero Static CMS',
    tagline: tagline?.trim() || 'Modern, high-performance static website',
    featurePacks: {
      catalog: Boolean(enableCatalog)
    },
    activeTheme: themeId || 'aero-modern'
  });

  const session = await createSession(adminUser, res);
  logger.audit('Initial QuickLaunch Setup Completed', { email: adminUser.email });

  res.json({
    success: true,
    data: {
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      },
      session
    }
  });
});

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

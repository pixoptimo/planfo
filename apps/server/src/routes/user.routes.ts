import { Router, type Request, type Response } from 'express';
import { CreateUserSchema, UpdateUserSchema, type User } from '@cms/schemas';
import { UserStore } from '../storage/userStore.js';
import { hashPassword } from '../auth/password.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { logger } from '@cms/utils';

export const userRouter = Router();

userRouter.use(requireAuth);

// GET /api/users
userRouter.get('/', requirePermission('users.read'), async (_req: Request, res: Response): Promise<void> => {
  const users = await UserStore.getAllUsers();
  const safeUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  }));
  res.json({ success: true, data: safeUsers });
});

// POST /api/users
userRouter.post('/', requirePermission('users.create'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = CreateUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid user data', details: parseResult.error.format() }
    });
    return;
  }

  const existing = await UserStore.findByEmail(parseResult.data.email);
  if (existing) {
    res.status(409).json({
      success: false,
      error: { code: 'USER_EXISTS', message: 'A user with this email already exists' }
    });
    return;
  }

  const passwordHash = await hashPassword(parseResult.data.password);
  const now = new Date().toISOString();
  const user: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email: parseResult.data.email,
    passwordHash,
    role: parseResult.data.role,
    name: parseResult.data.name || '',
    active: parseResult.data.active ?? true,
    createdAt: now,
    updatedAt: now
  };

  await UserStore.saveUser(user);
  logger.audit('User Created', { id: user.id, email: user.email, role: user.role });

  res.status(201).json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt
    }
  });
});

// PUT /api/users/:id
userRouter.put('/:id', requirePermission('users.update'), async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const user = await UserStore.findById(id);
  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' }
    });
    return;
  }

  const parseResult = UpdateUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid user update data', details: parseResult.error.format() }
    });
    return;
  }

  let newPasswordHash = user.passwordHash;
  if (parseResult.data.password) {
    newPasswordHash = await hashPassword(parseResult.data.password);
  }

  const updated: User = {
    ...user,
    email: parseResult.data.email ?? user.email,
    name: parseResult.data.name ?? user.name,
    role: parseResult.data.role ?? user.role,
    active: parseResult.data.active ?? user.active,
    passwordHash: newPasswordHash,
    updatedAt: new Date().toISOString()
  };

  await UserStore.saveUser(updated);
  logger.audit('User Updated', { id: updated.id, email: updated.email, role: updated.role });

  res.json({
    success: true,
    data: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      active: updated.active,
      updatedAt: updated.updatedAt
    }
  });
});

// DELETE /api/users/:id
userRouter.delete('/:id', requirePermission('users.delete'), async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  if (req.user?.id === id) {
    res.status(400).json({
      success: false,
      error: { code: 'CANNOT_DELETE_SELF', message: 'You cannot delete your own account' }
    });
    return;
  }

  const deleted = await UserStore.deleteUser(id);
  if (!deleted) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' }
    });
    return;
  }

  logger.audit('User Deleted', { id });
  res.json({ success: true, data: { message: 'User deleted' } });
});

import { Router, type Request, type Response } from 'express';
import { UpdateSiteSettingsSchema } from '@cms/schemas';
import { SettingsStore } from '../storage/settingsStore.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { logger } from '@cms/utils';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

// GET /api/settings
settingsRouter.get('/', requirePermission('settings.read'), async (_req: Request, res: Response): Promise<void> => {
  const settings = await SettingsStore.get();
  res.json({ success: true, data: settings });
});

// PUT /api/settings
settingsRouter.put('/', requirePermission('settings.update'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = UpdateSiteSettingsSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid settings data', details: parseResult.error.format() }
    });
    return;
  }

  const updated = await SettingsStore.update(parseResult.data);
  logger.audit('Settings Updated', { user: req.user?.email });
  res.json({ success: true, data: updated });
});

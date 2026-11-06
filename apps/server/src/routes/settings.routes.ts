import { triggerStaticBuild } from "../storage/buildTrigger.js";
import { Router, type Request, type Response } from 'express';
import { UpdateSiteSettingsSchema } from '@cms/schemas';
import { SettingsStore } from '../storage/settingsStore.js';
import { UrlRewriter } from '../storage/urlRewriter.js';
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
  triggerStaticBuild().catch(() => {});
  res.json({ success: true, data: updated });
});

// POST /api/settings/url-replace (Global URL & Permalink Search-Replace Tool)
settingsRouter.post('/url-replace', requirePermission('settings.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, replace, dryRun } = req.body;
    if (!search || typeof search !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Field "search" is required' }
      });
      return;
    }

    const result = await UrlRewriter.execute(search, replace || '', dryRun === true || dryRun === 'true');
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'REWRITE_FAILED', message: err instanceof Error ? err.message : 'URL search-replace failed' }
    });
  }
});

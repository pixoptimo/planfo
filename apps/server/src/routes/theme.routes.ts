import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { ThemeStore } from '../storage/themeStore.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { config } from '../config/env.js';
import { safeResolvePath, logger } from '@cms/utils';
import { StaticSiteGenerator } from '@cms/generator';

export const themeRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max for theme zip
});

// GET /api/themes/:id/thumbnail (public or cached thumbnail)
themeRouter.get('/:id/thumbnail', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const themeDir = safeResolvePath(config.THEMES_PATH, id);
    const manifestPath = path.join(themeDir, 'theme.json');

    if (!fs.existsSync(manifestPath)) {
      res.status(404).send('Not Found');
      return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const thumbRel = manifest.thumbnail || 'assets/thumbnail.svg';
    const thumbPath = safeResolvePath(themeDir, thumbRel);

    if (fs.existsSync(thumbPath)) {
      res.sendFile(thumbPath);
      return;
    }

    res.status(404).send('Thumbnail not found');
  } catch {
    res.status(404).send('Not found');
  }
});

// Protected routes below
themeRouter.use(requireAuth);

// GET /api/themes
themeRouter.get('/', requirePermission('settings.read'), async (_req: Request, res: Response): Promise<void> => {
  const themes = await ThemeStore.getAllThemes();
  res.json({ success: true, data: themes });
});

// GET /api/themes/templates
themeRouter.get('/templates', async (_req: Request, res: Response): Promise<void> => {
  const activeTheme = await ThemeStore.getActiveTheme();
  res.json({
    success: true,
    data: {
      activeTheme: activeTheme?.id || 'default',
      templates: activeTheme?.templates || ['default', 'landing']
    }
  });
});

// POST /api/themes/:id/activate
themeRouter.post('/:id/activate', requirePermission('settings.update'), async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const success = await ThemeStore.activateTheme(id);

  if (!success) {
    res.status(404).json({
      success: false,
      error: { code: 'THEME_NOT_FOUND', message: `Theme with id "${id}" not found` }
    });
    return;
  }

  // Automatically regenerate the static site so the new theme takes effect immediately
  let buildResult = null;
  try {
    const generator = new StaticSiteGenerator({
      storagePath: config.STORAGE_PATH,
      templatesPath: config.TEMPLATES_PATH,
      outputPath: config.OUTPUT_PATH
    });
    buildResult = await generator.build();
    logger.audit('Theme Activated & Site Regenerated', { themeId: id, user: req.user?.email, durationMs: buildResult.durationMs });
  } catch (err) {
    logger.error('Failed to regenerate site upon theme activation', { error: String(err) });
  }

  const allThemes = await ThemeStore.getAllThemes();
  res.json({
    success: true,
    data: {
      message: `Theme "${id}" activated and static site generated live!`,
      activeTheme: id,
      buildStats: buildResult?.stats,
      themes: allThemes
    }
  });
});

// POST /api/themes/install
themeRouter.post(
  '/install',
  requirePermission('settings.update'),
  upload.single('theme'),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No theme zip file provided in request' }
      });
      return;
    }

    const result = await ThemeStore.installTheme(req.file.buffer);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { code: 'INSTALL_FAILED', message: result.error || 'Failed to install theme' }
      });
      return;
    }

    logger.audit('Theme Installed', { themeId: result.themeId, user: req.user?.email });
    const allThemes = await ThemeStore.getAllThemes();
    res.json({
      success: true,
      data: {
        message: `Theme "${result.themeId}" installed successfully`,
        themeId: result.themeId,
        themes: allThemes
      }
    });
  }
);

// DELETE /api/themes - remove all uploaded/custom themes and reset to default
themeRouter.delete('/', requirePermission('settings.update'), async (req: Request, res: Response): Promise<void> => {
  const result = await ThemeStore.deleteAllUploadedThemes();

  if (!result.success) {
    res.status(500).json({
      success: false,
      error: { code: 'THEMES_CLEAN_FAILED', message: result.error || 'Failed to remove themes' }
    });
    return;
  }

  // Re-generate site with default theme
  try {
    const generator = new StaticSiteGenerator({
      storagePath: config.STORAGE_PATH,
      templatesPath: config.TEMPLATES_PATH,
      outputPath: config.OUTPUT_PATH
    });
    await generator.build();
    logger.audit('All Uploaded Themes Cleaned', { user: req.user?.email, deletedCount: result.deletedCount });
  } catch (err) {
    logger.warn('Failed to rebuild site after bulk theme deletion', { error: String(err) });
  }

  const allThemes = await ThemeStore.getAllThemes();
  res.json({
    success: true,
    data: {
      message: `Removed ${result.deletedCount} uploaded themes. Active theme reset to aero-modern.`,
      deletedCount: result.deletedCount,
      activeTheme: result.activeTheme,
      themes: allThemes
    }
  });
});

// DELETE /api/themes/:id - remove a specific theme
themeRouter.delete('/:id', requirePermission('settings.update'), async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const result = await ThemeStore.deleteTheme(id);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { code: 'THEME_DELETE_FAILED', message: result.error || `Failed to delete theme "${id}"` }
    });
    return;
  }

  // Re-run static generator if needed
  try {
    const generator = new StaticSiteGenerator({
      storagePath: config.STORAGE_PATH,
      templatesPath: config.TEMPLATES_PATH,
      outputPath: config.OUTPUT_PATH
    });
    await generator.build();
    logger.audit('Theme Deleted', { themeId: id, user: req.user?.email, newActiveTheme: result.activeTheme });
  } catch (err) {
    logger.warn('Failed to rebuild site after theme deletion', { error: String(err) });
  }

  const allThemes = await ThemeStore.getAllThemes();
  res.json({
    success: true,
    data: {
      message: `Theme "${id}" removed successfully.`,
      activeTheme: result.activeTheme,
      themes: allThemes
    }
  });
});

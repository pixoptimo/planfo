import { Router, type Request, type Response } from 'express';
import { StaticSiteGenerator } from '@cms/generator';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { config } from '../config/env.js';
import { logger } from '@cms/utils';

export const publishRouter = Router();

publishRouter.use(requireAuth);

// POST /api/publish
publishRouter.post('/', requirePermission('publish.all'), async (req: Request, res: Response): Promise<void> => {
  try {
    const generator = new StaticSiteGenerator({
      storagePath: config.STORAGE_PATH,
      templatesPath: config.TEMPLATES_PATH,
      outputPath: config.OUTPUT_PATH
    });

    const result = await generator.build();
    logger.audit('Site Published via API', { user: req.user?.email, durationMs: result.durationMs });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    logger.error('Publishing failed', { error: String(err) });
    res.status(500).json({
      success: false,
      error: {
        code: 'PUBLISH_FAILED',
        message: err instanceof Error ? err.message : 'Failed to publish static website'
      }
    });
  }
});

import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { DemoStore } from '../storage/demoStore.js';
import { triggerStaticBuild } from '../storage/buildTrigger.js';
import { BlueprintEntryStore } from '../storage/blueprintStore.js';
import { logger } from '@cms/utils';

export const demoRouter = Router();

// GET /api/demos/info/:slug - public info lookup for live template demo configuration
demoRouter.get('/info/:slug', async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug || '').trim();
  if (!slug) {
    res.status(400).json({ success: false, error: 'Missing slug' });
    return;
  }
  try {
    const entry = await BlueprintEntryStore.getBySlug('templates', slug);
    if (entry) {
      const d = entry.data || {};
      res.json({
        success: true,
        data: {
          id: entry.slug,
          title: entry.title,
          demoUrl: typeof d.demoUrl === 'string' ? d.demoUrl : '',
          downloadFile: d.downloadFile || d.demoUrl || ''
        }
      });
      return;
    }
  } catch {}
  res.json({
    success: true,
    data: {
      id: slug,
      demoUrl: `demos/${slug}/index.html`
    }
  });
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max ZIP size
  },
  fileFilter: (_req, file, cb) => {
    const isZip =
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed' ||
      file.mimetype === 'multipart/x-zip' ||
      file.originalname.toLowerCase().endsWith('.zip');

    if (isZip) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip archive files are allowed for template demos'));
    }
  }
});

demoRouter.use(requireAuth);

// POST /api/demos/upload - upload & extract a demo ZIP bundle
demoRouter.post(
  '/upload',
  requirePermission('media.upload'),
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No ZIP file was uploaded' }
        });
        return;
      }

      const slug = String(req.body.slug || req.query.slug || '').trim() ||
        req.file.originalname.replace(/\.zip$/i, '') ||
        `demo-${Date.now()}`;

      const result = await DemoStore.extractDemoZip(slug, req.file.buffer);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: { code: 'EXTRACT_FAILED', message: result.error || 'Failed to extract demo ZIP' }
        });
        return;
      }

      // Trigger background static build so generated site includes the new demo
      triggerStaticBuild().catch(() => {});

      logger.audit('Demo Upload Completed', {
        slug,
        demoUrl: result.demoUrl,
        downloadFile: result.downloadFile,
        user: req.user?.email
      });

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      logger.error('Demo upload route error', { error: String(err) });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err instanceof Error ? err.message : 'Demo upload failed' }
      });
    }
  }
);

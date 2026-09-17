import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import { UpdateMediaSchema } from '@cms/schemas';
import { MediaStore } from '../storage/mediaStore.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { logger } from '@cms/utils';

export const mediaRouter = Router();

mediaRouter.use(requireAuth);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPG, PNG, WEBP, GIF, and SVG images are allowed.'));
    }
    cb(null, true);
  }
});

// GET /api/media
mediaRouter.get('/', requirePermission('media.read'), async (_req: Request, res: Response): Promise<void> => {
  const items = await MediaStore.getAll();
  res.json({ success: true, data: items });
});

// POST /api/media/upload
mediaRouter.post(
  '/upload',
  requirePermission('media.upload'),
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE_UPLOADED', message: 'No file was uploaded' }
      });
      return;
    }

    try {
      const alt = (req.body.alt as string) || '';
      const item = await MediaStore.saveUpload(req.file, alt);
      logger.audit('Media Uploaded', { id: item.id, filename: item.filename, size: item.size });
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      logger.error('Media upload failed', { error: String(err) });
      res.status(500).json({
        success: false,
        error: { code: 'UPLOAD_FAILED', message: 'Failed to process and save uploaded file' }
      });
    }
  }
);

// PUT /api/media/:id
mediaRouter.put('/:id', requirePermission('media.upload'), async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const item = await MediaStore.getById(id);
  if (!item) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Media item not found' }
    });
    return;
  }

  const parseResult = UpdateMediaSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid media update data' }
    });
    return;
  }

  const updated = {
    ...item,
    ...parseResult.data
  };

  await MediaStore.saveItem(updated);
  res.json({ success: true, data: updated });
});

// DELETE /api/media/:id
mediaRouter.delete('/:id', requirePermission('media.delete'), async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const deleted = await MediaStore.deleteItem(id);
  if (!deleted) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Media item not found' }
    });
    return;
  }
  logger.audit('Media Deleted', { id });
  res.json({ success: true, data: { message: 'Media deleted successfully' } });
});

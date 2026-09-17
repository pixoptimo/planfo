import { Router, type Request, type Response } from 'express';
import { ContentTypeSchema } from '@cms/schemas';
import { RevisionStore } from '../storage/revisionStore.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';

export const revisionRouter = Router();

revisionRouter.use(requireAuth);

// GET /api/revisions/:contentType/:slug
revisionRouter.get('/:contentType/:slug', requirePermission('revisions.read'), async (req: Request, res: Response): Promise<void> => {
  const parseType = ContentTypeSchema.safeParse(req.params.contentType);
  if (!parseType.success) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_CONTENT_TYPE', message: 'Content type must be page, post, or product' }
    });
    return;
  }

  const slug = String(req.params.slug);
  const revisions = await RevisionStore.getRevisions(parseType.data, slug);
  res.json({ success: true, data: revisions });
});

// GET /api/revisions/:contentType/:slug/:revisionId
revisionRouter.get('/:contentType/:slug/:revisionId', requirePermission('revisions.read'), async (req: Request, res: Response): Promise<void> => {
  const parseType = ContentTypeSchema.safeParse(req.params.contentType);
  if (!parseType.success) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_CONTENT_TYPE', message: 'Content type must be page, post, or product' }
    });
    return;
  }

  const slug = String(req.params.slug);
  const revisionId = String(req.params.revisionId);
  const revision = await RevisionStore.getRevisionById(parseType.data, slug, revisionId);
  if (!revision) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Revision not found' }
    });
    return;
  }

  res.json({ success: true, data: revision });
});

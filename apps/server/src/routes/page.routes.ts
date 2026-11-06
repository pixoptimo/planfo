import { Router, type Request, type Response } from 'express';
import { CreatePageSchema, UpdatePageSchema, type Page } from '@cms/schemas';
import { PageStore } from '../storage/pageStore.js';
import { TrashStore } from '../storage/trashStore.js';
import { RevisionStore } from '../storage/revisionStore.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { slugify, makeUniqueSlug, logger } from '@cms/utils';
import { triggerStaticBuild } from '../storage/buildTrigger.js';

export const pageRouter = Router();

pageRouter.use(requireAuth);

// GET /api/pages
pageRouter.get('/', requirePermission('pages.read'), async (_req: Request, res: Response): Promise<void> => {
  const pages = await PageStore.getAll();
  res.json({ success: true, data: pages });
});

// GET /api/pages/:slug
pageRouter.get('/:slug', requirePermission('pages.read'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const page = await PageStore.getBySlug(slug);
  if (!page) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Page with slug "${slug}" not found` }
    });
    return;
  }
  res.json({ success: true, data: page });
});

// POST /api/pages
pageRouter.post('/', requirePermission('pages.create'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = CreatePageSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid page data', details: parseResult.error.format() }
    });
    return;
  }

  const existingPages = await PageStore.getAll();
  const existingSlugs = existingPages.map((p) => p.slug);

  let slug = parseResult.data.slug ? slugify(parseResult.data.slug) : slugify(parseResult.data.title);
  slug = makeUniqueSlug(slug, existingSlugs);

  const now = new Date().toISOString();
  const newPage: Page = {
    id: `page_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: parseResult.data.title,
    slug,
    status: parseResult.data.status || 'draft',
    template: parseResult.data.template || 'default',
    content: parseResult.data.content || { blocks: [] },
    featuredImage: parseResult.data.featuredImage || '',
    noIndex: parseResult.data.noIndex ?? false,
    seo: parseResult.data.seo || {
      title: parseResult.data.title,
      description: '',
      canonical: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      robots: 'index,follow',
      noIndex: false
    },
    createdAt: now,
    updatedAt: now,
    publishedAt: parseResult.data.status === 'published' ? now : null
  };

  await PageStore.save(newPage);
  logger.audit('Page Created', { id: newPage.id, slug: newPage.slug, user: req.user?.email });

  res.status(201).json({ success: true, data: newPage });
});

// PUT /api/pages/:slug
pageRouter.put('/:slug', requirePermission('pages.update'), async (req: Request, res: Response): Promise<void> => {
  const currentSlug = String(req.params.slug);
  const current = await PageStore.getBySlug(currentSlug);
  if (!current) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Page "${currentSlug}" not found` }
    });
    return;
  }

  const parseResult = UpdatePageSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid update data', details: parseResult.error.format() }
    });
    return;
  }

  let newSlug = current.slug;
  if (parseResult.data.slug && parseResult.data.slug !== current.slug) {
    const existing = await PageStore.getAll();
    const existingSlugs = existing.map((p) => p.slug);
    newSlug = makeUniqueSlug(slugify(parseResult.data.slug), existingSlugs, current.id, existing);
  }

  const now = new Date().toISOString();
  const willBePublished = parseResult.data.status === 'published';

  const updatedPage: Page = {
    ...current,
    ...parseResult.data,
    slug: newSlug,
    updatedAt: now,
    publishedAt: willBePublished ? (current.publishedAt || now) : (parseResult.data.status === 'draft' ? null : current.publishedAt)
  };

  await PageStore.save(updatedPage, current.slug);

  if (updatedPage.status === 'published') {
    await RevisionStore.createRevision(
      'page',
      updatedPage.id,
      updatedPage.slug,
      updatedPage as unknown as Record<string, unknown>,
      req.user?.email,
      'Updated and published'
    );
  }

  logger.audit('Page Updated', { id: updatedPage.id, slug: updatedPage.slug, user: req.user?.email });
  triggerStaticBuild().catch(() => {});
  res.json({ success: true, data: updatedPage });
});

// DELETE /api/pages/:slug
pageRouter.delete('/:slug', requirePermission('pages.delete'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const current = await PageStore.getBySlug(slug);
  if (!current) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Page "${slug}" not found` }
    });
    return;
  }

  await TrashStore.moveToTrash('page', current, req.user?.email);
  await PageStore.delete(current.slug);
  logger.audit('Page Deleted', { id: current.id, slug: current.slug, user: req.user?.email });
  triggerStaticBuild().catch(() => {});
  res.json({ success: true, data: { message: `Page "${current.slug}" deleted successfully` } });
});

// GET /api/pages/:slug/revisions
pageRouter.get('/:slug/revisions', requirePermission('revisions.read'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const revisions = await RevisionStore.getRevisions('page', slug);
  res.json({ success: true, data: revisions });
});

// POST /api/pages/:slug/revisions/:revisionId/restore
pageRouter.post('/:slug/revisions/:revisionId/restore', requirePermission('revisions.restore'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const revisionId = String(req.params.revisionId);
  const revision = await RevisionStore.getRevisionById('page', slug, revisionId);
  if (!revision) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Revision not found' }
    });
    return;
  }

  const restoredPage = revision.data as unknown as Page;
  restoredPage.updatedAt = new Date().toISOString();

  await PageStore.save(restoredPage, slug);
  await RevisionStore.createRevision(
    'page',
    restoredPage.id,
    restoredPage.slug,
    restoredPage as unknown as Record<string, unknown>,
    req.user?.email,
    `Restored from version ${revision.version}`
  );

  logger.audit('Page Revision Restored', { id: restoredPage.id, slug: restoredPage.slug, fromVersion: revision.version });
  res.json({ success: true, data: restoredPage, message: `Restored to version ${revision.version}` });
});

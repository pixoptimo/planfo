import { Router, type Request, type Response } from 'express';
import { CreatePostSchema, UpdatePostSchema, type Post } from '@cms/schemas';
import { PostStore } from '../storage/postStore.js';
import { RevisionStore } from '../storage/revisionStore.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { slugify, makeUniqueSlug, logger } from '@cms/utils';

export const postRouter = Router();

postRouter.use(requireAuth);

// GET /api/posts
postRouter.get('/', requirePermission('posts.read'), async (_req: Request, res: Response): Promise<void> => {
  const posts = await PostStore.getAll();
  res.json({ success: true, data: posts });
});

// GET /api/posts/:slug
postRouter.get('/:slug', requirePermission('posts.read'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const post = await PostStore.getBySlug(slug);
  if (!post) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Post with slug "${slug}" not found` }
    });
    return;
  }
  res.json({ success: true, data: post });
});

// POST /api/posts
postRouter.post('/', requirePermission('posts.create'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = CreatePostSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid post data', details: parseResult.error.format() }
    });
    return;
  }

  const existingPosts = await PostStore.getAll();
  const existingSlugs = existingPosts.map((p) => p.slug);

  let slug = parseResult.data.slug ? slugify(parseResult.data.slug) : slugify(parseResult.data.title);
  slug = makeUniqueSlug(slug, existingSlugs);

  const now = new Date().toISOString();
  const newPost: Post = {
    id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: parseResult.data.title,
    slug,
    excerpt: parseResult.data.excerpt || '',
    content: parseResult.data.content || { blocks: [] },
    featuredImage: parseResult.data.featuredImage || '',
    author: parseResult.data.author || req.user?.name || req.user?.email || 'Admin',
    category: parseResult.data.category || 'general',
    tags: parseResult.data.tags || [],
    status: parseResult.data.status || 'draft',
    template: parseResult.data.template || 'default',
    seo: parseResult.data.seo || {
      title: parseResult.data.title,
      description: parseResult.data.excerpt || '',
      canonical: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      robots: 'index,follow'
    },
    createdAt: now,
    updatedAt: now,
    publishedAt: parseResult.data.status === 'published' ? now : null
  };

  await PostStore.save(newPost);
  logger.audit('Post Created', { id: newPost.id, slug: newPost.slug, user: req.user?.email });

  res.status(201).json({ success: true, data: newPost });
});

// PUT /api/posts/:slug
postRouter.put('/:slug', requirePermission('posts.update'), async (req: Request, res: Response): Promise<void> => {
  const currentSlug = String(req.params.slug);
  const current = await PostStore.getBySlug(currentSlug);
  if (!current) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Post "${currentSlug}" not found` }
    });
    return;
  }

  const parseResult = UpdatePostSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid update data', details: parseResult.error.format() }
    });
    return;
  }

  let newSlug = current.slug;
  if (parseResult.data.slug && parseResult.data.slug !== current.slug) {
    const existing = await PostStore.getAll();
    const existingSlugs = existing.map((p) => p.slug);
    newSlug = makeUniqueSlug(slugify(parseResult.data.slug), existingSlugs, current.id, existing);
  }

  const now = new Date().toISOString();
  const willBePublished = parseResult.data.status === 'published';

  const updatedPost: Post = {
    ...current,
    ...parseResult.data,
    slug: newSlug,
    updatedAt: now,
    publishedAt: willBePublished ? (current.publishedAt || now) : (parseResult.data.status === 'draft' ? null : current.publishedAt)
  };

  await PostStore.save(updatedPost, current.slug);

  if (updatedPost.status === 'published') {
    await RevisionStore.createRevision(
      'post',
      updatedPost.id,
      updatedPost.slug,
      updatedPost as unknown as Record<string, unknown>,
      req.user?.email,
      'Updated and published'
    );
  }

  logger.audit('Post Updated', { id: updatedPost.id, slug: updatedPost.slug, user: req.user?.email });
  res.json({ success: true, data: updatedPost });
});

// DELETE /api/posts/:slug
postRouter.delete('/:slug', requirePermission('posts.delete'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const current = await PostStore.getBySlug(slug);
  if (!current) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Post "${slug}" not found` }
    });
    return;
  }

  await PostStore.delete(current.slug);
  logger.audit('Post Deleted', { id: current.id, slug: current.slug, user: req.user?.email });
  res.json({ success: true, data: { message: `Post "${current.slug}" deleted successfully` } });
});

// GET /api/posts/:slug/revisions
postRouter.get('/:slug/revisions', requirePermission('revisions.read'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const revisions = await RevisionStore.getRevisions('post', slug);
  res.json({ success: true, data: revisions });
});

// POST /api/posts/:slug/revisions/:revisionId/restore
postRouter.post('/:slug/revisions/:revisionId/restore', requirePermission('revisions.restore'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const revisionId = String(req.params.revisionId);
  const revision = await RevisionStore.getRevisionById('post', slug, revisionId);
  if (!revision) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Revision not found' }
    });
    return;
  }

  const restoredPost = revision.data as unknown as Post;
  restoredPost.updatedAt = new Date().toISOString();

  await PostStore.save(restoredPost, slug);
  await RevisionStore.createRevision(
    'post',
    restoredPost.id,
    restoredPost.slug,
    restoredPost as unknown as Record<string, unknown>,
    req.user?.email,
    `Restored from version ${revision.version}`
  );

  logger.audit('Post Revision Restored', { id: restoredPost.id, slug: restoredPost.slug, fromVersion: revision.version });
  res.json({ success: true, data: restoredPost, message: `Restored to version ${revision.version}` });
});

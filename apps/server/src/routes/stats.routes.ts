import { Router, type Request, type Response } from 'express';
import type { DashboardStats } from '@cms/types';
import { PageStore } from '../storage/pageStore.js';
import { PostStore } from '../storage/postStore.js';
import { ProductStore } from '../storage/productStore.js';
import { CategoryStore } from '../storage/categoryStore.js';
import { MediaStore } from '../storage/mediaStore.js';
import { requireAuth } from '../auth/middleware.js';

export const statsRouter = Router();

statsRouter.use(requireAuth);

// GET /api/stats
statsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  const [pages, posts, products, categories, media] = await Promise.all([
    PageStore.getAll(),
    PostStore.getAll(),
    ProductStore.getAll(),
    CategoryStore.getAll(),
    MediaStore.getAll()
  ]);

  const draftsCount =
    pages.filter((p) => p.status === 'draft').length +
    posts.filter((p) => p.status === 'draft').length +
    products.filter((p) => p.status === 'draft').length;

  const combinedRecent = [
    ...pages.map((p) => ({ id: p.id, title: p.title, type: 'page' as const, slug: p.slug, status: p.status, updatedAt: p.updatedAt })),
    ...posts.map((p) => ({ id: p.id, title: p.title, type: 'post' as const, slug: p.slug, status: p.status, updatedAt: p.updatedAt })),
    ...products.map((p) => ({ id: p.id, title: p.name, type: 'product' as const, slug: p.slug, status: p.status, updatedAt: p.updatedAt }))
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
   .slice(0, 10);

  const stats: DashboardStats = {
    pagesCount: pages.length,
    postsCount: posts.length,
    productsCount: products.length,
    draftsCount,
    mediaCount: media.length,
    categoriesCount: categories.length,
    recentlyUpdated: combinedRecent
  };

  res.json({ success: true, data: stats });
});

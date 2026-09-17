import { Router, type Request, type Response } from 'express';
import { CreateCategorySchema, UpdateCategorySchema, type Category } from '@cms/schemas';
import { CategoryStore } from '../storage/categoryStore.js';
import { PostStore } from '../storage/postStore.js';
import { ProductStore } from '../storage/productStore.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { slugify, makeUniqueSlug, logger } from '@cms/utils';

export const categoryRouter = Router();

categoryRouter.use(requireAuth);

// GET /api/categories
categoryRouter.get('/', requirePermission('categories.read'), async (req: Request, res: Response): Promise<void> => {
  const type = req.query.type as string | undefined;
  let categories = await CategoryStore.getAll();
  if (type === 'post' || type === 'product') {
    categories = categories.filter((c) => c.type === type);
  }
  res.json({ success: true, data: categories });
});

// POST /api/categories
categoryRouter.post('/', requirePermission('categories.create'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = CreateCategorySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid category data', details: parseResult.error.format() }
    });
    return;
  }

  const existing = await CategoryStore.getAll();
  const existingSlugs = existing.map((c) => c.slug);

  let slug = parseResult.data.slug ? slugify(parseResult.data.slug) : slugify(parseResult.data.name);
  slug = makeUniqueSlug(slug, existingSlugs);

  const now = new Date().toISOString();
  const category: Category = {
    id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: parseResult.data.name,
    slug,
    type: parseResult.data.type || 'post',
    description: parseResult.data.description || '',
    createdAt: now,
    updatedAt: now
  };

  await CategoryStore.save(category);
  logger.audit('Category Created', { id: category.id, name: category.name });
  res.status(201).json({ success: true, data: category });
});

// PUT /api/categories/:id
categoryRouter.put('/:id', requirePermission('categories.update'), async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const current = await CategoryStore.getById(id);
  if (!current) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Category not found' }
    });
    return;
  }

  const parseResult = UpdateCategorySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid category update data', details: parseResult.error.format() }
    });
    return;
  }

  let slug = current.slug;
  if (parseResult.data.slug && parseResult.data.slug !== current.slug) {
    const existing = await CategoryStore.getAll();
    const existingSlugs = existing.map((c) => c.slug);
    slug = makeUniqueSlug(slugify(parseResult.data.slug), existingSlugs, current.id, existing);
  }

  const updated: Category = {
    ...current,
    ...parseResult.data,
    slug,
    updatedAt: new Date().toISOString()
  };

  await CategoryStore.save(updated);
  logger.audit('Category Updated', { id: updated.id, name: updated.name });
  res.json({ success: true, data: updated });
});

// DELETE /api/categories/:id
categoryRouter.delete('/:id', requirePermission('categories.delete'), async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const deleted = await CategoryStore.delete(id);
  if (!deleted) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Category not found' }
    });
    return;
  }
  logger.audit('Category Deleted', { id });
  res.json({ success: true, data: { message: 'Category deleted' } });
});

// GET /api/categories/tags/all
categoryRouter.get('/tags/all', requirePermission('categories.read'), async (_req: Request, res: Response): Promise<void> => {
  const posts = await PostStore.getAll();
  const products = await ProductStore.getAll();

  const tagsSet = new Set<string>();
  posts.forEach((p) => (p.tags || []).forEach((t) => tagsSet.add(t)));
  products.forEach((pr) => (pr.tags || []).forEach((t) => tagsSet.add(t)));

  res.json({ success: true, data: Array.from(tagsSet).sort() });
});

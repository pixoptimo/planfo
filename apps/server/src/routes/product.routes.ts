import { triggerStaticBuild } from "../storage/buildTrigger.js";
import { Router, type Request, type Response } from 'express';
import { CreateProductSchema, UpdateProductSchema, type Product } from '@cms/schemas';
import { ProductStore } from '../storage/productStore.js';
import { TrashStore } from '../storage/trashStore.js';
import { RevisionStore } from '../storage/revisionStore.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { slugify, makeUniqueSlug, logger } from '@cms/utils';

export const productRouter = Router();

productRouter.use(requireAuth);

// GET /api/products
productRouter.get('/', requirePermission('products.read'), async (_req: Request, res: Response): Promise<void> => {
  const products = await ProductStore.getAll();
  res.json({ success: true, data: products });
});

// GET /api/products/:slug
productRouter.get('/:slug', requirePermission('products.read'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const product = await ProductStore.getBySlug(slug);
  if (!product) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Product with slug "${slug}" not found` }
    });
    return;
  }
  res.json({ success: true, data: product });
});

// POST /api/products
productRouter.post('/', requirePermission('products.create'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = CreateProductSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid product data', details: parseResult.error.format() }
    });
    return;
  }

  const existingProducts = await ProductStore.getAll();
  const existingSlugs = existingProducts.map((p) => p.slug);

  let slug = parseResult.data.slug ? slugify(parseResult.data.slug) : slugify(parseResult.data.name);
  slug = makeUniqueSlug(slug, existingSlugs);

  const now = new Date().toISOString();
  const newProduct: Product = {
    id: `product_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: parseResult.data.name,
    slug,
    sku: parseResult.data.sku || '',
    price: parseResult.data.price ?? 0,
    currency: parseResult.data.currency || 'USD',
    shortDescription: parseResult.data.shortDescription || '',
    description: parseResult.data.description || { blocks: [] },
    images: parseResult.data.images || [],
    category: parseResult.data.category || 'general',
    tags: parseResult.data.tags || [],
    status: parseResult.data.status || 'draft',
    featured: parseResult.data.featured || false,
    template: parseResult.data.template || 'default',
    seo: parseResult.data.seo || {
      title: parseResult.data.name,
      description: parseResult.data.shortDescription || '',
      canonical: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: parseResult.data.images?.[0] || '',
      robots: 'index,follow',
      noIndex: false
    },
    createdAt: now,
    updatedAt: now,
    publishedAt: parseResult.data.status === 'published' ? now : null
  };

  await ProductStore.save(newProduct);
  logger.audit('Product Created', { id: newProduct.id, slug: newProduct.slug, user: req.user?.email });

  triggerStaticBuild().catch(() => {});
  res.status(201).json({ success: true, data: newProduct });
});

// PUT /api/products/:slug
productRouter.put('/:slug', requirePermission('products.update'), async (req: Request, res: Response): Promise<void> => {
  const currentSlug = String(req.params.slug);
  const current = await ProductStore.getBySlug(currentSlug);
  if (!current) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Product "${currentSlug}" not found` }
    });
    return;
  }

  const parseResult = UpdateProductSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid update data', details: parseResult.error.format() }
    });
    return;
  }

  let newSlug = current.slug;
  if (parseResult.data.slug && parseResult.data.slug !== current.slug) {
    const existing = await ProductStore.getAll();
    const existingSlugs = existing.map((p) => p.slug);
    newSlug = makeUniqueSlug(slugify(parseResult.data.slug), existingSlugs, current.id, existing);
  }

  const now = new Date().toISOString();
  const willBePublished = parseResult.data.status === 'published';

  const updatedProduct: Product = {
    ...current,
    ...parseResult.data,
    slug: newSlug,
    updatedAt: now,
    publishedAt: willBePublished ? (current.publishedAt || now) : (parseResult.data.status === 'draft' ? null : current.publishedAt)
  };

  await ProductStore.save(updatedProduct, current.slug);

  if (updatedProduct.status === 'published') {
    await RevisionStore.createRevision(
      'product',
      updatedProduct.id,
      updatedProduct.slug,
      updatedProduct as unknown as Record<string, unknown>,
      req.user?.email,
      'Updated and published'
    );
  }

  logger.audit('Product Updated', { id: updatedProduct.id, slug: updatedProduct.slug, user: req.user?.email });
  triggerStaticBuild().catch(() => {});
  res.json({ success: true, data: updatedProduct });
});

// DELETE /api/products/:slug
productRouter.delete('/:slug', requirePermission('products.delete'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const current = await ProductStore.getBySlug(slug);
  if (!current) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Product "${slug}" not found` }
    });
    return;
  }

  await TrashStore.moveToTrash('product', current, req.user?.email);
  await ProductStore.delete(current.slug);
  logger.audit('Product Deleted', { id: current.id, slug: current.slug, user: req.user?.email });
  triggerStaticBuild().catch(() => {});
  res.json({ success: true, data: { message: `Product "${current.slug}" deleted successfully` } });
});

// GET /api/products/:slug/revisions
productRouter.get('/:slug/revisions', requirePermission('revisions.read'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const revisions = await RevisionStore.getRevisions('product', slug);
  res.json({ success: true, data: revisions });
});

// POST /api/products/:slug/revisions/:revisionId/restore
productRouter.post('/:slug/revisions/:revisionId/restore', requirePermission('revisions.restore'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const revisionId = String(req.params.revisionId);
  const revision = await RevisionStore.getRevisionById('product', slug, revisionId);
  if (!revision) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Revision not found' }
    });
    return;
  }

  const restoredProduct = revision.data as unknown as Product;
  restoredProduct.updatedAt = new Date().toISOString();

  await ProductStore.save(restoredProduct, slug);
  await RevisionStore.createRevision(
    'product',
    restoredProduct.id,
    restoredProduct.slug,
    restoredProduct as unknown as Record<string, unknown>,
    req.user?.email,
    `Restored from version ${revision.version}`
  );

  logger.audit('Product Revision Restored', { id: restoredProduct.id, slug: restoredProduct.slug, fromVersion: revision.version });
  triggerStaticBuild().catch(() => {});
  res.json({ success: true, data: restoredProduct, message: `Restored to version ${revision.version}` });
});

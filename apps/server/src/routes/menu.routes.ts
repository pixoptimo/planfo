import { triggerStaticBuild } from "../storage/buildTrigger.js";
import { Router, type Request, type Response } from 'express';
import { CreateMenuSchema, UpdateMenuSchema } from '@cms/schemas';
import { MenuStore } from '../storage/menuStore.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { logger, slugify } from '@cms/utils';

export const menuRouter = Router();

menuRouter.use(requireAuth);

// GET /api/menus - List all menus
menuRouter.get('/', requirePermission('menus.read'), async (_req: Request, res: Response): Promise<void> => {
  const menus = await MenuStore.list();
  res.json({ success: true, data: menus });
});

// POST /api/menus - Create a new menu
menuRouter.post('/', requirePermission('menus.create'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = CreateMenuSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid menu input', details: parseResult.error.format() }
    });
    return;
  }

  const name = parseResult.data.name;
  let slug = parseResult.data.slug || slugify(name);
  if (!slug) slug = `menu-${Date.now().toString(36)}`;

  const existing = await MenuStore.get(slug);
  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const newMenu = {
    id: `menu_${slug}`,
    name,
    slug,
    location: parseResult.data.location || '',
    locations: parseResult.data.locations || (parseResult.data.location ? [parseResult.data.location] : []),
    items: parseResult.data.items || [],
    updatedAt: new Date().toISOString()
  };

  await MenuStore.save(newMenu);
  logger.audit('Menu Created', { slug, name });
  triggerStaticBuild().catch(() => {});
  res.status(201).json({ success: true, data: newMenu });
});

// GET /api/menus/:slug - Get single menu by slug
menuRouter.get('/:slug', requirePermission('menus.read'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const menu = await MenuStore.get(slug);
  if (!menu) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Menu "${slug}" not found` }
    });
    return;
  }
  res.json({ success: true, data: menu });
});

// PUT /api/menus/:slug - Update menu
menuRouter.put('/:slug', requirePermission('menus.update'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const parseResult = UpdateMenuSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid menu structure', details: parseResult.error.format() }
    });
    return;
  }

  const existing = await MenuStore.get(slug);
  const locations = parseResult.data.locations !== undefined
    ? parseResult.data.locations
    : (parseResult.data.location ? [parseResult.data.location] : (existing?.locations || []));

  const updatedMenu = {
    id: existing?.id || `menu_${slug}`,
    name: parseResult.data.name || existing?.name || 'Navigation Menu',
    slug,
    location: parseResult.data.location !== undefined ? parseResult.data.location : (existing?.location || locations[0] || ''),
    locations,
    items: parseResult.data.items !== undefined ? parseResult.data.items : (existing?.items || []),
    updatedAt: new Date().toISOString()
  };

  await MenuStore.save(updatedMenu);
  logger.audit('Menu Updated', { slug, itemCount: updatedMenu.items.length, locations: updatedMenu.locations });
  triggerStaticBuild().catch(() => {});
  res.json({ success: true, data: updatedMenu });
});

// DELETE /api/menus/:slug - Delete menu
menuRouter.delete('/:slug', requirePermission('menus.delete'), async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  if (slug === 'main') {
    res.status(400).json({
      success: false,
      error: { code: 'FORBIDDEN_OPERATION', message: 'Cannot delete default main menu' }
    });
    return;
  }

  try {
    const deleted = await MenuStore.delete(slug);
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Menu "${slug}" not found` }
      });
      return;
    }
    logger.audit('Menu Deleted', { slug });
    triggerStaticBuild().catch(() => {});
    res.json({ success: true, message: `Menu "${slug}" deleted successfully` });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: err instanceof Error ? err.message : 'Failed to delete menu' }
    });
  }
});

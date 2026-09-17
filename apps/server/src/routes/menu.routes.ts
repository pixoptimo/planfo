import { Router, type Request, type Response } from 'express';
import { UpdateMenuSchema } from '@cms/schemas';
import { MenuStore } from '../storage/menuStore.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { logger } from '@cms/utils';

export const menuRouter = Router();

menuRouter.use(requireAuth);

// GET /api/menus/:slug?
menuRouter.get('/:slug?', requirePermission('menus.read'), async (req: Request, res: Response): Promise<void> => {
  const slug = req.params.slug ? String(req.params.slug) : 'main';
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

// PUT /api/menus/:slug?
menuRouter.put('/:slug?', requirePermission('menus.update'), async (req: Request, res: Response): Promise<void> => {
  const slug = req.params.slug ? String(req.params.slug) : 'main';
  const parseResult = UpdateMenuSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid menu structure', details: parseResult.error.format() }
    });
    return;
  }

  const existing = await MenuStore.get(slug);
  const updatedMenu = {
    id: existing?.id || `menu_${slug}`,
    name: parseResult.data.name || existing?.name || 'Main Navigation',
    slug,
    items: parseResult.data.items,
    updatedAt: new Date().toISOString()
  };

  await MenuStore.save(updatedMenu);
  logger.audit('Menu Updated', { slug, itemCount: updatedMenu.items.length });
  res.json({ success: true, data: updatedMenu });
});

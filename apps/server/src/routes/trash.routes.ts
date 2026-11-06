import { Router, type Request, type Response } from 'express';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { TrashStore } from '../storage/trashStore.js';
import { triggerStaticBuild } from '../storage/buildTrigger.js';
import { logger } from '@cms/utils';

export const trashRouter = Router();

trashRouter.use(requireAuth);

// GET /api/trash - list all items in trash
trashRouter.get('/', requirePermission('pages.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await TrashStore.getAll();
    const typeFilter = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;

    let filtered = items;
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter((i) => i.entityType === typeFilter);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.originalSlug.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: filtered });
  } catch (err) {
    logger.error('Failed to list trash items', { error: String(err) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to retrieve trash items' } });
  }
});

// GET /api/trash/count - quick item count
trashRouter.get('/count', async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await TrashStore.getCount();
    res.json({ success: true, data: { count } });
  } catch {
    res.json({ success: true, data: { count: 0 } });
  }
});

// POST /api/trash/:trashId/restore - restore an item
trashRouter.post('/:trashId/restore', requirePermission('pages.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const trashId = String(req.params.trashId);
    const result = await TrashStore.restore(trashId, req.user?.email);
    if (!result.success) {
      res.status(400).json({ success: false, error: { code: 'RESTORE_FAILED', message: result.error || 'Failed to restore item' } });
      return;
    }

    triggerStaticBuild().catch(() => {});
    res.json({ success: true, data: { message: `"${result.item?.title}" restored successfully`, item: result.item } });
  } catch (err) {
    logger.error('Failed to restore trash item', { error: String(err) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to restore item' } });
  }
});

// DELETE /api/trash/:trashId - permanently delete single item
trashRouter.delete('/:trashId', requirePermission('pages.delete'), async (req: Request, res: Response): Promise<void> => {
  try {
    const trashId = String(req.params.trashId);
    const ok = await TrashStore.deletePermanently(trashId, req.user?.email);
    if (!ok) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found in trash' } });
      return;
    }

    res.json({ success: true, data: { message: 'Item permanently deleted' } });
  } catch (err) {
    logger.error('Failed to permanently delete trash item', { error: String(err) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to permanently delete item' } });
  }
});

// DELETE /api/trash - empty trash
trashRouter.delete('/', requirePermission('pages.delete'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await TrashStore.emptyTrash(req.user?.email);
    res.json({ success: true, data: { message: `Trash emptied (${result.deletedCount} items permanently deleted)`, deletedCount: result.deletedCount } });
  } catch (err) {
    logger.error('Failed to empty trash', { error: String(err) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to empty trash' } });
  }
});

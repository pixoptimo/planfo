import { Router, type Request, type Response } from 'express';
import { BackupStore } from '../storage/backupStore.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { logger } from '@cms/utils';

export const backupRouter = Router();

backupRouter.use(requireAuth);

// GET /api/backups
backupRouter.get('/', requirePermission('backups.read'), async (_req: Request, res: Response): Promise<void> => {
  const backups = await BackupStore.listBackups();
  res.json({ success: true, data: backups });
});

// POST /api/backups
backupRouter.post('/', requirePermission('backups.create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const backup = await BackupStore.createBackup();
    logger.audit('Backup Created', { id: backup.id, size: backup.size, user: req.user?.email });
    res.status(201).json({ success: true, data: backup });
  } catch (err) {
    logger.error('Backup creation failed', { error: String(err) });
    res.status(500).json({
      success: false,
      error: { code: 'BACKUP_FAILED', message: 'Failed to create backup archive' }
    });
  }
});

// POST /api/backups/:id/restore
backupRouter.post('/:id/restore', requirePermission('backups.restore'), async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  try {
    const restored = await BackupStore.restoreBackup(id);
    if (!restored) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Backup not found' }
      });
      return;
    }

    logger.audit('Backup Restored', { id, user: req.user?.email });
    res.json({ success: true, data: { message: `Backup "${id}" restored successfully` } });
  } catch (err) {
    logger.error('Backup restore failed', { error: String(err) });
    res.status(500).json({
      success: false,
      error: { code: 'RESTORE_FAILED', message: 'Failed to restore backup archive' }
    });
  }
});

// DELETE /api/backups/:id
backupRouter.delete('/:id', requirePermission('backups.delete'), async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const deleted = await BackupStore.deleteBackup(id);
  if (!deleted) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Backup not found' }
    });
    return;
  }

  logger.audit('Backup Deleted', { id, user: req.user?.email });
  res.json({ success: true, data: { message: 'Backup deleted successfully' } });
});

// GET /api/backups/:id/download
backupRouter.get('/:id/download', requirePermission('backups.read'), async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const filePath = await BackupStore.getBackupPath(id);
  if (!filePath) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Backup file not found' }
    });
    return;
  }

  res.download(filePath, `${id}.zip`);
});

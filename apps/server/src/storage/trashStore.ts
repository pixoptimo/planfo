import path from 'node:path';
import fs from 'node:fs/promises';
import { readJson, writeJsonAtomic, deleteFileSafe, listJsonFiles, safeResolvePath, ensureDir, pathExists, logger } from '@cms/utils';
import { TrashedItemSchema, type TrashedItem, type TrashEntityType } from '@cms/schemas';
import { config } from '../config/env.js';
import { PageStore } from './pageStore.js';
import { PostStore } from './postStore.js';
import { ProductStore } from './productStore.js';
import { BlueprintStore, BlueprintEntryStore } from './blueprintStore.js';
import { MediaStore } from './mediaStore.js';

export class TrashStore {
  private static getDir(): string {
    return config.TRASH_PATH;
  }

  private static getFilePath(trashId: string): string {
    return safeResolvePath(this.getDir(), `${trashId}.json`);
  }

  private static getSampleTemplatesDirs(): string[] {
    const dirs: string[] = [];
    if (config.STORAGE_PATH) {
      dirs.push(path.join(config.STORAGE_PATH, 'themes', 'planfo-default', 'sample-templates'));
    }
    if (config.THEMES_PATH) {
      dirs.push(path.join(config.THEMES_PATH, 'planfo-default', 'sample-templates'));
      dirs.push(path.join(config.THEMES_PATH, 'sample-templates'));
    }
    if (config.TEMPLATES_PATH) {
      dirs.push(path.join(config.TEMPLATES_PATH, 'sample-templates'));
    }
    return Array.from(new Set(dirs));
  }

  private static getTrashSamplesDir(): string {
    return path.join(this.getDir(), 'sample-templates');
  }

  private static isFileMatching(fileName: string, slug: string, data?: any): boolean {
    const lowerName = fileName.toLowerCase();
    const lowerSlug = slug.toLowerCase();
    if (lowerName === lowerSlug) return true;
    if (path.parse(lowerName).name === lowerSlug) return true;
    const demo = data?.data?.demoUrl || data?.demoUrl;
    if (typeof demo === 'string' && demo) {
      const demoBase = path.basename(demo.split('?')[0]).toLowerCase();
      if (lowerName === demoBase) return true;
    }
    const download = data?.data?.downloadFile || data?.downloadFile;
    if (typeof download === 'string' && download) {
      const dlBase = path.basename(download.split('?')[0]).toLowerCase();
      if (lowerName === dlBase) return true;
    }
    return false;
  }

  private static async archiveSampleTemplate(slug: string, data?: any): Promise<void> {
    try {
      const trashSamples = this.getTrashSamplesDir();
      const themeDirs = this.getSampleTemplatesDirs();
      for (const td of themeDirs) {
        if (await pathExists(td)) {
          const files = await fs.readdir(td);
          for (const file of files) {
            if (this.isFileMatching(file, slug, data)) {
              await ensureDir(trashSamples);
              await fs.rename(path.join(td, file), path.join(trashSamples, file));
            }
          }
        }
      }
    } catch {}
  }

  private static async restoreSampleTemplate(slug: string, data?: any): Promise<void> {
    try {
      const trashSamples = this.getTrashSamplesDir();
      if (!(await pathExists(trashSamples))) return;
      const themeDirs = this.getSampleTemplatesDirs();
      let targetDir: string | undefined;
      for (const td of themeDirs) {
        if (await pathExists(td)) {
          targetDir = td;
          break;
        }
      }
      if (!targetDir) {
        targetDir = themeDirs.find((d) => d.includes('planfo-default') && d.includes('themes')) || themeDirs[0];
      }
      if (!targetDir) return;

      const files = await fs.readdir(trashSamples);
      for (const file of files) {
        if (this.isFileMatching(file, slug, data)) {
          await ensureDir(targetDir);
          await fs.rename(path.join(trashSamples, file), path.join(targetDir, file));
        }
      }
    } catch {}
  }

  private static async purgeSampleTemplate(slug: string, data?: any): Promise<void> {
    try {
      const trashSamples = this.getTrashSamplesDir();
      if (await pathExists(trashSamples)) {
        const files = await fs.readdir(trashSamples);
        for (const file of files) {
          if (this.isFileMatching(file, slug, data)) {
            await fs.rm(path.join(trashSamples, file), { recursive: true, force: true });
          }
        }
      }
      const themeDirs = this.getSampleTemplatesDirs();
      for (const td of themeDirs) {
        if (await pathExists(td)) {
          const files = await fs.readdir(td);
          for (const file of files) {
            if (this.isFileMatching(file, slug, data)) {
              await fs.rm(path.join(td, file), { recursive: true, force: true });
            }
          }
        }
      }
    } catch {}
  }

  private static async cleanTrashSamplesDir(): Promise<void> {
    try {
      const trashSamples = this.getTrashSamplesDir();
      if (await pathExists(trashSamples)) {
        await fs.rm(trashSamples, { recursive: true, force: true });
      }
    } catch {}
  }

  static async getAll(): Promise<TrashedItem[]> {
    const dir = this.getDir();
    await ensureDir(dir);
    const files = await listJsonFiles(dir);
    const items: TrashedItem[] = [];

    for (const file of files) {
      try {
        const item = await readJson<TrashedItem>(file, TrashedItemSchema);
        items.push(item);
      } catch {
        // Skip corrupted trash files
      }
    }

    return items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  }

  static async getById(trashId: string): Promise<TrashedItem | null> {
    try {
      const filePath = this.getFilePath(trashId);
      return await readJson<TrashedItem>(filePath, TrashedItemSchema);
    } catch {
      return null;
    }
  }

  static async moveToTrash<T extends Record<string, any>>(
    entityType: TrashEntityType,
    item: T,
    deletedBy?: string,
    blueprintSlug?: string
  ): Promise<TrashedItem> {
    const dir = this.getDir();
    await ensureDir(dir);

    const trashId = `trash_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const originalSlug = item.slug || item.id || 'unknown';
    const title = item.title || item.name || originalSlug;

    const trashedItem: TrashedItem = {
      trashId,
      entityType,
      blueprintSlug,
      originalId: item.id || originalSlug,
      originalSlug,
      title,
      data: item,
      deletedAt: new Date().toISOString(),
      deletedBy: deletedBy || 'system'
    };

    const filePath = this.getFilePath(trashId);
    await writeJsonAtomic(filePath, trashedItem, TrashedItemSchema);
    await this.archiveSampleTemplate(originalSlug, item);

    if (entityType === 'media') {
      const mediaItem = item as any;
      if (mediaItem.filename) {
        const mediaTrashDir = path.join(this.getDir(), 'media');
        await ensureDir(mediaTrashDir);
        const sourcePath = safeResolvePath(config.MEDIA_PATH, mediaItem.filename);
        const trashPath = path.join(mediaTrashDir, mediaItem.filename);
        try {
          if (await pathExists(sourcePath)) {
            await fs.rename(sourcePath, trashPath);
          }
        } catch {}
        const generatedPath = path.join(config.OUTPUT_PATH, 'media', mediaItem.filename);
        await deleteFileSafe(generatedPath);
      }
    }

    logger.audit('Item Moved to Trash', {
      trashId,
      entityType,
      originalSlug,
      title,
      deletedBy
    });

    return trashedItem;
  }

  static async restore(trashId: string, restoredBy?: string): Promise<{ success: boolean; item?: TrashedItem; error?: string }> {
    const trashedItem = await this.getById(trashId);
    if (!trashedItem) {
      return { success: false, error: 'Trashed item not found' };
    }

    try {
      const data = trashedItem.data as any;
      if (data && typeof data === 'object') {
        if (data.status) {
          data.status = 'draft'; // Restore as draft
        }
        data.updatedAt = new Date().toISOString();
      }

      switch (trashedItem.entityType) {
        case 'page':
          await PageStore.save(data);
          break;
        case 'post':
          await PostStore.save(data);
          break;
        case 'product':
          await ProductStore.save(data);
          break;
        case 'blueprint':
          await BlueprintStore.save(data);
          break;
        case 'blueprint-entry':
          if (!trashedItem.blueprintSlug) {
            throw new Error('Missing blueprintSlug for restoring blueprint entry');
          }
          await BlueprintEntryStore.save(trashedItem.blueprintSlug, data);
          break;
        case 'media': {
          const mediaTrashDir = path.join(this.getDir(), 'media');
          const trashPath = path.join(mediaTrashDir, data.filename);
          const restoredPath = safeResolvePath(config.MEDIA_PATH, data.filename);
          try {
            if (await pathExists(trashPath)) {
              await ensureDir(config.MEDIA_PATH);
              await fs.rename(trashPath, restoredPath);
            }
          } catch {}
          await MediaStore.saveItem(data);
          break;
        }
        default:
          throw new Error(`Unsupported entity type: ${trashedItem.entityType}`);
      }

      // Remove from trash and restore sample template
      const filePath = this.getFilePath(trashId);
      await deleteFileSafe(filePath);
      await this.restoreSampleTemplate(trashedItem.originalSlug, trashedItem.data);

      logger.audit('Item Restored from Trash', {
        trashId,
        entityType: trashedItem.entityType,
        originalSlug: trashedItem.originalSlug,
        restoredBy
      });

      return { success: true, item: trashedItem };
    } catch (err) {
      logger.error('Failed to restore trashed item', { error: String(err), trashId });
      return { success: false, error: err instanceof Error ? err.message : 'Restore failed' };
    }
  }

  static async deletePermanently(trashId: string, deletedBy?: string): Promise<boolean> {
    const trashedItem = await this.getById(trashId);
    const filePath = this.getFilePath(trashId);
    const deleted = await deleteFileSafe(filePath);
    if (trashedItem) {
      await this.purgeSampleTemplate(trashedItem.originalSlug, trashedItem.data);
      if (trashedItem.entityType === 'media') {
        const mediaItem = trashedItem.data as any;
        if (mediaItem?.filename) {
          const mediaTrashDir = path.join(this.getDir(), 'media');
          const trashPath = path.join(mediaTrashDir, mediaItem.filename);
          await deleteFileSafe(trashPath);
          const generatedPath = path.join(config.OUTPUT_PATH, 'media', mediaItem.filename);
          await deleteFileSafe(generatedPath);
        }
      }
    }
    if (deleted && trashedItem) {
      logger.audit('Item Permanently Purged from Trash', {
        trashId,
        entityType: trashedItem.entityType,
        originalSlug: trashedItem.originalSlug,
        deletedBy
      });
    }
    return deleted;
  }

  static async emptyTrash(deletedBy?: string): Promise<{ deletedCount: number }> {
    const items = await this.getAll();
    let deletedCount = 0;

    for (const item of items) {
      await this.purgeSampleTemplate(item.originalSlug, item.data);
      if (item.entityType === 'media') {
        const mediaItem = item.data as any;
        if (mediaItem?.filename) {
          const mediaTrashDir = path.join(this.getDir(), 'media');
          const trashPath = path.join(mediaTrashDir, mediaItem.filename);
          await deleteFileSafe(trashPath);
          const generatedPath = path.join(config.OUTPUT_PATH, 'media', mediaItem.filename);
          await deleteFileSafe(generatedPath);
        }
      }
      const filePath = this.getFilePath(item.trashId);
      const ok = await deleteFileSafe(filePath);
      if (ok) deletedCount++;
    }
    await this.cleanTrashSamplesDir();
    const mediaTrashDir = path.join(this.getDir(), 'media');
    try {
      if (await pathExists(mediaTrashDir)) {
        await fs.rm(mediaTrashDir, { recursive: true, force: true });
      }
    } catch {}

    logger.audit('Trash Emptied Permanently', { deletedCount, deletedBy });
    return { deletedCount };
  }

  static async getCount(): Promise<number> {
    try {
      const dir = this.getDir();
      if (!(await pathExists(dir))) return 0;
      const files = await listJsonFiles(dir);
      return files.length;
    } catch {
      return 0;
    }
  }
}

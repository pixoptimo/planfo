import path from 'node:path';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import archiver from 'archiver';
import unzipper from 'unzipper';
import { ensureDir, deleteFileSafe, safeResolvePath, pathExists, readJson, writeJsonAtomic } from '@cms/utils';
import { BackupMetadataSchema, type BackupMetadata } from '@cms/schemas';
import { config } from '../config/env.js';
import { PageStore } from './pageStore.js';
import { PostStore } from './postStore.js';
import { ProductStore } from './productStore.js';
import { CategoryStore } from './categoryStore.js';
import { MediaStore } from './mediaStore.js';

export class BackupStore {
  static async listBackups(): Promise<BackupMetadata[]> {
    await ensureDir(config.BACKUP_PATH);
    const files = await fsPromises.readdir(config.BACKUP_PATH);
    const metaFiles = files.filter((f) => f.endsWith('.meta.json'));
    const backups: BackupMetadata[] = [];

    for (const file of metaFiles) {
      try {
        const meta = await readJson<BackupMetadata>(path.join(config.BACKUP_PATH, file), BackupMetadataSchema);
        backups.push(meta);
      } catch {
        // Skip
      }
    }

    return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getBackupPath(id: string): Promise<string | null> {
    const zipPath = safeResolvePath(config.BACKUP_PATH, `${id}.zip`);
    if (await pathExists(zipPath)) {
      return zipPath;
    }
    return null;
  }

  static async createBackup(): Promise<BackupMetadata> {
    await ensureDir(config.BACKUP_PATH);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup_${timestamp}`;
    const zipFilename = `${backupId}.zip`;
    const metaFilename = `${backupId}.meta.json`;
    const zipPath = path.join(config.BACKUP_PATH, zipFilename);
    const metaPath = path.join(config.BACKUP_PATH, metaFilename);

    // Count entities
    const pages = await PageStore.getAll();
    const posts = await PostStore.getAll();
    const products = await ProductStore.getAll();
    const categories = await CategoryStore.getAll();
    const media = await MediaStore.getAll();

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise<void>((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);

      // Append content, media, settings, auth, revisions
      if (fs.existsSync(config.CONTENT_PATH)) {
        archive.directory(config.CONTENT_PATH, 'content');
      }
      if (fs.existsSync(config.MEDIA_PATH)) {
        archive.directory(config.MEDIA_PATH, 'media');
      }
      if (fs.existsSync(config.SETTINGS_PATH)) {
        archive.directory(config.SETTINGS_PATH, 'settings');
      }
      if (fs.existsSync(config.REVISION_PATH)) {
        archive.directory(config.REVISION_PATH, 'revisions');
      }
      const usersFile = path.join(config.STORAGE_PATH, 'auth', 'users.json');
      if (fs.existsSync(usersFile)) {
        archive.file(usersFile, { name: 'auth/users.json' });
      }

      archive.finalize();
    });

    const stat = await fsPromises.stat(zipPath);
    const meta: BackupMetadata = {
      id: backupId,
      filename: zipFilename,
      createdAt: new Date().toISOString(),
      size: stat.size,
      cmsVersion: '1.0.0',
      contentsCount: {
        pages: pages.length,
        posts: posts.length,
        products: products.length,
        categories: categories.length,
        media: media.length,
        revisions: 0
      }
    };

    await writeJsonAtomic(metaPath, meta, BackupMetadataSchema);
    return meta;
  }

  static async restoreBackup(id: string): Promise<boolean> {
    const zipPath = await this.getBackupPath(id);
    if (!zipPath) return false;

    // Unzip directly into storage
    await fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: config.STORAGE_PATH }))
      .promise();

    return true;
  }

  static async deleteBackup(id: string): Promise<boolean> {
    const zipPath = safeResolvePath(config.BACKUP_PATH, `${id}.zip`);
    const metaPath = safeResolvePath(config.BACKUP_PATH, `${id}.meta.json`);

    await deleteFileSafe(zipPath);
    await deleteFileSafe(metaPath);
    return true;
  }
}

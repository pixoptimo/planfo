import path from 'node:path';
import fs from 'node:fs/promises';
import { readJson, writeJsonAtomic, deleteFileSafe, safeResolvePath, sanitizeFilename } from '@cms/utils';
import { MediaManifestSchema, MediaItemSchema, type MediaItem, type MediaManifest } from '@cms/schemas';
import { config } from '../config/env.js';

export class MediaStore {
  private static getManifestPath(): string {
    return path.join(config.MEDIA_PATH, 'manifest.json');
  }

  static async getManifest(): Promise<MediaManifest> {
    try {
      return await readJson<MediaManifest>(this.getManifestPath(), MediaManifestSchema);
    } catch {
      return { items: [] };
    }
  }

  static async getAll(): Promise<MediaItem[]> {
    const manifest = await this.getManifest();
    return manifest.items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  static async getById(id: string): Promise<MediaItem | null> {
    const items = await this.getAll();
    return items.find((i) => i.id === id) || null;
  }

  static async saveItem(item: MediaItem): Promise<void> {
    const manifest = await this.getManifest();
    const index = manifest.items.findIndex((i) => i.id === item.id);

    if (index >= 0) {
      manifest.items[index] = item;
    } else {
      manifest.items.push(item);
    }

    await writeJsonAtomic(this.getManifestPath(), manifest, MediaManifestSchema);
  }

  static async deleteItem(id: string): Promise<boolean> {
    const manifest = await this.getManifest();
    const item = manifest.items.find((i) => i.id === id);

    if (!item) return false;

    // Remove file
    try {
      const filePath = safeResolvePath(config.MEDIA_PATH, item.filename);
      await deleteFileSafe(filePath);
    } catch {
      // Ignore if file missing
    }

    manifest.items = manifest.items.filter((i) => i.id !== id);
    await writeJsonAtomic(this.getManifestPath(), manifest, MediaManifestSchema);
    return true;
  }

  static async saveUpload(file: Express.Multer.File, alt = ''): Promise<MediaItem> {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBaseName = sanitizeFilename(path.basename(file.originalname, ext));
    const uniqueFilename = `${cleanBaseName}-${Date.now()}${ext}`;
    const destinationPath = safeResolvePath(config.MEDIA_PATH, uniqueFilename);

    await fs.writeFile(destinationPath, file.buffer);

    const mediaItem: MediaItem = {
      id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      filename: uniqueFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      alt,
      url: `/media/${uniqueFilename}`,
      createdAt: new Date().toISOString()
    };

    await this.saveItem(mediaItem);
    return mediaItem;
  }
}

import path from 'node:path';
import { readJson, writeJsonAtomic, deleteFileSafe, listJsonFiles, safeResolvePath } from '@cms/utils';
import { PageSchema, type Page } from '@cms/schemas';
import { config } from '../config/env.js';

export class PageStore {
  private static getDir(): string {
    return path.join(config.CONTENT_PATH, 'pages');
  }

  private static getFilePath(slug: string): string {
    return safeResolvePath(this.getDir(), `${slug}.json`);
  }

  static async getAll(): Promise<Page[]> {
    const dir = this.getDir();
    const files = await listJsonFiles(dir);
    const pages: Page[] = [];

    for (const file of files) {
      try {
        const page = await readJson<Page>(file, PageSchema);
        pages.push(page);
      } catch (err) {
        // Skip or log corrupted files without crashing
      }
    }

    // Sort by createdAt descending
    return pages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getBySlug(slug: string): Promise<Page | null> {
    try {
      const filePath = this.getFilePath(slug);
      return await readJson<Page>(filePath, PageSchema);
    } catch {
      return null;
    }
  }

  static async getById(id: string): Promise<Page | null> {
    const pages = await this.getAll();
    return pages.find((p) => p.id === id) || null;
  }

  static async save(page: Page, oldSlug?: string): Promise<void> {
    // If slug changed, remove the old file
    if (oldSlug && oldSlug !== page.slug) {
      try {
        const oldPath = this.getFilePath(oldSlug);
        await deleteFileSafe(oldPath);
      } catch {
        // Ignore if old file didn't exist
      }
    }

    const filePath = this.getFilePath(page.slug);
    await writeJsonAtomic(filePath, page, PageSchema);
  }

  static async delete(slug: string): Promise<boolean> {
    const filePath = this.getFilePath(slug);
    return await deleteFileSafe(filePath);
  }
}

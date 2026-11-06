import path from 'node:path';
import fs from 'node:fs/promises';
import { readJson, writeJsonAtomic, pathExists } from '@cms/utils';
import { MenuSchema, type Menu } from '@cms/schemas';
import { config } from '../config/env.js';

export class MenuStore {
  private static getDir(): string {
    return path.join(config.CONTENT_PATH, 'menus');
  }

  private static getFilePath(slug = 'main'): string {
    return path.join(this.getDir(), `${slug}.json`);
  }

  static async list(): Promise<Menu[]> {
    try {
      const dir = this.getDir();
      if (!(await pathExists(dir))) {
        await fs.mkdir(dir, { recursive: true });
        return [];
      }
      const files = await fs.readdir(dir);
      const menus: Menu[] = [];
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const menu = await readJson<Menu>(path.join(dir, file), MenuSchema);
            if (menu) menus.push(menu);
          } catch {
            // Ignore non-matching or corrupt files
          }
        }
      }
      // Sort with 'main' first, then alphabetical by name
      return menus.sort((a, b) => {
        if (a.slug === 'main') return -1;
        if (b.slug === 'main') return 1;
        return a.name.localeCompare(b.name);
      });
    } catch {
      return [];
    }
  }

  static async get(slug = 'main'): Promise<Menu | null> {
    try {
      return await readJson<Menu>(this.getFilePath(slug), MenuSchema);
    } catch {
      return null;
    }
  }

  static async getByLocation(location: string): Promise<Menu | null> {
    const all = await this.list();
    return all.find(m => m.locations?.includes(location) || m.location === location) || null;
  }

  static async save(menu: Menu): Promise<void> {
    await writeJsonAtomic(this.getFilePath(menu.slug), menu, MenuSchema);
  }

  static async delete(slug: string): Promise<boolean> {
    if (slug === 'main') {
      throw new Error('The default main navigation menu cannot be deleted.');
    }
    const filePath = this.getFilePath(slug);
    if (await pathExists(filePath)) {
      await fs.unlink(filePath);
      return true;
    }
    return false;
  }
}

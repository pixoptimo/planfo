import path from 'node:path';
import { readJson, writeJsonAtomic } from '@cms/utils';
import { MenuSchema, type Menu } from '@cms/schemas';
import { config } from '../config/env.js';

export class MenuStore {
  private static getFilePath(slug = 'main'): string {
    return path.join(config.CONTENT_PATH, 'menus', `${slug}.json`);
  }

  static async get(slug = 'main'): Promise<Menu | null> {
    try {
      return await readJson<Menu>(this.getFilePath(slug), MenuSchema);
    } catch {
      return null;
    }
  }

  static async save(menu: Menu): Promise<void> {
    await writeJsonAtomic(this.getFilePath(menu.slug), menu, MenuSchema);
  }
}

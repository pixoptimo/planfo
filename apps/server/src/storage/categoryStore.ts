import path from 'node:path';
import { readJson, writeJsonAtomic } from '@cms/utils';
import { CategoriesFileSchema, type Category, type CategoriesFile } from '@cms/schemas';
import { config } from '../config/env.js';

export class CategoryStore {
  private static getFilePath(): string {
    return path.join(config.CONTENT_PATH, 'categories', 'index.json');
  }

  static async getAll(): Promise<Category[]> {
    try {
      const data = await readJson<CategoriesFile>(this.getFilePath(), CategoriesFileSchema);
      return data.categories;
    } catch {
      return [];
    }
  }

  static async getById(id: string): Promise<Category | null> {
    const categories = await this.getAll();
    return categories.find((c) => c.id === id) || null;
  }

  static async getBySlug(slug: string): Promise<Category | null> {
    const categories = await this.getAll();
    return categories.find((c) => c.slug === slug) || null;
  }

  static async save(category: Category): Promise<void> {
    const categories = await this.getAll();
    const index = categories.findIndex((c) => c.id === category.id);

    if (index >= 0) {
      categories[index] = category;
    } else {
      categories.push(category);
    }

    await writeJsonAtomic(this.getFilePath(), { categories }, CategoriesFileSchema);
  }

  static async delete(id: string): Promise<boolean> {
    const categories = await this.getAll();
    const filtered = categories.filter((c) => c.id !== id);

    if (filtered.length === categories.length) {
      return false;
    }

    await writeJsonAtomic(this.getFilePath(), { categories: filtered }, CategoriesFileSchema);
    return true;
  }
}

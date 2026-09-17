import path from 'node:path';
import { readJson, writeJsonAtomic, deleteFileSafe, listJsonFiles, safeResolvePath } from '@cms/utils';
import { ProductSchema, type Product } from '@cms/schemas';
import { config } from '../config/env.js';

export class ProductStore {
  private static getDir(): string {
    return path.join(config.CONTENT_PATH, 'products');
  }

  private static getFilePath(slug: string): string {
    return safeResolvePath(this.getDir(), `${slug}.json`);
  }

  static async getAll(): Promise<Product[]> {
    const dir = this.getDir();
    const files = await listJsonFiles(dir);
    const products: Product[] = [];

    for (const file of files) {
      try {
        const product = await readJson<Product>(file, ProductSchema);
        products.push(product);
      } catch {
        // Skip corrupted product
      }
    }

    return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getBySlug(slug: string): Promise<Product | null> {
    try {
      const filePath = this.getFilePath(slug);
      return await readJson<Product>(filePath, ProductSchema);
    } catch {
      return null;
    }
  }

  static async getById(id: string): Promise<Product | null> {
    const products = await this.getAll();
    return products.find((p) => p.id === id) || null;
  }

  static async save(product: Product, oldSlug?: string): Promise<void> {
    if (oldSlug && oldSlug !== product.slug) {
      try {
        const oldPath = this.getFilePath(oldSlug);
        await deleteFileSafe(oldPath);
      } catch {
        // Ignore old file removal errors
      }
    }

    const filePath = this.getFilePath(product.slug);
    await writeJsonAtomic(filePath, product, ProductSchema);
  }

  static async delete(slug: string): Promise<boolean> {
    const filePath = this.getFilePath(slug);
    return await deleteFileSafe(filePath);
  }
}

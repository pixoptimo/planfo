import path from 'node:path';
import { readJson, writeJsonAtomic, deleteFileSafe, listJsonFiles, safeResolvePath } from '@cms/utils';
import { PostSchema, type Post } from '@cms/schemas';
import { config } from '../config/env.js';

export class PostStore {
  private static getDir(): string {
    return path.join(config.CONTENT_PATH, 'posts');
  }

  private static getFilePath(slug: string): string {
    return safeResolvePath(this.getDir(), `${slug}.json`);
  }

  static async getAll(): Promise<Post[]> {
    const dir = this.getDir();
    const files = await listJsonFiles(dir);
    const posts: Post[] = [];

    for (const file of files) {
      try {
        const post = await readJson<Post>(file, PostSchema);
        posts.push(post);
      } catch {
        // Skip corrupted post
      }
    }

    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getBySlug(slug: string): Promise<Post | null> {
    try {
      const filePath = this.getFilePath(slug);
      return await readJson<Post>(filePath, PostSchema);
    } catch {
      return null;
    }
  }

  static async getById(id: string): Promise<Post | null> {
    const posts = await this.getAll();
    return posts.find((p) => p.id === id) || null;
  }

  static async save(post: Post, oldSlug?: string): Promise<void> {
    if (oldSlug && oldSlug !== post.slug) {
      try {
        const oldPath = this.getFilePath(oldSlug);
        await deleteFileSafe(oldPath);
      } catch {
        // Ignore old file removal errors
      }
    }

    const filePath = this.getFilePath(post.slug);
    await writeJsonAtomic(filePath, post, PostSchema);
  }

  static async delete(slug: string): Promise<boolean> {
    const filePath = this.getFilePath(slug);
    return await deleteFileSafe(filePath);
  }
}

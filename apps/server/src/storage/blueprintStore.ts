import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { readJson, writeJsonAtomic, deleteFileSafe, listJsonFiles, safeResolvePath, ensureDir } from '@cms/utils';
import {
  BlueprintSchema,
  BlueprintEntrySchema,
  type Blueprint,
  type BlueprintEntry
} from '@cms/schemas';
import { config } from '../config/env.js';

export class BlueprintStore {
  private static getBlueprintsDir(): string {
    return path.join(config.STORAGE_PATH, 'blueprints');
  }

  static getBuiltInBlueprints(): Blueprint[] {
    return [
      {
        id: 'pages',
        name: 'Pages',
        singularName: 'Page',
        slug: 'pages',
        icon: 'FileText',
        description: 'Standalone hierarchical pages (Home, About, Services)',
        hasCategories: false,
        hasTags: true,
        hasContentEditor: true,
        isBuiltIn: true,
        fields: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'posts',
        name: 'Articles',
        singularName: 'Article',
        slug: 'posts',
        icon: 'BookOpen',
        description: 'Chronological articles, essays, and news dispatches',
        hasCategories: true,
        hasTags: true,
        hasContentEditor: true,
        isBuiltIn: true,
        fields: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      }
    ];
  }

  static async getAll(): Promise<Blueprint[]> {
    const dir = this.getBlueprintsDir();
    await ensureDir(dir);

    const files = await listJsonFiles(dir);
    const custom: Blueprint[] = [];

    for (const file of files) {
      try {
        const bp = await readJson<Blueprint>(file, BlueprintSchema);
        custom.push(bp);
      } catch {
        // Skip invalid blueprint
      }
    }

    const builtIns = this.getBuiltInBlueprints();
    return [...builtIns, ...custom.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())];
  }

  static async getCustomBlueprints(): Promise<Blueprint[]> {
    const dir = this.getBlueprintsDir();
    await ensureDir(dir);

    const files = await listJsonFiles(dir);
    const custom: Blueprint[] = [];

    for (const file of files) {
      try {
        const bp = await readJson<Blueprint>(file, BlueprintSchema);
        if (!bp.isBuiltIn) {
          custom.push(bp);
        }
      } catch {
        //
      }
    }

    return custom.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  static async getBySlug(slug: string): Promise<Blueprint | null> {
    const builtIn = this.getBuiltInBlueprints().find((b) => b.slug === slug || b.id === slug);
    if (builtIn) return builtIn;

    try {
      const filePath = safeResolvePath(this.getBlueprintsDir(), `${slug}.json`);
      if (!existsSync(filePath)) return null;
      return await readJson<Blueprint>(filePath, BlueprintSchema);
    } catch {
      return null;
    }
  }

  static async save(blueprint: Blueprint, oldSlug?: string): Promise<void> {
    const dir = this.getBlueprintsDir();
    await ensureDir(dir);

    if (oldSlug && oldSlug !== blueprint.slug) {
      try {
        const oldPath = safeResolvePath(dir, `${oldSlug}.json`);
        await deleteFileSafe(oldPath);

        const oldContentDir = path.join(config.CONTENT_PATH, oldSlug);
        const newContentDir = path.join(config.CONTENT_PATH, blueprint.slug);
        if (existsSync(oldContentDir) && !existsSync(newContentDir)) {
          await fs.rename(oldContentDir, newContentDir);
        }
      } catch {
        //
      }
    }

    const filePath = safeResolvePath(dir, `${blueprint.slug}.json`);
    await writeJsonAtomic(filePath, blueprint, BlueprintSchema);
  }

  static async delete(slug: string): Promise<boolean> {
    const builtIn = this.getBuiltInBlueprints().find((b) => b.slug === slug);
    if (builtIn) return false; // Cannot delete built-in blueprints

    const filePath = safeResolvePath(this.getBlueprintsDir(), `${slug}.json`);
    return await deleteFileSafe(filePath);
  }

  static async getEntryCount(blueprintSlug: string): Promise<number> {
    if (blueprintSlug === 'pages') {
      const files = await listJsonFiles(path.join(config.CONTENT_PATH, 'pages'));
      return files.length;
    }
    if (blueprintSlug === 'posts') {
      const files = await listJsonFiles(path.join(config.CONTENT_PATH, 'posts'));
      return files.length;
    }
    const entriesDir = path.join(config.CONTENT_PATH, blueprintSlug);
    if (!existsSync(entriesDir)) return 0;
    const files = await listJsonFiles(entriesDir);
    return files.length;
  }
}

export class BlueprintEntryStore {
  private static getEntriesDir(blueprintSlug: string): string {
    return path.join(config.CONTENT_PATH, blueprintSlug);
  }

  private static getFilePath(blueprintSlug: string, entrySlug: string): string {
    return safeResolvePath(this.getEntriesDir(blueprintSlug), `${entrySlug}.json`);
  }

  private static normalizeEntry(raw: any, blueprintSlug: string): BlueprintEntry {
    const normalized = {
      id: raw.id || `ent_${Date.now()}`,
      blueprintId: raw.blueprintId || blueprintSlug,
      title: raw.title || raw.name || 'Untitled',
      slug: raw.slug,
      status: raw.status === 'published' ? 'published' : 'draft',
      publishedAt: raw.publishedAt || null,
      category: raw.category || 'general',
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      excerpt: raw.excerpt || raw.shortDescription || '',
      featuredImage: raw.featuredImage || (Array.isArray(raw.images) && raw.images[0]) || '',
      data: raw.data || {
        ...(raw.price !== undefined ? { price: raw.price } : {}),
        ...(raw.sku ? { sku: raw.sku } : {})
      },
      content: raw.content || raw.description || { blocks: [] },
      seo: raw.seo,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString()
    };
    return BlueprintEntrySchema.parse(normalized);
  }

  static async getAll(blueprintSlug: string): Promise<BlueprintEntry[]> {
    const dir = this.getEntriesDir(blueprintSlug);
    await ensureDir(dir);

    const files = await listJsonFiles(dir);
    const entries: BlueprintEntry[] = [];

    for (const file of files) {
      try {
        const raw = await readJson<any>(file);
        const entry = this.normalizeEntry(raw, blueprintSlug);
        entries.push(entry);
      } catch {
        // Skip corrupted entry
      }
    }

    return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getBySlug(blueprintSlug: string, entrySlug: string): Promise<BlueprintEntry | null> {
    try {
      const filePath = this.getFilePath(blueprintSlug, entrySlug);
      const raw = await readJson<any>(filePath);
      return this.normalizeEntry(raw, blueprintSlug);
    } catch {
      return null;
    }
  }

  static async save(blueprintSlug: string, entry: BlueprintEntry, oldSlug?: string): Promise<void> {
    const dir = this.getEntriesDir(blueprintSlug);
    await ensureDir(dir);

    const safeEntry = {
      ...entry,
      blueprintId: entry.blueprintId || blueprintSlug
    };

    if (oldSlug && oldSlug !== safeEntry.slug) {
      try {
        const oldPath = this.getFilePath(blueprintSlug, oldSlug);
        await deleteFileSafe(oldPath);
      } catch {
        //
      }
    }

    const filePath = this.getFilePath(blueprintSlug, safeEntry.slug);
    await writeJsonAtomic(filePath, safeEntry, BlueprintEntrySchema);
  }

  static async delete(blueprintSlug: string, entrySlug: string): Promise<boolean> {
    const filePath = this.getFilePath(blueprintSlug, entrySlug);
    return await deleteFileSafe(filePath);
  }
}

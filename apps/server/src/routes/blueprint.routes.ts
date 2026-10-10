import { Router, type Request, type Response } from 'express';
import {
  CreateBlueprintSchema,
  UpdateBlueprintSchema,
  CreateBlueprintEntrySchema,
  UpdateBlueprintEntrySchema,
  type Blueprint,
  type BlueprintEntry
} from '@cms/schemas';
import { BlueprintStore, BlueprintEntryStore } from '../storage/blueprintStore.js';
import { requireAuth, requirePermission } from '../auth/middleware.js';
import { slugify, makeUniqueSlug, logger } from '@cms/utils';
import { StaticSiteGenerator } from '@cms/generator';
import { config } from '../config/env.js';

export const blueprintRouter = Router();

async function triggerStaticBuild(): Promise<void> {
  try {
    const generator = new StaticSiteGenerator({
      storagePath: config.STORAGE_PATH,
      templatesPath: config.TEMPLATES_PATH,
      outputPath: config.OUTPUT_PATH
    });
    await generator.build();
    logger.info('Static site automatically rebuilt after blueprint modification');
  } catch (err) {
    logger.error('Failed to regenerate site upon blueprint change', { error: String(err) });
  }
}

blueprintRouter.use(requireAuth);

// ==========================================
// BLUEPRINT SCHEMA ENDPOINTS
// ==========================================

// GET /api/blueprints
blueprintRouter.get('/', requirePermission('blueprints.read'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const all = await BlueprintStore.getAll();
    const enriched = await Promise.all(
      all.map(async (bp) => {
        const count = await BlueprintStore.getEntryCount(bp.slug);
        return {
          ...bp,
          entryCount: count
        };
      })
    );
    res.json({ success: true, data: enriched });
  } catch (err) {
    logger.error('Failed to list blueprints', { error: String(err) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to retrieve blueprints' } });
  }
});

// GET /api/blueprints/:slug
blueprintRouter.get('/:slug', requirePermission('blueprints.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = String(req.params.slug);
    const blueprint = await BlueprintStore.getBySlug(slug);
    if (!blueprint) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Blueprint "${slug}" not found` }
      });
      return;
    }
    const count = await BlueprintStore.getEntryCount(blueprint.slug);
    res.json({ success: true, data: { ...blueprint, entryCount: count } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to retrieve blueprint' } });
  }
});

// POST /api/blueprints
blueprintRouter.post('/', requirePermission('blueprints.create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = CreateBlueprintSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid blueprint definition', details: parseResult.error.format() }
      });
      return;
    }

    const existing = await BlueprintStore.getAll();
    const existingSlugs = existing.map((b) => b.slug);

    let slug = parseResult.data.slug ? slugify(parseResult.data.slug) : slugify(parseResult.data.name);
    if (!slug) slug = 'blueprint';
    slug = makeUniqueSlug(slug, existingSlugs);

    const now = new Date().toISOString();
    const newBlueprint: Blueprint = {
      id: `bp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: parseResult.data.name,
      singularName: parseResult.data.singularName,
      slug,
      icon: parseResult.data.icon || 'FileText',
      description: parseResult.data.description || '',
      hasCategories: parseResult.data.hasCategories ?? true,
      hasTags: parseResult.data.hasTags ?? true,
      hasContentEditor: parseResult.data.hasContentEditor ?? true,
      isBuiltIn: false,
      fields: parseResult.data.fields || [],
      createdAt: now,
      updatedAt: now
    };

    await BlueprintStore.save(newBlueprint);

    logger.audit('Blueprint created', {
      blueprintId: newBlueprint.id,
      slug: newBlueprint.slug,
      name: newBlueprint.name,
      userId: req.user?.id
    });

    triggerStaticBuild().catch(() => {});

    res.status(201).json({ success: true, data: { ...newBlueprint, entryCount: 0 } });
  } catch (err) {
    logger.error('Failed to create blueprint', { error: String(err) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create blueprint' } });
  }
});

// PUT /api/blueprints/:slug
blueprintRouter.put('/:slug', requirePermission('blueprints.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = String(req.params.slug);
    const existing = await BlueprintStore.getBySlug(slug);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Blueprint "${slug}" not found` }
      });
      return;
    }

    if (existing.isBuiltIn) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Built-in core blueprints cannot be modified' }
      });
      return;
    }

    const parseResult = UpdateBlueprintSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid blueprint update data', details: parseResult.error.format() }
      });
      return;
    }

    let targetSlug = existing.slug;
    if (parseResult.data.slug && parseResult.data.slug !== existing.slug) {
      const all = await BlueprintStore.getAll();
      const otherSlugs = all.filter((b) => b.id !== existing.id).map((b) => b.slug);
      targetSlug = makeUniqueSlug(slugify(parseResult.data.slug), otherSlugs);
    }

    const updated: Blueprint = {
      ...existing,
      name: parseResult.data.name ?? existing.name,
      singularName: parseResult.data.singularName ?? existing.singularName,
      slug: targetSlug,
      icon: parseResult.data.icon ?? existing.icon,
      description: parseResult.data.description ?? existing.description,
      hasCategories: parseResult.data.hasCategories ?? existing.hasCategories,
      hasTags: parseResult.data.hasTags ?? existing.hasTags,
      hasContentEditor: parseResult.data.hasContentEditor ?? existing.hasContentEditor,
      fields: parseResult.data.fields ?? existing.fields,
      updatedAt: new Date().toISOString()
    };

    await BlueprintStore.save(updated, existing.slug);

    logger.audit('Blueprint updated', {
      blueprintId: updated.id,
      slug: updated.slug,
      oldSlug: existing.slug,
      userId: req.user?.id
    });

    const count = await BlueprintStore.getEntryCount(updated.slug);
    triggerStaticBuild().catch(() => {});
    res.json({ success: true, data: { ...updated, entryCount: count } });
  } catch (err) {
    logger.error('Failed to update blueprint', { error: String(err) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update blueprint' } });
  }
});

// DELETE /api/blueprints/:slug
blueprintRouter.delete('/:slug', requirePermission('blueprints.delete'), async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = String(req.params.slug);
    const existing = await BlueprintStore.getBySlug(slug);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Blueprint "${slug}" not found` }
      });
      return;
    }

    if (existing.isBuiltIn) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Built-in blueprints cannot be deleted' }
      });
      return;
    }

    await BlueprintStore.delete(slug);

    logger.audit('Blueprint deleted', {
      blueprintId: existing.id,
      slug,
      userId: req.user?.id
    });

    triggerStaticBuild().catch(() => {});

    res.json({ success: true, message: `Blueprint "${existing.name}" deleted successfully` });
  } catch (err) {
    logger.error('Failed to delete blueprint', { error: String(err) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete blueprint' } });
  }
});

// ==========================================
// BLUEPRINT ENTRIES ENDPOINTS
// ==========================================

// GET /api/blueprints/:slug/entries
blueprintRouter.get('/:slug/entries', requirePermission('blueprints.entries.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const blueprintSlug = String(req.params.slug);
    const blueprint = await BlueprintStore.getBySlug(blueprintSlug);
    if (!blueprint) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Blueprint "${blueprintSlug}" not found` }
      });
      return;
    }

    const entries = await BlueprintEntryStore.getAll(blueprintSlug);
    res.json({
      success: true,
      data: {
        blueprint,
        entries
      }
    });
  } catch (err) {
    logger.error('Failed to list blueprint entries', { error: String(err) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to retrieve entries' } });
  }
});

// GET /api/blueprints/:slug/entries/:entrySlug
blueprintRouter.get('/:slug/entries/:entrySlug', requirePermission('blueprints.entries.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const blueprintSlug = String(req.params.slug);
    const entrySlug = String(req.params.entrySlug);

    const blueprint = await BlueprintStore.getBySlug(blueprintSlug);
    if (!blueprint) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Blueprint "${blueprintSlug}" not found` }
      });
      return;
    }

    const entry = await BlueprintEntryStore.getBySlug(blueprintSlug, entrySlug);
    if (!entry) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Entry "${entrySlug}" not found in "${blueprint.name}"` }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        blueprint,
        entry
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to retrieve entry' } });
  }
});

// POST /api/blueprints/:slug/entries
blueprintRouter.post('/:slug/entries', requirePermission('blueprints.entries.create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const blueprintSlug = String(req.params.slug);
    const blueprint = await BlueprintStore.getBySlug(blueprintSlug);
    if (!blueprint) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Blueprint "${blueprintSlug}" not found` }
      });
      return;
    }

    const parseResult = CreateBlueprintEntrySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid entry data', details: parseResult.error.format() }
      });
      return;
    }

    const existingEntries = await BlueprintEntryStore.getAll(blueprintSlug);
    const existingSlugs = existingEntries.map((e) => e.slug);

    let slug = parseResult.data.slug ? slugify(parseResult.data.slug) : slugify(parseResult.data.title);
    if (!slug) slug = 'entry';
    slug = makeUniqueSlug(slug, existingSlugs);

    const now = new Date().toISOString();
    const status = parseResult.data.status || 'draft';

    const newEntry: BlueprintEntry = {
      id: `ent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      blueprintId: blueprint.id,
      title: parseResult.data.title,
      slug,
      status,
      publishedAt: status === 'published' ? now : null,
      category: parseResult.data.category || 'general',
      tags: parseResult.data.tags || [],
      excerpt: parseResult.data.excerpt || '',
      featuredImage: parseResult.data.featuredImage || '',
      data: parseResult.data.data || {},
      content: parseResult.data.content || { blocks: [] },
      seo: parseResult.data.seo,
      createdAt: now,
      updatedAt: now
    };

    await BlueprintEntryStore.save(blueprintSlug, newEntry);

    logger.audit('Blueprint entry created', {
      blueprintSlug,
      entryId: newEntry.id,
      entrySlug: newEntry.slug,
      userId: req.user?.id
    });

    triggerStaticBuild().catch(() => {});

    res.status(201).json({ success: true, data: newEntry });
  } catch (err) {
    logger.error('Failed to create blueprint entry', { error: String(err) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create entry' } });
  }
});

// PUT /api/blueprints/:slug/entries/:entrySlug
blueprintRouter.put('/:slug/entries/:entrySlug', requirePermission('blueprints.entries.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const blueprintSlug = String(req.params.slug);
    const entrySlug = String(req.params.entrySlug);

    const blueprint = await BlueprintStore.getBySlug(blueprintSlug);
    if (!blueprint) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Blueprint "${blueprintSlug}" not found` }
      });
      return;
    }

    const existing = await BlueprintEntryStore.getBySlug(blueprintSlug, entrySlug);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Entry "${entrySlug}" not found in "${blueprint.name}"` }
      });
      return;
    }

    const parseResult = UpdateBlueprintEntrySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid entry update data', details: parseResult.error.format() }
      });
      return;
    }

    let targetSlug = existing.slug;
    if (parseResult.data.slug && parseResult.data.slug !== existing.slug) {
      const allEntries = await BlueprintEntryStore.getAll(blueprintSlug);
      const otherSlugs = allEntries.filter((e) => e.id !== existing.id).map((e) => e.slug);
      targetSlug = makeUniqueSlug(slugify(parseResult.data.slug), otherSlugs);
    }

    const now = new Date().toISOString();
    const newStatus = parseResult.data.status ?? existing.status;
    let publishedAt = existing.publishedAt;
    if (newStatus === 'published' && !existing.publishedAt) {
      publishedAt = now;
    } else if (newStatus === 'draft') {
      publishedAt = null;
    }

    const updated: BlueprintEntry = {
      ...existing,
      title: parseResult.data.title ?? existing.title,
      slug: targetSlug,
      status: newStatus,
      publishedAt,
      category: parseResult.data.category ?? existing.category,
      tags: parseResult.data.tags ?? existing.tags,
      excerpt: parseResult.data.excerpt ?? existing.excerpt,
      featuredImage: parseResult.data.featuredImage ?? existing.featuredImage,
      data: parseResult.data.data !== undefined ? { ...existing.data, ...parseResult.data.data } : existing.data,
      content: parseResult.data.content ?? existing.content,
      seo: parseResult.data.seo ?? existing.seo,
      updatedAt: now
    };

    await BlueprintEntryStore.save(blueprintSlug, updated, existing.slug);

    logger.audit('Blueprint entry updated', {
      blueprintSlug,
      entryId: updated.id,
      entrySlug: updated.slug,
      oldSlug: existing.slug,
      userId: req.user?.id
    });

    triggerStaticBuild().catch(() => {});

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error('Failed to update blueprint entry', { error: String(err) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update entry' } });
  }
});

// DELETE /api/blueprints/:slug/entries/:entrySlug
blueprintRouter.delete('/:slug/entries/:entrySlug', requirePermission('blueprints.entries.delete'), async (req: Request, res: Response): Promise<void> => {
  try {
    const blueprintSlug = String(req.params.slug);
    const entrySlug = String(req.params.entrySlug);

    const blueprint = await BlueprintStore.getBySlug(blueprintSlug);
    if (!blueprint) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Blueprint "${blueprintSlug}" not found` }
      });
      return;
    }

    const existing = await BlueprintEntryStore.getBySlug(blueprintSlug, entrySlug);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Entry "${entrySlug}" not found in "${blueprint.name}"` }
      });
      return;
    }

    await BlueprintEntryStore.delete(blueprintSlug, entrySlug);

    logger.audit('Blueprint entry deleted', {
      blueprintSlug,
      entryId: existing.id,
      entrySlug,
      userId: req.user?.id
    });

    triggerStaticBuild().catch(() => {});

    res.json({ success: true, message: `Entry "${existing.title}" deleted successfully` });
  } catch (err) {
    logger.error('Failed to delete blueprint entry', { error: String(err) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete entry' } });
  }
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { StaticSiteGenerator } from '../apps/generator/src/generator.js';
import { pathExists, ensureDir, writeJsonAtomic } from '@cms/utils';
import type { BlueprintEntry } from '@cms/schemas';

describe('Sample Templates Blueprints & Trash Lifecycle', () => {
  const testBaseDir = path.resolve(process.cwd(), './generated/test-samples-lifecycle');
  const testOutputDir = path.join(testBaseDir, 'output');
  const storagePath = path.join(testBaseDir, 'storage');
  const templatesPath = path.join(testBaseDir, 'theme');
  const themeSamplesDir = path.join(templatesPath, 'sample-templates');
  const trashSamplesDir = path.join(storagePath, 'trash', 'sample-templates');

  const testActiveSlug = `active-test-${Date.now()}`;
  const testTrashedSlug = `trashed-test-${Date.now()}`;
  const testPurgedSlug = `purged-test-${Date.now()}`;

  const activeSampleFile = path.join(themeSamplesDir, `${testActiveSlug}.html`);
  const trashedSampleFile = path.join(themeSamplesDir, `${testTrashedSlug}.html`);
  const purgedSampleFile = path.join(themeSamplesDir, `${testPurgedSlug}.html`);

  beforeAll(async () => {
    await ensureDir(themeSamplesDir);
    await ensureDir(path.join(storagePath, 'content', 'templates'));
    await ensureDir(path.join(storagePath, 'trash'));
    await ensureDir(path.join(storagePath, 'blueprints'));

    // Copy theme basic templates so generator can render
    const defaultTheme = path.resolve(process.cwd(), './themes/planfo-default');
    for (const f of ['layout.html', 'home.html', 'index.html', 'page.html', 'details.html', 'demo.html']) {
      try {
        await fs.copyFile(path.join(defaultTheme, f), path.join(templatesPath, f));
      } catch {}
    }

    // Write minimal site.json and templates blueprint
    await writeJsonAtomic(path.join(storagePath, 'site.json'), {
      siteName: 'Test Samples Site',
      siteUrl: 'http://localhost:3000',
      tagline: 'Fast static templates',
      theme: 'default'
    });
    await writeJsonAtomic(path.join(storagePath, 'blueprints', 'templates.json'), {
      name: 'UI Templates',
      singularName: 'UI Template',
      slug: 'templates',
      isBuiltIn: false,
      fields: []
    });

    // Create 3 sample template files in the theme folder
    await fs.writeFile(activeSampleFile, `<html><body>Active Template: ${testActiveSlug}</body></html>`, 'utf-8');
    await fs.writeFile(trashedSampleFile, `<html><body>Trashed Template: ${testTrashedSlug}</body></html>`, 'utf-8');
    await fs.writeFile(purgedSampleFile, `<html><body>Purged Template: ${testPurgedSlug}</body></html>`, 'utf-8');

    // 1. Setup active blueprint entry for testActiveSlug
    const activeEntry: BlueprintEntry = {
      id: `ent_${Date.now()}_1`,
      blueprintId: 'templates',
      title: 'Active Template Showcase',
      slug: testActiveSlug,
      status: 'published',
      publishedAt: new Date().toISOString(),
      category: 'saas',
      tags: [],
      excerpt: 'Active template in blueprints',
      featuredImage: '',
      data: {
        demoUrl: `sample-templates/${testActiveSlug}.html`,
        downloadFile: `sample-templates/${testActiveSlug}.html`
      },
      content: { blocks: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await writeJsonAtomic(path.join(storagePath, 'content', 'templates', `${testActiveSlug}.json`), activeEntry);

    // 2. Setup trashed entry for testTrashedSlug in storagePath/trash
    const trashedEntry: BlueprintEntry = {
      id: `ent_${Date.now()}_2`,
      blueprintId: 'templates',
      title: 'Trashed Template Showcase',
      slug: testTrashedSlug,
      status: 'published',
      publishedAt: new Date().toISOString(),
      category: 'saas',
      tags: [],
      excerpt: 'Trashed template in blueprints',
      featuredImage: '',
      data: {
        demoUrl: `sample-templates/${testTrashedSlug}.html`,
        downloadFile: `sample-templates/${testTrashedSlug}.html`
      },
      content: { blocks: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const trashedItem = {
      trashId: `trash_${Date.now()}`,
      entityType: 'blueprint-entry',
      blueprintSlug: 'templates',
      originalId: trashedEntry.id,
      originalSlug: testTrashedSlug,
      title: trashedEntry.title,
      data: trashedEntry,
      deletedAt: new Date().toISOString(),
      deletedBy: 'test@example.com'
    };
    await writeJsonAtomic(path.join(storagePath, 'trash', `${trashedItem.trashId}.json`), trashedItem);

    // 3. For testPurgedSlug, it is neither active nor in trash (permanently deleted)
  });

  afterAll(async () => {
    try {
      await fs.rm(testBaseDir, { recursive: true, force: true });
    } catch {}
  });

  it('should generate active templates, archive trashed templates to trash folder, and remove permanently deleted templates from theme folder', async () => {
    const generator = new StaticSiteGenerator({
      storagePath,
      templatesPath,
      outputPath: testOutputDir
    });

    const result = await generator.build();
    expect(result.success).toBe(true);

    // 1. Active sample template:
    // - Should be kept in theme sample-templates
    expect(await pathExists(activeSampleFile)).toBe(true);
    // - Should be published to generated/sample-templates
    expect(await pathExists(path.join(testOutputDir, 'sample-templates', `${testActiveSlug}.html`))).toBe(true);

    // 2. Trashed sample template:
    // - Should NOT be in theme sample-templates
    expect(await pathExists(trashedSampleFile)).toBe(false);
    // - Should be safely kept in trash/sample-templates
    expect(await pathExists(path.join(trashSamplesDir, `${testTrashedSlug}.html`))).toBe(true);
    // - Should NOT be published in generated/sample-templates
    expect(await pathExists(path.join(testOutputDir, 'sample-templates', `${testTrashedSlug}.html`))).toBe(false);

    // 3. Permanently deleted sample template:
    // - Should be removed from theme sample-templates
    expect(await pathExists(purgedSampleFile)).toBe(false);
    // - Should NOT be in trash/sample-templates
    expect(await pathExists(path.join(trashSamplesDir, `${testPurgedSlug}.html`))).toBe(false);
    // - Should NOT be published in generated/sample-templates
    expect(await pathExists(path.join(testOutputDir, 'sample-templates', `${testPurgedSlug}.html`))).toBe(false);
  });

  it('should restore sample template file when an entry is restored to active blueprints and include it in next build', async () => {
    // Move trashed entry back to active content (restoring it)
    const trashFiles = await fs.readdir(path.join(storagePath, 'trash'));
    const trashJson = trashFiles.find((f) => f.endsWith('.json'));
    expect(trashJson).toBeDefined();

    const trashedItem = JSON.parse(await fs.readFile(path.join(storagePath, 'trash', trashJson!), 'utf-8'));
    await writeJsonAtomic(path.join(storagePath, 'content', 'templates', `${testTrashedSlug}.json`), trashedItem.data);
    await fs.rm(path.join(storagePath, 'trash', trashJson!), { force: true });

    // Regenerate site with restored entry
    const generator = new StaticSiteGenerator({
      storagePath,
      templatesPath,
      outputPath: testOutputDir
    });
    const result = await generator.build();
    expect(result.success).toBe(true);

    // Now it should be restored back to theme sample-templates
    expect(await pathExists(trashedSampleFile)).toBe(true);
    // And published in generated output
    expect(await pathExists(path.join(testOutputDir, 'sample-templates', `${testTrashedSlug}.html`))).toBe(true);
    // And removed from trash safe folder
    expect(await pathExists(path.join(trashSamplesDir, `${testTrashedSlug}.html`))).toBe(false);
  });
});

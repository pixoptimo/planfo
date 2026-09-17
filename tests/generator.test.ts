import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { StaticSiteGenerator } from '../apps/generator/src/generator.js';
import { PageStore } from '../apps/server/src/storage/pageStore.js';
import { initializeStorage } from '../apps/server/src/storage/storageInit.js';
import { pathExists } from '@cms/utils';
import type { Page } from '@cms/schemas';

describe('Static Site Generator & Publishing Pipeline', () => {
  const testOutputDir = path.resolve(process.cwd(), './generated/test-site');
  const storagePath = path.resolve(process.cwd(), './storage');
  const templatesPath = path.resolve(process.cwd(), './templates');

  beforeAll(async () => {
    await initializeStorage();
  });

  it('should compile and publish the full static website', async () => {
    // Save a published page and a draft page
    const publishedPage: Page = {
      id: `page_pub_${Date.now()}`,
      title: 'Published Static Page',
      slug: 'published-test-page',
      status: 'published',
      template: 'default',
      content: {
        blocks: [{ id: '1', type: 'paragraph', text: 'This text must appear on the static site.' }]
      },
      featuredImage: '',
      seo: {
        title: 'Published Page',
        description: 'Pub Description',
        canonical: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        robots: 'index,follow'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    };
    await PageStore.save(publishedPage);

    const draftPage: Page = {
      id: `page_draft_${Date.now()}`,
      title: 'Draft Secret Page',
      slug: 'draft-secret-page',
      status: 'draft',
      template: 'default',
      content: {
        blocks: [{ id: '1', type: 'paragraph', text: 'This text must NEVER leak to static output.' }]
      },
      featuredImage: '',
      seo: {
        title: 'Draft',
        description: '',
        canonical: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        robots: 'noindex,nofollow'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null
    };
    await PageStore.save(draftPage);

    const generator = new StaticSiteGenerator({
      storagePath,
      templatesPath,
      outputPath: testOutputDir
    });

    const result = await generator.build();

    expect(result.success).toBe(true);
    expect(result.stats.sitemapGenerated).toBe(true);
    expect(result.stats.robotsGenerated).toBe(true);

    // Verify files on disk
    expect(await pathExists(path.join(testOutputDir, 'index.html'))).toBe(true);
    expect(await pathExists(path.join(testOutputDir, 'sitemap.xml'))).toBe(true);
    expect(await pathExists(path.join(testOutputDir, 'robots.txt'))).toBe(true);
    expect(await pathExists(path.join(testOutputDir, 'published-test-page', 'index.html'))).toBe(true);

    // Check published page content
    const pageHtml = await fs.readFile(path.join(testOutputDir, 'published-test-page', 'index.html'), 'utf-8');
    expect(pageHtml).toContain('This text must appear on the static site.');

    // Crucial: Ensure draft page was NOT generated
    expect(await pathExists(path.join(testOutputDir, 'draft-secret-page', 'index.html'))).toBe(false);

    // Check sitemap does NOT include draft
    const sitemapContent = await fs.readFile(path.join(testOutputDir, 'sitemap.xml'), 'utf-8');
    expect(sitemapContent).toContain('published-test-page');
    expect(sitemapContent).not.toContain('draft-secret-page');

    // Clean up test pages
    await PageStore.delete(publishedPage.slug);
    await PageStore.delete(draftPage.slug);
  });

  it('should render real-time preview for drafts without publishing', async () => {
    const draftPage: Page = {
      id: `page_preview_${Date.now()}`,
      title: 'Preview Draft Page',
      slug: 'preview-draft-page',
      status: 'draft',
      template: 'default',
      content: {
        blocks: [{ id: '1', type: 'paragraph', text: 'Live preview content in memory.' }]
      },
      featuredImage: '',
      seo: {
        title: 'Preview',
        description: '',
        canonical: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        robots: 'index,follow'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null
    };

    const generator = new StaticSiteGenerator({
      storagePath,
      templatesPath,
      outputPath: testOutputDir
    });

    const previewHtml = await generator.renderPreview('page', draftPage);
    expect(previewHtml).toContain('Live preview content in memory.');
    expect(previewHtml).toContain('Preview Draft Page');
  });
});

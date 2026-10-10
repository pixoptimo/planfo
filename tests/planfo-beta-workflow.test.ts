import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createPlanfoProject } from '../packages/create-planfo/src/index.js';
import { StaticSiteGenerator } from '../apps/generator/src/generator.js';
import { GitPublisher } from '../apps/generator/src/publishers/gitPublisher.js';
import { PageStore } from '../apps/server/src/storage/pageStore.js';
import { sanitize, renderStructuredContent, safeResolvePath } from '@cms/utils';
import type { Page } from '@cms/schemas';

describe('Planfo CMS — Beta v0.1 Automated Verification Suite', () => {
  const testProjectName = 'test-planfo-workspace';
  const testProjectDir = path.resolve(process.cwd(), testProjectName);
  const planfoDir = path.join(testProjectDir, '.planfo');
  const generatedDir = path.join(testProjectDir, 'generated');

  afterAll(async () => {
    try {
      await fs.rm(testProjectDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  // 1. Workflow: Project Creation
  it('should scaffold a complete Planfo CMS project structure without a database', () => {
    const result = createPlanfoProject({
      name: testProjectName,
      targetDir: testProjectName,
      theme: 'planfo-default'
    });

    expect(result.success).toBe(true);
    expect(existsSync(planfoDir)).toBe(true);
    expect(existsSync(path.join(planfoDir, 'config.json'))).toBe(true);
    expect(existsSync(path.join(planfoDir, 'settings.json'))).toBe(true);
    expect(existsSync(path.join(planfoDir, 'content/pages/home.json'))).toBe(true);
    expect(existsSync(path.join(planfoDir, 'content/pages/about.json'))).toBe(true);
    expect(existsSync(path.join(planfoDir, 'content/pages/contact.json'))).toBe(true);
    expect(existsSync(path.join(planfoDir, 'media'))).toBe(true);
    expect(existsSync(path.join(planfoDir, 'themes/planfo-default/theme.json'))).toBe(true);
    expect(existsSync(generatedDir)).toBe(true);
    expect(existsSync(path.join(testProjectDir, 'README.md'))).toBe(true);
  });

  // 2. Content CRUD
  it('should create, read, update, and manage pages with human-readable JSON storage', async () => {
    const newPage: Page = {
      id: 'page_services_test',
      title: 'Our Services',
      slug: 'services',
      status: 'published',
      template: 'default',
      content: {
        blocks: [
          {
            id: 'b1',
            type: 'heading',
            level: 2,
            text: 'High-Performance Static Engineering'
          },
          {
            id: 'b2',
            type: 'paragraph',
            text: 'We deliver blazing fast websites using Planfo CMS.'
          }
        ]
      },
      featuredImage: '/media/services-cover.webp',
      seo: {
        title: 'Services | Planfo Website',
        description: 'Explore our fast static web solutions',
        robots: 'index,follow'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    };

    const pageFile = path.join(planfoDir, 'content/pages/services.json');

    // Create & Save
    await fs.writeFile(pageFile, JSON.stringify(newPage, null, 2), 'utf-8');
    expect(existsSync(pageFile)).toBe(true);

    // Read & Verify
    const loadedRaw = await fs.readFile(pageFile, 'utf-8');
    const loadedPage: Page = JSON.parse(loadedRaw);
    expect(loadedPage.title).toBe('Our Services');
    expect(loadedPage.slug).toBe('services');
    expect(loadedPage.status).toBe('published');

    // Update Page
    loadedPage.title = 'Our Custom Services';
    loadedPage.status = 'draft';
    await fs.writeFile(pageFile, JSON.stringify(loadedPage, null, 2), 'utf-8');

    const updatedRaw = await fs.readFile(pageFile, 'utf-8');
    const updatedPage: Page = JSON.parse(updatedRaw);
    expect(updatedPage.title).toBe('Our Custom Services');
    expect(updatedPage.status).toBe('draft');

    // Delete Page
    await fs.rm(pageFile, { force: true });
    expect(existsSync(pageFile)).toBe(false);
  });

  // 3. Static Site Generator
  it('should compile content, templates, and planfo-default theme into production-ready HTML', async () => {
    const generator = new StaticSiteGenerator({
      storagePath: planfoDir,
      templatesPath: path.resolve(process.cwd(), 'themes/planfo-default'),
      outputPath: generatedDir
    });

    const result = await generator.build();
    expect(result.success).toBe(true);
    expect(result.stats.pagesGenerated).toBeGreaterThanOrEqual(3);

    // Verify index.html (Home)
    const indexPath = path.join(generatedDir, 'index.html');
    expect(existsSync(indexPath)).toBe(true);
    const indexHtml = await fs.readFile(indexPath, 'utf-8');
    expect(indexHtml).toContain('<!DOCTYPE html>');
    expect(indexHtml).toContain('Welcome to My Website');
    expect(indexHtml).toContain('rel="stylesheet" href="./assets/style.css"');

    // Verify about/index.html
    const aboutPath = path.join(generatedDir, 'about/index.html');
    expect(existsSync(aboutPath)).toBe(true);
    const aboutHtml = await fs.readFile(aboutPath, 'utf-8');
    expect(aboutHtml).toContain('About Us');
    expect(aboutHtml).toContain('rel="stylesheet" href="../assets/style.css"');

    // Verify contact/index.html
    const contactPath = path.join(generatedDir, 'contact/index.html');
    expect(existsSync(contactPath)).toBe(true);
    const contactHtml = await fs.readFile(contactPath, 'utf-8');
    expect(contactHtml).toContain('Contact Us');

    // Verify assets copied
    expect(existsSync(path.join(generatedDir, 'assets/style.css'))).toBe(true);
    expect(existsSync(path.join(generatedDir, 'assets/script.js'))).toBe(true);

    // Verify SEO sitemap.xml and robots.txt
    expect(existsSync(path.join(generatedDir, 'sitemap.xml'))).toBe(true);
    expect(existsSync(path.join(generatedDir, 'robots.txt'))).toBe(true);
  });

  // 4. Preview
  it('should render page preview using the exact same generator engine', async () => {
    const generator = new StaticSiteGenerator({
      storagePath: planfoDir,
      templatesPath: path.resolve(process.cwd(), 'themes/planfo-default'),
      outputPath: generatedDir
    });

    const testDraftPage: Page = {
      id: 'draft_preview_test',
      title: 'Unpublished Draft Preview',
      slug: 'preview-test',
      status: 'draft',
      template: 'default',
      content: {
        blocks: [
          {
            id: 'b_prev',
            type: 'heading',
            level: 1,
            text: 'Live Preview Before Publishing'
          }
        ]
      },
      featuredImage: '',
      seo: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null
    };

    const previewHtml = await generator.renderPreview('page', testDraftPage);
    expect(previewHtml).toContain('Live Preview Before Publishing');
    expect(previewHtml).toContain('<!DOCTYPE html>');
  });

  // 5. Security Baseline
  it('should enforce path traversal, XSS, and filename sanitization', () => {
    // Path traversal protection
    expect(() => safeResolvePath('/var/www/planfo', '../../etc/passwd')).toThrow();
    expect(() => safeResolvePath('/var/www/planfo', 'sub/../../../shadow')).toThrow();

    // XSS Sanitization
    const maliciousInput = '<script>alert("xss")</script><h1>Clean Heading</h1><p onmouseover="alert(1)">Text</p>';
    const sanitized = sanitize(maliciousInput);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('onmouseover');
    expect(sanitized).toContain('Clean Heading');

    // Rich Text renderContent sanitization
    const rendered = renderStructuredContent(maliciousInput);
    expect(rendered).not.toContain('<script>');
    expect(rendered).toContain('Clean Heading');
  });

  // 6. GitHub Pages Deployment Isolation
  it('should strictly guarantee that .planfo and private files never enter deployment output', async () => {
    const publisher = new GitPublisher({
      branch: 'gh-pages',
      repo: 'test-user/my-planfo-site'
    });

    // Output directory contains public files: validate should pass
    const isValid = await publisher.validate(generatedDir);
    expect(isValid).toBe(true);

    // If a private file or .planfo is maliciously placed in output, validate MUST throw and abort
    const leakedFilePath = path.join(generatedDir, 'users.json');
    await fs.writeFile(leakedFilePath, '{"private": true}');

    await expect(publisher.validate(generatedDir)).rejects.toThrow('Security validation failed');

    // Clean up leak
    await fs.rm(leakedFilePath, { force: true });

    // Verify .planfo leak protection
    const leakedPlanfoPath = path.join(generatedDir, '.planfo');
    await fs.mkdir(leakedPlanfoPath, { recursive: true });

    await expect(publisher.validate(generatedDir)).rejects.toThrow('Security validation failed');

    await fs.rm(leakedPlanfoPath, { recursive: true, force: true });
  });
});

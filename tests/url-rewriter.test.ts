import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../apps/server/src/app.js';
import { UrlRewriter } from '../apps/server/src/storage/urlRewriter.js';
import { StaticSiteGenerator } from '../apps/generator/src/generator.js';
import { config } from '../apps/server/src/config/env.js';

import fs from 'node:fs/promises';
import path from 'node:path';

describe('Global URL Rewriter & Smart Permalink Redirection', () => {
  let server: Server;
  let baseUrl: string;
  const testFilePath = path.join(config.STORAGE_PATH, 'content/pages/_test_url_migration.json');

  beforeAll(async () => {
    // Write a test document with sample URL to test search and replace
    await fs.writeFile(
      testFilePath,
      JSON.stringify({
        id: 'test-migration-page',
        slug: 'test-migration',
        title: 'Migration Test Page',
        url: 'http://old-migration-domain.test/blog/item',
        content: 'Check out http://old-migration-domain.test/blog/item'
      }, null, 2)
    );

    const generator = new StaticSiteGenerator({
      storagePath: config.STORAGE_PATH,
      templatesPath: config.TEMPLATES_PATH,
      outputPath: config.OUTPUT_PATH
    });
    await generator.build();

    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    try {
      await fs.rm(testFilePath, { force: true });
    } catch {
      // ignore
    }
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('should automatically 301 redirect /blog/:productSlug to /products/:productSlug when visiting product under /blog/', async () => {
    const res = await fetch(`${baseUrl}/blog/aero-cms-limited-edition-hoodie`, { redirect: 'manual' });
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('/products/aero-cms-limited-edition-hoodie');
  });

  it('should support dryRun mode in UrlRewriter without writing files', async () => {
    const dryRunRes = await UrlRewriter.execute('http://old-migration-domain.test', 'http://new-migration-domain.test', true);
    expect(dryRunRes.dryRun).toBe(true);
    expect(dryRunRes.search).toBe('http://old-migration-domain.test');
    expect(dryRunRes.replace).toBe('http://new-migration-domain.test');
    expect(dryRunRes.totalMatches).toBeGreaterThanOrEqual(1);
    expect(dryRunRes.filesChanged).toBeGreaterThanOrEqual(1);

    // File should NOT have been modified
    const rawContent = await fs.readFile(testFilePath, 'utf-8');
    expect(rawContent).toContain('http://old-migration-domain.test');
  });

  it('should safely replace legacy URLs across JSON storage and regenerate website', async () => {
    const replaceRes = await UrlRewriter.execute('http://old-migration-domain.test', 'http://new-migration-domain.test', false);
    expect(replaceRes.dryRun).toBe(false);
    expect(replaceRes.totalMatches).toBeGreaterThanOrEqual(1);
    expect(replaceRes.filesChanged).toBeGreaterThanOrEqual(1);

    // File SHOULD have been updated
    const rawContent = await fs.readFile(testFilePath, 'utf-8');
    expect(rawContent).toContain('http://new-migration-domain.test');
    expect(rawContent).not.toContain('http://old-migration-domain.test');

    // Verify after replacement that matches are now 0
    const verifyRes = await UrlRewriter.execute('http://old-migration-domain.test', 'http://new-migration-domain.test', true);
    expect(verifyRes.totalMatches).toBe(0);
  });
});

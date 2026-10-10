import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../apps/server/src/app.js';
import { systemInfo } from '../apps/server/src/systemInfo.js';
import { StaticSiteGenerator } from '../apps/generator/src/generator.js';
import { config } from '../apps/server/src/config/env.js';

describe('Unified Server & URL Mapping (WordPress Single-Port Architecture)', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    // Generate site to ensure latest output exists
    const generator = new StaticSiteGenerator({
      storagePath: config.STORAGE_PATH,
      templatesPath: config.TEMPLATES_PATH,
      outputPath: config.OUTPUT_PATH
    });
    await generator.build();

    systemInfo.cmsPort = 4000;
    systemInfo.sitePort = 4000;
    systemInfo.cmsUrl = 'http://localhost:4000';
    systemInfo.siteUrl = 'http://localhost:4000';
    systemInfo.isStaticServerRunning = true;

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
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('should serve system info with matching cmsPort and sitePort (WordPress single-port model)', async () => {
    const res = await fetch(`${baseUrl}/api/system/info`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.cmsPort).toBe(body.data.sitePort);
    expect(body.data.cmsUrl).toBe(body.data.siteUrl);
  });

  it('should serve /products archive with correct /products/<slug> links (no /blog/ mismatch)', async () => {
    const res = await fetch(`${baseUrl}/products/`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('/products/aero-cms-limited-edition-hoodie');
    expect(text).not.toContain('/blog/aero-cms-limited-edition-hoodie');
  });

  it('should serve individual product detail at /products/aero-cms-limited-edition-hoodie with 200 OK', async () => {
    const res = await fetch(`${baseUrl}/products/aero-cms-limited-edition-hoodie/`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Aero CMS Limited Edition Hoodie');
  });

  it('should redirect /admin to /admin/ and serve admin dashboard SPA', async () => {
    const redirectRes = await fetch(`${baseUrl}/admin`, { redirect: 'manual' });
    expect(redirectRes.status).toBe(301);
    expect(redirectRes.headers.get('location')).toBe('/admin/');

    const adminRes = await fetch(`${baseUrl}/admin/`);
    expect(adminRes.status).toBe(200);
    const text = await adminRes.text();
    expect(text).toContain('Static CMS - Admin Dashboard');
  });

  it('should support SPA client-side routes under /admin/*', async () => {
    const res = await fetch(`${baseUrl}/admin/blueprints/products`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Static CMS - Admin Dashboard');
  });

  it('should serve public homepage at /', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Aero Static CMS');
  });
});

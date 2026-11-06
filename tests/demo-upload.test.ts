import { describe, it, expect, beforeAll } from 'vitest';
import archiver from 'archiver';
import { DemoStore } from '../apps/server/src/storage/demoStore.js';
import { initializeStorage } from '../apps/server/src/storage/storageInit.js';

describe('Demo ZIP Upload and Multi-Page Extraction', () => {
  beforeAll(async () => {
    await initializeStorage();
  });

  it('should extract zip with index.html and multi-page subpages, mapping entry and bundle', async () => {
    // Create an in-memory ZIP archive containing index.html, about.html, and css
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk) => chunks.push(chunk));

    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);
    });

    archive.append('<!DOCTYPE html><html><body><h1>Main Home</h1><a href="about.html">About</a></body></html>', {
      name: 'index.html'
    });
    archive.append('<!DOCTYPE html><html><body><h1>About Page</h1><a href="index.html">Back</a></body></html>', {
      name: 'about.html'
    });
    archive.append('body { background: #000; color: #fff; }', {
      name: 'assets/css/style.css'
    });

    await archive.finalize();
    const zipBuffer = await archivePromise;

    const testSlug = `test-theme-${Date.now()}`;
    const result = await DemoStore.extractDemoZip(testSlug, zipBuffer);

    expect(result.success).toBe(true);
    expect(result.demoUrl).toBe(`demos/${testSlug}/index.html`);
    expect(result.downloadFile).toBe(`demos/${testSlug}/bundle.zip`);
    expect(result.entryHtml).toBe('index.html');
    expect(result.filesCount).toBe(3);
  });

  it('should fail gracefully if zip contains no html files', async () => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk) => chunks.push(chunk));

    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);
    });

    archive.append('Some text content', { name: 'readme.txt' });
    await archive.finalize();
    const zipBuffer = await archivePromise;

    const result = await DemoStore.extractDemoZip(`invalid-zip-${Date.now()}`, zipBuffer);
    expect(result.success).toBe(false);
    expect(result.error).toContain('No HTML file found');
  });
});

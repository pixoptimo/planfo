import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { optimizeImage } from '../apps/server/src/storage/imageOptimizer.js';
import { MediaStore } from '../apps/server/src/storage/mediaStore.js';
import { initializeStorage } from '../apps/server/src/storage/storageInit.js';
import { pathExists } from '@cms/utils';

describe('Image Compression & WebP Conversion Pipeline', () => {
  beforeAll(async () => {
    await initializeStorage();
  });

  it('should compress a raw PNG buffer and convert to WebP with size reduction', async () => {
    // Generate an uncompressed 800x600 PNG image with gradient
    const rawPngBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 4,
        background: { r: 230, g: 100, b: 50, alpha: 1 }
      }
    })
      .png({ compressionLevel: 0 }) // Uncompressed PNG
      .toBuffer();

    const originalSize = rawPngBuffer.length;
    expect(originalSize).toBeGreaterThan(10000);

    const result = await optimizeImage(rawPngBuffer, 'hero-banner.png', 'image/png');

    expect(result.mimeType).toBe('image/webp');
    expect(result.format).toBe('webp');
    expect(result.filename.endsWith('.webp')).toBe(true);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.size).toBeLessThan(originalSize);
    expect(result.originalSize).toBe(originalSize);
    expect(result.compressionRatio).toBeGreaterThan(0);

    // Verify the output buffer is indeed a valid WebP image readable by sharp
    const webpMeta = await sharp(result.buffer).metadata();
    expect(webpMeta.format).toBe('webp');
    expect(webpMeta.width).toBe(800);
    expect(webpMeta.height).toBe(600);
  });

  it('should compress a JPEG buffer and convert to WebP', async () => {
    // Generate a test JPEG
    const rawJpegBuffer = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: { r: 60, g: 120, b: 240 }
      }
    })
      .jpeg({ quality: 100 })
      .toBuffer();

    const result = await optimizeImage(rawJpegBuffer, 'product-photo.jpg', 'image/jpeg');

    expect(result.mimeType).toBe('image/webp');
    expect(result.filename.endsWith('.webp')).toBe(true);
    expect(result.width).toBe(1200);
    expect(result.height).toBe(800);

    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe('webp');
  });

  it('should preserve vector SVG images without rasterizing them to WebP', async () => {
    const svgCode = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="green"/></svg>';
    const svgBuffer = Buffer.from(svgCode, 'utf-8');

    const result = await optimizeImage(svgBuffer, 'company-logo.svg', 'image/svg+xml');

    expect(result.mimeType).toBe('image/svg+xml');
    expect(result.format).toBe('svg');
    expect(result.filename.endsWith('.svg')).toBe(true);
    expect(result.buffer.toString('utf-8')).toContain('<svg');
  });

  it('should execute MediaStore.saveUpload end-to-end and store WebP media item', async () => {
    const testImageBuffer = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      }
    })
      .png()
      .toBuffer();

    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'user-uploaded-avatar.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: testImageBuffer.length,
      buffer: testImageBuffer,
      stream: null as any,
      destination: '',
      filename: '',
      path: ''
    };

    const mediaItem = await MediaStore.saveUpload(mockFile, 'User Avatar');

    expect(mediaItem.id).toBeDefined();
    expect(mediaItem.filename.endsWith('.webp')).toBe(true);
    expect(mediaItem.mimeType).toBe('image/webp');
    expect(mediaItem.originalName).toBe('user-uploaded-avatar.png');
    expect(mediaItem.size).toBeGreaterThan(0);
    expect(mediaItem.originalSize).toBe(testImageBuffer.length);
    expect(mediaItem.width).toBe(400);
    expect(mediaItem.height).toBe(400);

    // Verify manifest was updated and item can be retrieved
    const retrieved = await MediaStore.getById(mediaItem.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.filename).toBe(mediaItem.filename);
    expect(retrieved?.mimeType).toBe('image/webp');

    // Clean up
    await MediaStore.deleteItem(mediaItem.id);
    expect(await MediaStore.getById(mediaItem.id)).toBeNull();
  });

  it('should preserve .ico favicon files without converting them to WebP', async () => {
    const fakeIcoBuffer = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10]);
    const result = await optimizeImage(fakeIcoBuffer, 'favicon.ico', 'image/x-icon');

    expect(result.format).toBe('ico');
    expect(result.mimeType).toBe('image/x-icon');
    expect(result.filename.endsWith('.ico')).toBe(true);
    expect(result.buffer).toEqual(fakeIcoBuffer);
  });

  it('should preserve favicon PNG files without converting them to WebP', async () => {
    const rawFaviconBuffer = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 4,
        background: { r: 124, g: 58, b: 237, alpha: 1 }
      }
    })
      .png()
      .toBuffer();

    const result = await optimizeImage(rawFaviconBuffer, 'favicon.png', 'image/png');

    expect(result.format).toBe('png');
    expect(result.mimeType).toBe('image/png');
    expect(result.filename.endsWith('.png')).toBe(true);

    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(32);
    expect(meta.height).toBe(32);
  });
});

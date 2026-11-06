import path from 'node:path';
import sharp from 'sharp';
import { logger, sanitizeFilename } from '@cms/utils';

export interface OptimizedImageResult {
  buffer: Buffer;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  originalSize: number;
  width?: number;
  height?: number;
  format: string;
  compressionRatio?: number; // e.g. 64 for 64% reduction
}

export interface ImageOptimizationOptions {
  quality?: number; // 1-100, default 80
  maxWidth?: number; // e.g. 2560
  maxHeight?: number; // e.g. 2560
  effort?: number; // 0-6, default 4
}

/**
 * Optimizes an uploaded image buffer by converting raster formats to WebP,
 * auto-rotating, stripping bloat metadata, and reducing byte size.
 */
export async function optimizeImage(
  buffer: Buffer,
  originalFilename: string,
  mimetype: string,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const originalSize = buffer.length;
  const ext = path.extname(originalFilename).toLowerCase();
  const cleanBaseName = sanitizeFilename(path.basename(originalFilename, ext)) || 'image';
  const timestamp = Date.now();

  // If vector SVG, preserve original SVG vector format without rasterization
  if (mimetype === 'image/svg+xml' || ext === '.svg') {
    const filename = `${cleanBaseName}-${timestamp}.svg`;
    return {
      buffer,
      filename,
      originalName: originalFilename,
      mimeType: 'image/svg+xml',
      size: originalSize,
      originalSize,
      format: 'svg',
      compressionRatio: 0
    };
  }

  const lowerName = originalFilename.toLowerCase();
  const isIco = ext === '.ico' || mimetype === 'image/x-icon' || mimetype === 'image/vnd.microsoft.icon';
  const isFavicon = lowerName.includes('favicon') || lowerName.includes('fonticon') || lowerName.includes('fav-icon');

  // If .ico (icon container), preserve exact ICO format without WebP conversion
  if (isIco) {
    const filename = `${cleanBaseName}-${timestamp}.ico`;
    return {
      buffer,
      filename,
      originalName: originalFilename,
      mimeType: 'image/x-icon',
      size: originalSize,
      originalSize,
      format: 'ico',
      compressionRatio: 0
    };
  }

  // If favicon/fonticon uploaded as PNG, keep format as PNG without converting to WebP
  if (isFavicon && (ext === '.png' || mimetype === 'image/png')) {
    const pipeline = sharp(buffer, { failOn: 'none' });
    pipeline.rotate();
    pipeline.png({ compressionLevel: 9 });
    const optimizedBuffer = await pipeline.toBuffer();
    const finalMetadata = await sharp(optimizedBuffer).metadata();
    const newSize = optimizedBuffer.length;
    const compressionRatio = originalSize > 0
      ? Math.round(((originalSize - newSize) / originalSize) * 100)
      : 0;
    const filename = `${cleanBaseName}-${timestamp}.png`;
    return {
      buffer: optimizedBuffer,
      filename,
      originalName: originalFilename,
      mimeType: 'image/png',
      size: newSize,
      originalSize,
      width: finalMetadata.width,
      height: finalMetadata.height,
      format: 'png',
      compressionRatio: Math.max(0, compressionRatio)
    };
  }

  const quality = options.quality ?? 80;
  const effort = options.effort ?? 4;
  const maxWidth = options.maxWidth ?? 2560;
  const maxHeight = options.maxHeight ?? 2560;

  try {
    const pipeline = sharp(buffer, { failOn: 'none' });
    const metadata = await pipeline.metadata();

    // Auto-orient based on EXIF orientation
    pipeline.rotate();

    // Downscale only if image exceeds maximum dimensions (e.g. 4K/8K camera uploads)
    if (metadata.width && metadata.height && (metadata.width > maxWidth || metadata.height > maxHeight)) {
      pipeline.resize({
        width: metadata.width > maxWidth ? maxWidth : undefined,
        height: metadata.height > maxHeight ? maxHeight : undefined,
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert to optimized WebP
    pipeline.webp({
      quality,
      effort,
      lossless: false
    });

    const optimizedBuffer = await pipeline.toBuffer();
    const finalMetadata = await sharp(optimizedBuffer).metadata();

    const newSize = optimizedBuffer.length;
    const compressionRatio = originalSize > 0
      ? Math.round(((originalSize - newSize) / originalSize) * 100)
      : 0;

    const filename = `${cleanBaseName}-${timestamp}.webp`;

    logger.info(`Optimized image to WebP [${originalFilename} -> ${filename}]`, {
      originalSize,
      newSize,
      savedBytes: originalSize - newSize,
      compressionRatio: `${compressionRatio}%`,
      dimensions: `${finalMetadata.width}x${finalMetadata.height}`
    });

    return {
      buffer: optimizedBuffer,
      filename,
      originalName: originalFilename,
      mimeType: 'image/webp',
      size: newSize,
      originalSize,
      width: finalMetadata.width,
      height: finalMetadata.height,
      format: 'webp',
      compressionRatio: Math.max(0, compressionRatio)
    };
  } catch (err) {
    logger.warn(`Image compression failed for "${originalFilename}", falling back to original:`, {
      error: String(err)
    });

    // Graceful fallback: return original buffer with unique name
    const filename = `${cleanBaseName}-${timestamp}${ext}`;
    return {
      buffer,
      filename,
      originalName: originalFilename,
      mimeType: mimetype,
      size: originalSize,
      originalSize,
      format: ext.replace('.', ''),
      compressionRatio: 0
    };
  }
}

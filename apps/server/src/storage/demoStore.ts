import fs from 'node:fs/promises';
import path from 'node:path';
import unzipper from 'unzipper';
import { safeResolvePath, ensureDir, pathExists, logger } from '@cms/utils';
import { config } from '../config/env.js';

export interface DemoUploadResult {
  success: boolean;
  demoUrl?: string;
  downloadFile?: string;
  entryHtml?: string;
  filesCount?: number;
  totalSize?: number;
  error?: string;
}

export class DemoStore {
  private static getDemosPath(): string {
    return config.DEMOS_PATH;
  }

  static async extractDemoZip(
    slug: string,
    zipBuffer: Buffer
  ): Promise<DemoUploadResult> {
    try {
      const sanitizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') || `demo-${Date.now()}`;
      const demosRoot = this.getDemosPath();
      await ensureDir(demosRoot);

      const targetDir = safeResolvePath(demosRoot, sanitizedSlug);
      // Clean previous extraction for this slug if any
      if (await pathExists(targetDir)) {
        await fs.rm(targetDir, { recursive: true, force: true });
      }
      await ensureDir(targetDir);

      // Save bundle.zip for downloads
      const zipFilePath = path.join(targetDir, 'bundle.zip');
      await fs.writeFile(zipFilePath, zipBuffer);

      // Open and parse ZIP
      const directory = await unzipper.Open.buffer(zipBuffer);
      const validFiles = directory.files.filter(
        (f) => f.type !== 'Directory' && !f.path.includes('__MACOSX') && !path.basename(f.path).startsWith('._')
      );

      if (validFiles.length === 0) {
        return { success: false, error: 'The uploaded ZIP archive contains no readable files.' };
      }

      // Check if all files share a common single root folder prefix (e.g. "my-template/index.html")
      let commonPrefix = '';
      const firstParts = validFiles[0].path.split('/');
      if (firstParts.length > 1) {
        const candidate = firstParts[0] + '/';
        const allMatch = validFiles.every((f) => f.path.startsWith(candidate));
        if (allMatch) {
          commonPrefix = candidate;
        }
      }

      let filesCount = 0;
      let totalSize = 0;
      const extractedHtmlFiles: string[] = [];

      for (const file of validFiles) {
        let relPath = file.path;
        if (commonPrefix && relPath.startsWith(commonPrefix)) {
          relPath = relPath.slice(commonPrefix.length);
        }

        // Clean leading slashes
        relPath = relPath.replace(/^\/+/, '');
        if (!relPath) continue;

        // Path traversal protection
        const outPath = safeResolvePath(targetDir, relPath);
        if (!outPath.startsWith(targetDir)) {
          continue; // skip unsafe path
        }

        await ensureDir(path.dirname(outPath));
        const content = await file.buffer();
        await fs.writeFile(outPath, content);
        filesCount++;
        totalSize += content.length;

        if (relPath.toLowerCase().endsWith('.html') || relPath.toLowerCase().endsWith('.htm')) {
          extractedHtmlFiles.push(relPath);
        }
      }

      if (extractedHtmlFiles.length === 0) {
        return {
          success: false,
          error: 'No HTML file found inside the ZIP. Ensure your template contains an index.html file.'
        };
      }

      // Determine the main entry point:
      // 1. index.html at root
      // 2. `${sanitizedSlug}.html` at root
      // 3. Any root .html file
      // 4. Any index.html in subdirectories
      // 5. First .html file found
      let entryHtml = extractedHtmlFiles.find((f) => f.toLowerCase() === 'index.html');
      if (!entryHtml) {
        entryHtml = extractedHtmlFiles.find((f) => f.toLowerCase() === `${sanitizedSlug}.html`);
      }
      if (!entryHtml) {
        entryHtml = extractedHtmlFiles.find((f) => !f.includes('/'));
      }
      if (!entryHtml) {
        entryHtml = extractedHtmlFiles.find((f) => f.toLowerCase().endsWith('/index.html'));
      }
      if (!entryHtml) {
        entryHtml = extractedHtmlFiles[0];
      }

      const demoUrl = `demos/${sanitizedSlug}/${entryHtml}`;
      const downloadFile = `demos/${sanitizedSlug}/bundle.zip`;

      logger.audit('Demo ZIP Extracted Successfully', {
        slug: sanitizedSlug,
        demoUrl,
        downloadFile,
        entryHtml,
        filesCount,
        totalSize
      });

      return {
        success: true,
        demoUrl,
        downloadFile,
        entryHtml,
        filesCount,
        totalSize
      };
    } catch (err) {
      logger.error('Failed to extract demo zip', { error: String(err) });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to extract demo ZIP'
      };
    }
  }

  static async deleteDemo(slug: string): Promise<boolean> {
    try {
      const sanitizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      if (!sanitizedSlug) return false;
      const targetDir = safeResolvePath(this.getDemosPath(), sanitizedSlug);
      if (await pathExists(targetDir)) {
        await fs.rm(targetDir, { recursive: true, force: true });
      }
      const fallbackTarget = path.resolve(config.WORKSPACE_ROOT, 'apps/server/storage/demos', sanitizedSlug);
      if (await pathExists(fallbackTarget)) {
        await fs.rm(fallbackTarget, { recursive: true, force: true });
      }
      const generatedTarget = path.join(config.OUTPUT_PATH, 'demos', sanitizedSlug);
      if (await pathExists(generatedTarget)) {
        await fs.rm(generatedTarget, { recursive: true, force: true });
      }
      return true;
    } catch (err) {
      logger.error('Failed to delete demo directory', { slug, error: String(err) });
      return false;
    }
  }
}

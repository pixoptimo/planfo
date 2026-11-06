import path from 'node:path';
import fs from 'node:fs/promises';
import { pathExists, ensureDir, writeFileAtomic } from './atomicFs.js';
import { logger } from './logger.js';

let esbuildInstance: any = null;

async function getEsbuild(): Promise<any> {
  if (esbuildInstance !== null) return esbuildInstance;
  try {
    esbuildInstance = await import('esbuild');
  } catch {
    esbuildInstance = false;
  }
  return esbuildInstance;
}

/**
 * Minifies CSS code using esbuild if available, with robust regex-based fallback.
 */
export async function compressCss(css: string): Promise<string> {
  if (!css || !css.trim()) return '';

  const esbuild = await getEsbuild();
  if (esbuild && typeof esbuild.transform === 'function') {
    try {
      const res = await esbuild.transform(css, { loader: 'css', minify: true });
      return res.code.trim();
    } catch {
      // Fallback below
    }
  }

  // Fallback CSS compressor
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\s*([\{\}\:\;\,>~+])\s*/g, '$1') // Remove spaces around delimiters
    .replace(/;}/g, '}') // Remove trailing semicolons
    .trim();
}

/**
 * Minifies JS code using esbuild if available, with robust regex-based fallback.
 */
export async function compressJs(js: string): Promise<string> {
  if (!js || !js.trim()) return '';

  const esbuild = await getEsbuild();
  if (esbuild && typeof esbuild.transform === 'function') {
    try {
      const res = await esbuild.transform(js, { loader: 'js', minify: true });
      return res.code.trim();
    } catch {
      // Fallback below
    }
  }

  // Fallback JS compressor: clean comments and collapse multiple empty lines
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '') // Strip block comments
    .replace(/(^|[^:])\/\/[^\n\r]*/g, '$1') // Strip single-line comments safely
    .replace(/^\s*[\r\n]/gm, '') // Remove empty lines
    .trim();
}

/**
 * Safely minifies HTML markup while strictly preserving contents of pre, code, textarea, and script tags.
 */
export function compressHtml(html: string): string {
  if (!html || !html.trim()) return '';

  const preservedBlocks: string[] = [];
  const preserved = html.replace(/<(pre|code|textarea|script)[\s\S]*?<\/\1>/gi, (match) => {
    const token = `___PLANFO_PRESERVED_BLOCK_${preservedBlocks.length}___`;
    preservedBlocks.push(match);
    return token;
  });

  let min = preserved
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '') // Strip comments except conditional comments
    .replace(/>\s+</g, '><') // Collapse whitespace between HTML tags
    .trim();

  // Restore preserved blocks
  preservedBlocks.forEach((block, idx) => {
    min = min.replace(`___PLANFO_PRESERVED_BLOCK_${idx}___`, block);
  });

  return min;
}

export interface OptimizationStats {
  cssFiles: number;
  jsFiles: number;
  htmlFiles: number;
  unwantedFilesPurged: number;
  bytesSaved: number;
}

/**
 * Recursively cleans, optimizes, and compresses all files in a static site staging directory:
 * 1. Purges OS junk (.DS_Store, Thumbs.db, ._*, temp files)
 * 2. Purges any accidental root .html files other than index.html (eliminating duplicate about.html, etc.)
 * 3. Minifies all CSS files (.css)
 * 4. Minifies all JS files (.js)
 * 5. Compresses HTML markup (.html)
 * 6. Prunes unreferenced images from assets/images
 * 7. Prunes empty directories
 */
export async function cleanAndOptimizeStagingDirectory(
  stagingDir: string,
  options: {
    preserveMediaNames?: Set<string>;
    removeUnreferencedImages?: boolean;
  } = {}
): Promise<OptimizationStats> {
  const stats: OptimizationStats = {
    cssFiles: 0,
    jsFiles: 0,
    htmlFiles: 0,
    unwantedFilesPurged: 0,
    bytesSaved: 0
  };

  if (!(await pathExists(stagingDir))) {
    return stats;
  }

  // 1. Purge unwanted root files (e.g. duplicate about.html, contact.html, details.html, etc.)
  const rootEntries = await fs.readdir(stagingDir, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (entry.isFile()) {
      const lower = entry.name.toLowerCase();
      // Only canonical root HTML files are allowed (index.html, demo.html, 404.html).
      // Remove stray duplicate root .html files (about.html, contact.html, privacy.html, terms.html, etc. which have canonical directories)
      const allowedRootHtml = new Set(['index.html', 'demo.html', '404.html']);
      if (lower.endsWith('.html') && !allowedRootHtml.has(lower)) {
        await fs.rm(path.join(stagingDir, entry.name), { force: true });
        stats.unwantedFilesPurged++;
      }
    }
  }

  // 2. Recursive scan for all files in stagingDir
  const allFiles: string[] = [];
  async function collectFiles(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const name = entry.name;
      const lower = name.toLowerCase();

      // Check for OS junk & temp files & CMS internal files
      if (
        name === '.DS_Store' ||
        name === 'Thumbs.db' ||
        name.startsWith('._') ||
        name.startsWith('.Spotlight') ||
        name === '__MACOSX' ||
        lower.startsWith('thumbnail.') || // Theme preview thumbnail for CMS (e.g. thumbnail.svg)
        lower === 'theme.json' || // Theme metadata for CMS
        lower === 'theme.config.json' ||
        lower.endsWith('.tmp') ||
        lower.endsWith('.bak') ||
        lower.endsWith('~')
      ) {
        await fs.rm(fullPath, { recursive: true, force: true });
        stats.unwantedFilesPurged++;
        continue;
      }

      if (entry.isDirectory()) {
        await collectFiles(fullPath);
      } else if (entry.isFile()) {
        allFiles.push(fullPath);
      }
    }
  }

  await collectFiles(stagingDir);

  // 3. Compress CSS, JS, and HTML files & collect text references
  const htmlContents: string[] = [];
  const cssContents: string[] = [];
  const jsContents: string[] = [];

  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase();
    if (ext !== '.css' && ext !== '.js' && ext !== '.html') continue;

    try {
      const original = await fs.readFile(file, 'utf-8');
      const originalSize = Buffer.byteLength(original, 'utf-8');
      let minified = original;

      if (ext === '.css') {
        minified = await compressCss(original);
        stats.cssFiles++;
        cssContents.push(minified);
      } else if (ext === '.js') {
        minified = await compressJs(original);
        stats.jsFiles++;
        jsContents.push(minified);
      } else if (ext === '.html') {
        minified = compressHtml(original);
        stats.htmlFiles++;
        htmlContents.push(minified);
      }

      const minifiedSize = Buffer.byteLength(minified, 'utf-8');
      if (minifiedSize < originalSize) {
        await writeFileAtomic(file, minified);
        stats.bytesSaved += (originalSize - minifiedSize);
      }
    } catch (err) {
      logger.warn(`Failed to compress ${file}: ${String(err)}`);
    }
  }

  const allHtmlText = htmlContents.join(' ');
  const allCssText = cssContents.join(' ');
  const allJsText = jsContents.join(' ');
  const aggregatedText = `${allHtmlText} ${allCssText} ${allJsText}`;

  // 4. Prune unreferenced images in assets/images
  // If the user configured site media in /media/, fallback theme images (like assets/images/logo.png)
  // are NOT in allHtmlText or allCssText and MUST be purged.
  const assetsImagesDir = path.join(stagingDir, 'assets', 'images');
  if (options.removeUnreferencedImages !== false && (await pathExists(assetsImagesDir))) {
    try {
      const imageFiles = await fs.readdir(assetsImagesDir, { withFileTypes: true });
      const allowedNames = options.preserveMediaNames || new Set<string>();

      for (const img of imageFiles) {
        if (!img.isFile()) continue;
        const imgName = img.name;

        if (allowedNames.has(imgName)) {
          continue;
        }

        // If the filename does NOT appear anywhere in the rendered HTML, CSS, or JS
        if (!aggregatedText.includes(imgName)) {
          await fs.rm(path.join(assetsImagesDir, imgName), { force: true });
          stats.unwantedFilesPurged++;
        }
      }
    } catch {}
  }

  // 5. Prune auxiliary dead code files in assets (e.g. demo.css, demo.js when demo.html is not generated)
  const assetsDir = path.join(stagingDir, 'assets');
  if (await pathExists(assetsDir)) {
    try {
      const checkAndPruneUnused = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await checkAndPruneUnused(fullPath);
          } else if (entry.isFile()) {
            const fileName = entry.name;
            const lowerName = fileName.toLowerCase();

            // Check for CMS theme thumbnail preview in assets root
            if (lowerName.startsWith('thumbnail.') || lowerName === 'theme.json' || lowerName === 'theme.config.json') {
              await fs.rm(fullPath, { force: true });
              stats.unwantedFilesPurged++;
              continue;
            }
          }
        }
      };
      await checkAndPruneUnused(assetsDir);
    } catch {}
  }

  // 6. Clean up empty directories recursively (e.g. assets/images if all images were purged)
  async function cleanEmptyDirs(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subDir = path.join(dir, entry.name);
          await cleanEmptyDirs(subDir);
        }
      }
      const updatedEntries = await fs.readdir(dir);
      if (updatedEntries.length === 0 && dir !== stagingDir) {
        await fs.rmdir(dir);
      }
    } catch {}
  }

  await cleanEmptyDirs(stagingDir);

  return stats;
}

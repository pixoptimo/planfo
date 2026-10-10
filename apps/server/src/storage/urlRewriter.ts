import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { listJsonFiles, writeFileAtomic, logger } from '@cms/utils';
import { config } from '../config/env.js';
import { StaticSiteGenerator } from '@cms/generator';

export interface SearchReplaceDetail {
  file: string;
  matches: number;
}

export interface SearchReplaceResult {
  dryRun: boolean;
  search: string;
  replace: string;
  totalMatches: number;
  filesChanged: number;
  files: SearchReplaceDetail[];
}

export class UrlRewriter {
  /**
   * Scans all JSON storage files (content, settings, menus, blueprints) and safely replaces URLs/strings.
   */
  static async execute(
    search: string,
    replace: string,
    dryRun = true
  ): Promise<SearchReplaceResult> {
    if (!search || typeof search !== 'string' || search.trim() === '') {
      throw new Error('Search string is required and cannot be empty.');
    }

    if (replace === undefined || typeof replace !== 'string') {
      throw new Error('Replacement string is required.');
    }

    // Collect all candidate target files in storage
    const targetFiles: string[] = [];

    // 1. Content files
    if (existsSync(config.CONTENT_PATH)) {
      const contentEntries = await fs.readdir(config.CONTENT_PATH, { withFileTypes: true });
      for (const entry of contentEntries) {
        const fullSubDir = path.join(config.CONTENT_PATH, entry.name);
        if (entry.isDirectory()) {
          const files = await listJsonFiles(fullSubDir);
          targetFiles.push(...files);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          targetFiles.push(fullSubDir);
        }
      }
    }

    // 2. Settings files
    if (existsSync(config.SETTINGS_PATH)) {
      const settingsFiles = await listJsonFiles(config.SETTINGS_PATH);
      targetFiles.push(...settingsFiles);
    }

    // 3. Blueprints definition files
    const blueprintsDir = path.join(config.STORAGE_PATH, 'blueprints');
    if (existsSync(blueprintsDir)) {
      const bpFiles = await listJsonFiles(blueprintsDir);
      targetFiles.push(...bpFiles);
    }

    let totalMatches = 0;
    const changedFiles: SearchReplaceDetail[] = [];

    for (const filePath of targetFiles) {
      try {
        const rawContent = await fs.readFile(filePath, 'utf-8');
        
        // Count occurrences
        let count = 0;
        let pos = 0;
        while ((pos = rawContent.indexOf(search, pos)) !== -1) {
          count++;
          pos += search.length;
        }

        if (count > 0) {
          totalMatches += count;
          const relativeFile = path.relative(config.WORKSPACE_ROOT || process.cwd(), filePath);
          changedFiles.push({ file: relativeFile, matches: count });

          if (!dryRun) {
            const updatedContent = rawContent.replaceAll(search, replace);
            // Verify JSON validity before saving
            JSON.parse(updatedContent);
            await writeFileAtomic(filePath, updatedContent);
          }
        }
      } catch (err) {
        logger.warn(`Could not process file for search-replace: ${filePath}`, { error: String(err) });
      }
    }

    // If changes were written, trigger static regeneration so the site is instantly updated
    if (!dryRun && changedFiles.length > 0) {
      try {
        const generator = new StaticSiteGenerator({
          storagePath: config.STORAGE_PATH,
          templatesPath: config.TEMPLATES_PATH,
          outputPath: config.OUTPUT_PATH
        });
        await generator.build();
        logger.audit('Static site regenerated after URL Search-Replace', {
          search,
          replace,
          filesChanged: changedFiles.length
        });
      } catch (genErr) {
        logger.error('Failed to regenerate site after URL search-replace', { error: String(genErr) });
      }
    }

    return {
      dryRun,
      search,
      replace,
      totalMatches,
      filesChanged: changedFiles.length,
      files: changedFiles
    };
  }
}

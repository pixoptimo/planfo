import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { readJson, safeResolvePath, logger } from '@cms/utils';
import { ThemeManifestSchema, type ThemeInfo, type ThemeManifest } from '@cms/schemas';
import { config } from '../config/env.js';
import { SettingsStore } from './settingsStore.js';
import unzipper from 'unzipper';

export class ThemeStore {
  private static getThemesPath(): string {
    return config.THEMES_PATH;
  }

  static async getAllThemes(): Promise<ThemeInfo[]> {
    const themesDir = this.getThemesPath();
    const settings = await SettingsStore.get();
    const activeThemeId = settings.activeTheme || 'planfo-default';

    if (!existsSync(themesDir)) {
      await fs.mkdir(themesDir, { recursive: true });
    }

    const entries = await fs.readdir(themesDir, { withFileTypes: true });
    const themes: ThemeInfo[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const themeId = entry.name;
      const themeDir = path.join(themesDir, themeId);
      const manifestPath = path.join(themeDir, 'theme.json');

      let manifest: ThemeManifest;
      if (existsSync(manifestPath)) {
        try {
          manifest = await readJson<ThemeManifest>(manifestPath, ThemeManifestSchema);
        } catch {
          manifest = {
            id: themeId,
            name: themeId.charAt(0).toUpperCase() + themeId.slice(1).replace(/-/g, ' '),
            version: '1.0.0',
            author: 'Custom Theme',
            description: 'Custom static theme for Aero CMS',
            thumbnail: '',
            supportedPacks: ['pages', 'articles'],
            templates: ['default', 'landing']
          };
        }
      } else {
        manifest = {
          id: themeId,
          name: themeId.charAt(0).toUpperCase() + themeId.slice(1).replace(/-/g, ' '),
          version: '1.0.0',
          author: 'Custom Theme',
          description: 'Custom static theme for Aero CMS',
          thumbnail: '',
          supportedPacks: ['pages', 'articles'],
          templates: ['default', 'landing']
        };
      }

      // Format thumbnail URL if present
      let thumbnailUrl = manifest.thumbnail;
      if (thumbnailUrl && !thumbnailUrl.startsWith('http') && !thumbnailUrl.startsWith('/')) {
        thumbnailUrl = `/api/themes/${themeId}/thumbnail`;
      }

      // Read available templates from manifest or scan page/ directory
      let templates = manifest.templates && manifest.templates.length > 0 ? [...manifest.templates] : [];
      if (templates.length === 0) {
        const pageDir = path.join(themeDir, 'page');
        if (existsSync(pageDir)) {
          try {
            const pageFiles = await fs.readdir(pageDir);
            templates = pageFiles
              .filter((f) => f.endsWith('.html') || f.endsWith('.ejs'))
              .map((f) => path.parse(f).name);
          } catch {
            // ignore
          }
        }
      }
      if (!templates.includes('default')) {
        templates.unshift('default');
      }

      const isDefault = themeId === 'aero-modern';

      themes.push({
        ...manifest,
        templates,
        thumbnail: thumbnailUrl,
        isActive: themeId === activeThemeId,
        isDefault,
        path: themeDir
      });
    }

    return themes;
  }

  static async getTheme(id: string): Promise<ThemeInfo | null> {
    const all = await this.getAllThemes();
    return all.find((t) => t.id === id) || null;
  }

  static async getThemeById(id: string): Promise<ThemeInfo | null> {
    return this.getTheme(id);
  }

  static async getActiveTheme(): Promise<ThemeInfo> {
    const all = await this.getAllThemes();
    const active = all.find((t) => t.isActive);
    if (active) return active;
    return all[0];
  }

  static async getThumbnailPath(id: string): Promise<string | null> {
    const theme = await this.getTheme(id);
    if (!theme) return null;
    const themesDir = this.getThemesPath();
    const manifestPath = path.join(themesDir, id, 'theme.json');
    if (existsSync(manifestPath)) {
      try {
        const manifest = await readJson<ThemeManifest>(manifestPath, ThemeManifestSchema);
        if (manifest.thumbnail) {
          const fullThumbnailPath = path.join(themesDir, id, manifest.thumbnail);
          if (existsSync(fullThumbnailPath)) {
            return fullThumbnailPath;
          }
        }
      } catch {
        return null;
      }
    }
    return null;
  }

  static async activateTheme(id: string): Promise<boolean> {
    const theme = await this.getTheme(id);
    if (!theme) {
      return false;
    }

    await SettingsStore.update({ activeTheme: id });
    logger.info(`Activated theme "${id}"`);
    return true;
  }

  static async installTheme(zipBuffer: Buffer): Promise<{ success: boolean; themeId?: string; error?: string }> {
    try {
      const themesRoot = this.getThemesPath();
      const directory = await unzipper.Open.buffer(zipBuffer);

      // Inspect files to locate theme.json
      let rootPrefix = '';
      for (const file of directory.files) {
        if (file.path.endsWith('theme.json')) {
          rootPrefix = file.path.slice(0, file.path.length - 'theme.json'.length);
          break;
        }
      }

      // Read theme.json from buffer to extract theme ID
      const manifestFile = directory.files.find((f) => f.path === (rootPrefix ? `${rootPrefix}theme.json` : 'theme.json'));
      if (!manifestFile) {
        return { success: false, error: 'Uploaded zip archive does not contain a valid theme.json manifest' };
      }

      const manifestContent = await manifestFile.buffer();
      const manifestJson = JSON.parse(manifestContent.toString('utf8'));
      const parsedManifest = ThemeManifestSchema.parse(manifestJson);
      const targetDir = safeResolvePath(themesRoot, parsedManifest.id);

      await fs.mkdir(targetDir, { recursive: true });

      // Extract each file safely
      for (const file of directory.files) {
        if (file.type === 'Directory') continue;
        
        let relPath = file.path;
        if (rootPrefix && relPath.startsWith(rootPrefix)) {
          relPath = relPath.slice(rootPrefix.length);
        }

        if (!relPath) continue;

        const outPath = safeResolvePath(targetDir, relPath);
        await fs.mkdir(path.dirname(outPath), { recursive: true });
        const content = await file.buffer();
        await fs.writeFile(outPath, content);
      }

      return { success: true, themeId: parsedManifest.id };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to extract theme archive' };
    }
  }

  static async deleteTheme(id: string): Promise<{ success: boolean; activeTheme: string; error?: string }> {
    if (id === 'planfo-default' || id === 'aero-modern') {
      return {
        success: false,
        activeTheme: id,
        error: `The core default theme "${id}" cannot be deleted.`
      };
    }

    const themesDir = this.getThemesPath();
    const themeDir = safeResolvePath(themesDir, id);

    if (!existsSync(themeDir)) {
      const currentActive = (await SettingsStore.get()).activeTheme || 'planfo-default';
      return {
        success: false,
        activeTheme: currentActive,
        error: `Theme with id "${id}" does not exist.`
      };
    }

    const settings = await SettingsStore.get();
    const wasActive = settings.activeTheme === id;

    // Delete directory recursively
    await fs.rm(themeDir, { recursive: true, force: true });
    logger.info(`Deleted theme directory: ${themeDir}`);

    let activeTheme = 'aero-modern';
    if (wasActive) {
      activeTheme = 'aero-modern';
      await SettingsStore.update({ activeTheme });
      logger.info(`Reverted active theme to "${activeTheme}" after deleting "${id}"`);
    }

    return { success: true, activeTheme };
  }

  static async deleteAllUploadedThemes(): Promise<{
    success: boolean;
    deletedCount: number;
    activeTheme: string;
    error?: string;
  }> {
    try {
      const themesDir = this.getThemesPath();
      if (!existsSync(themesDir)) {
        return { success: true, deletedCount: 0, activeTheme: 'aero-modern' };
      }

      const entries = await fs.readdir(themesDir, { withFileTypes: true });
      let deletedCount = 0;

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const themeId = entry.name;
        // Never delete the core default themes
        if (themeId === 'planfo-default' || themeId === 'aero-modern') continue;

        const themeDir = path.join(themesDir, themeId);
        await fs.rm(themeDir, { recursive: true, force: true });
        deletedCount++;
        logger.info(`Deleted custom theme: ${themeId}`);
      }

      // Revert active theme to aero-modern
      await SettingsStore.update({ activeTheme: 'aero-modern' });

      logger.info(`Removed all uploaded themes (${deletedCount} deleted). Active theme reset to aero-modern.`);
      return { success: true, deletedCount, activeTheme: 'aero-modern' };
    } catch (err) {
      return {
        success: false,
        deletedCount: 0,
        activeTheme: 'aero-modern',
        error: err instanceof Error ? err.message : 'Failed to delete themes'
      };
    }
  }
}

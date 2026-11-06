import { describe, it, expect, beforeAll } from 'vitest';
import { ThemeStore } from '../apps/server/src/storage/themeStore.js';
import { SettingsStore } from '../apps/server/src/storage/settingsStore.js';
import { initializeStorage } from '../apps/server/src/storage/storageInit.js';

describe('Design Themes System', () => {
  beforeAll(async () => {
    await initializeStorage();
  });

  it('should discover installed design themes and read manifests', async () => {
    const themes = await ThemeStore.getAllThemes();
    expect(themes.length).toBeGreaterThanOrEqual(2);

    const aeroModern = themes.find((t) => t.id === 'aero-modern');
    expect(aeroModern).toBeDefined();
    expect(aeroModern?.name).toBe('Planfo Modern Editorial');
    expect(aeroModern?.supportedPacks).toContain('pages');
    expect(aeroModern?.supportedPacks).toContain('articles');

    const editorialMinimal = themes.find((t) => t.id === 'editorial-minimal');
    expect(editorialMinimal).toBeDefined();
    expect(editorialMinimal?.name).toBe('Editorial Minimal');
  });

  it('should retrieve a single theme by id', async () => {
    const theme = await ThemeStore.getThemeById('aero-modern');
    expect(theme).not.toBeNull();
    expect(theme?.id).toBe('aero-modern');
  });

  it('should switch active design theme and persist in site settings', async () => {
    const activated = await ThemeStore.activateTheme('editorial-minimal');
    expect(activated).toBe(true);

    const activeTheme = await ThemeStore.getActiveTheme();
    expect(activeTheme.id).toBe('editorial-minimal');

    const settings = await SettingsStore.get();
    expect(settings.activeTheme).toBe('editorial-minimal');

    // Switch back to aero-modern
    await ThemeStore.activateTheme('aero-modern');
    const restoredTheme = await ThemeStore.getActiveTheme();
    expect(restoredTheme.id).toBe('aero-modern');
  });

  it('should return thumbnail path for a valid theme', async () => {
    const thumbnailPath = await ThemeStore.getThumbnailPath('aero-modern');
    expect(thumbnailPath).not.toBeNull();
    expect(thumbnailPath).toContain('thumbnail.svg');
  });

  it('should compile distinct HTML and CSS for aero-modern vs editorial-minimal', async () => {
    const { StaticSiteGenerator } = await import('@cms/generator');
    const { config } = await import('../apps/server/src/config/env.js');
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const themeOutputDir = path.resolve(process.cwd(), './generated/theme-test-output');

    // 1. Activate and compile editorial-minimal
    await ThemeStore.activateTheme('editorial-minimal');
    const generator1 = new StaticSiteGenerator({
      storagePath: config.STORAGE_PATH,
      templatesPath: config.TEMPLATES_PATH,
      outputPath: themeOutputDir
    });
    await generator1.build();

    const editorialHtml = await fs.readFile(path.join(themeOutputDir, 'index.html'), 'utf-8');
    const editorialCss = await fs.readFile(path.join(themeOutputDir, 'assets', 'style.css'), 'utf-8');
    expect(editorialHtml).toContain('theme-editorial');
    expect(editorialHtml).toContain('Newsreader');
    expect(editorialCss).toContain('--font-serif');

    // 2. Activate and compile aero-modern
    await ThemeStore.activateTheme('aero-modern');
    const generator2 = new StaticSiteGenerator({
      storagePath: config.STORAGE_PATH,
      templatesPath: config.TEMPLATES_PATH,
      outputPath: themeOutputDir
    });
    await generator2.build();

    const modernHtml = await fs.readFile(path.join(themeOutputDir, 'index.html'), 'utf-8');
    const modernCss = await fs.readFile(path.join(themeOutputDir, 'assets', 'style.css'), 'utf-8');
    expect(modernHtml).not.toContain('theme-editorial');
    expect(modernHtml).toContain('Plus+Jakarta+Sans');
    expect(modernCss).toContain('#0f172a');

    // Verify HTML and CSS are completely distinct between themes
    expect(editorialHtml).not.toBe(modernHtml);
    expect(editorialCss).not.toBe(modernCss);
  });

  it('should prevent deleting the core default theme aero-modern', async () => {
    const res = await ThemeStore.deleteTheme('aero-modern');
    expect(res.success).toBe(false);
    expect(res.error).toContain('cannot be deleted');
  });

  it('should delete a custom theme and auto-revert if active', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const { config } = await import('../apps/server/src/config/env.js');

    const testThemeDir = path.join(config.THEMES_PATH, 'temp-test-theme');
    await fs.mkdir(testThemeDir, { recursive: true });
    await fs.writeFile(
      path.join(testThemeDir, 'theme.json'),
      JSON.stringify({
        id: 'temp-test-theme',
        name: 'Temp Test Theme',
        version: '1.0.0',
        author: 'Tester',
        description: 'Temporary theme for test',
        templates: ['default']
      })
    );

    // Activate the temp theme
    await ThemeStore.activateTheme('temp-test-theme');
    const currentActive = await ThemeStore.getActiveTheme();
    expect(currentActive.id).toBe('temp-test-theme');

    // Delete it
    const deleteRes = await ThemeStore.deleteTheme('temp-test-theme');
    expect(deleteRes.success).toBe(true);
    expect(['planfo-default', 'aero-modern']).toContain(deleteRes.activeTheme);

    // Confirm it reverted
    const postActive = await ThemeStore.getActiveTheme();
    expect(['planfo-default', 'aero-modern']).toContain(postActive.id);

    // Confirm folder is gone
    const exists = await fs.access(testThemeDir).then(() => true).catch(() => false);
    expect(exists).toBe(false);
  });
});

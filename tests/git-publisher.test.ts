import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { GitPublisher } from '../apps/generator/src/publishers/gitPublisher.js';
import { createPublisher } from '../apps/generator/src/publishers/publisherFactory.js';
import { StaticSiteGenerator } from '../apps/generator/src/generator.js';
import { ensureDir, pathExists } from '@cms/utils';

describe('GitHub Pages & Git Publisher Architecture', () => {
  const testBaseDir = path.resolve(process.cwd(), './generated/test-gh-pages');
  const stagingDir = path.join(testBaseDir, 'staging');
  const targetDir = path.join(testBaseDir, 'target');

  beforeAll(async () => {
    await ensureDir(stagingDir);
    await ensureDir(targetDir);
  });

  afterAll(async () => {
    try {
      await fs.rm(testBaseDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it('should instantiate GitPublisher correctly via factory', () => {
    const publisher = createPublisher('github-pages', { branch: 'gh-pages' });
    expect(publisher.type).toBe('git');
    expect(publisher).toBeInstanceOf(GitPublisher);
  });

  it('should deploy static site with CNAME and create publish manifest', async () => {
    // Populate dummy staging files
    await fs.writeFile(path.join(stagingDir, 'index.html'), '<html><body>Aero Home</body></html>', 'utf-8');
    await fs.writeFile(path.join(stagingDir, 'sitemap.xml'), '<urlset></urlset>', 'utf-8');
    await fs.writeFile(path.join(stagingDir, 'robots.txt'), 'User-agent: *\nAllow: /', 'utf-8');

    const publisher = new GitPublisher({
      branch: 'gh-pages',
      cname: 'https://mybakery.com/'
    });

    const deployed = await publisher.deploy(stagingDir, targetDir);
    expect(deployed).toBe(true);

    // Verify files in targetDir
    expect(await pathExists(path.join(targetDir, 'index.html'))).toBe(true);
    expect(await pathExists(path.join(targetDir, 'sitemap.xml'))).toBe(true);

    // Verify CNAME written and normalized
    expect(await pathExists(path.join(targetDir, 'CNAME'))).toBe(true);
    const cnameContent = await fs.readFile(path.join(targetDir, 'CNAME'), 'utf-8');
    expect(cnameContent.trim()).toBe('mybakery.com');

    // Verify publish manifest
    expect(await pathExists(path.join(targetDir, '.planfo-publish-manifest.json'))).toBe(true);
    expect(await pathExists(path.join(targetDir, '.aero-publish-manifest.json'))).toBe(true);
    const manifest = JSON.parse(await fs.readFile(path.join(targetDir, '.planfo-publish-manifest.json'), 'utf-8'));
    expect(manifest.target).toBe('github-pages');
    expect(manifest.branch).toBe('gh-pages');
    expect(manifest.cname).toBe('https://mybakery.com/');

    // Validate passes
    const isValid = await publisher.validate(targetDir);
    expect(isValid).toBe(true);
  });

  it('should strictly reject validation and throw error if private CMS files leak into target', async () => {
    const publisher = new GitPublisher({ branch: 'gh-pages' });

    // Intentionally inject a forbidden file to simulate leakage
    const leakedUserFile = path.join(targetDir, 'users.json');
    await fs.writeFile(leakedUserFile, '{"secret": "leaked"}', 'utf-8');

    await expect(publisher.validate(targetDir)).rejects.toThrow(/Security validation failed/);

    // Clean up
    await fs.unlink(leakedUserFile);

    // Now validate passes again
    expect(await publisher.validate(targetDir)).toBe(true);
  });

  it('should run end-to-end generator build targeting github-pages', async () => {
    const generatorOutputDir = path.join(testBaseDir, 'e2e-output');
    const generator = new StaticSiteGenerator({
      storagePath: path.resolve(process.cwd(), './storage'),
      templatesPath: path.resolve(process.cwd(), './templates'),
      outputPath: generatorOutputDir,
      publisherType: 'github-pages',
      publisherOptions: {
        branch: 'gh-pages',
        cname: 'demo.example.com'
      }
    });

    const result = await generator.build();
    expect(result.success).toBe(true);
    expect(result.deployment?.target).toBe('github-pages');
    expect(result.deployment?.branch).toBe('gh-pages');
    expect(result.deployment?.cname).toBe('demo.example.com');

    // Verify target directory has index.html, CNAME, and manifest
    expect(await pathExists(path.join(generatorOutputDir, 'index.html'))).toBe(true);
    expect(await pathExists(path.join(generatorOutputDir, 'CNAME'))).toBe(true);
    expect(await pathExists(path.join(generatorOutputDir, '.aero-publish-manifest.json'))).toBe(true);

    const cnameText = await fs.readFile(path.join(generatorOutputDir, 'CNAME'), 'utf-8');
    expect(cnameText.trim()).toBe('demo.example.com');
  });
});

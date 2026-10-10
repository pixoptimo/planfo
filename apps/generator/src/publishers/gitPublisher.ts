import path from 'node:path';
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathExists, atomicDirectorySwap, writeFileAtomic, logger } from '@cms/utils';
import type { Publisher, PublisherType } from '@cms/types';

const execFileAsync = promisify(execFile);

export interface GitPublisherOptions {
  branch?: string;
  repo?: string;
  cname?: string;
  push?: boolean;
  commitMessage?: string;
}

export class GitPublisher implements Publisher {
  readonly type: PublisherType = 'git';
  private options: GitPublisherOptions;

  constructor(options: GitPublisherOptions = {}) {
    this.options = {
      branch: options.branch || 'gh-pages',
      repo: options.repo || '',
      cname: options.cname || '',
      push: options.push ?? false,
      commitMessage: options.commitMessage
    };
  }

  /**
   * Helper to execute git command safely within a working directory.
   */
  private async runGit(args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
    try {
      return await execFileAsync('git', args, { cwd });
    } catch (err: unknown) {
      const error = err as { stdout?: string; stderr?: string; message: string };
      logger.warn(`Git execution warning [git ${args.join(' ')}]:`, {
        error: error.message,
        stderr: error.stderr
      });
      throw err;
    }
  }

  async deploy(stagingDir: string, targetDir: string): Promise<boolean> {
    // 1. If CNAME provided, write CNAME file into stagingDir for GitHub Pages custom domain
    if (this.options.cname && this.options.cname.trim().length > 0) {
      const cnameClean = this.options.cname.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      await writeFileAtomic(path.join(stagingDir, 'CNAME'), `${cnameClean}\n`);
      logger.info(`Added CNAME file for GitHub Pages custom domain: ${cnameClean}`);
    }

    // 2. Perform atomic directory swap to put verified static files into targetDir
    await atomicDirectorySwap(stagingDir, targetDir);

    // 3. Git repository versioning & commit in targetDir
    const branch = this.options.branch || 'gh-pages';
    let commitSha: string | undefined;

    try {
      const gitDir = path.join(targetDir, '.git');
      const hasGit = await pathExists(gitDir);

      if (!hasGit) {
        // Initialize git repository with specified branch
        await this.runGit(['init', '-b', branch], targetDir).catch(async () => {
          // Fallback if git version doesn't support -b flag
          await this.runGit(['init'], targetDir);
          await this.runGit(['checkout', '-B', branch], targetDir);
        });

        // Set local committer identity if not set globally
        await this.runGit(['config', 'user.name', 'Aero CMS Publisher'], targetDir).catch(() => {});
        await this.runGit(['config', 'user.email', 'publisher@aero-cms.local'], targetDir).catch(() => {});
      }

      // If remote repository is configured, configure remote
      if (this.options.repo && this.options.repo.trim().length > 0) {
        let repoUrl = this.options.repo.trim();
        if (!repoUrl.startsWith('http://') && !repoUrl.startsWith('https://') && !repoUrl.startsWith('git@')) {
          repoUrl = `https://github.com/${repoUrl}.git`;
        }
        try {
          await this.runGit(['remote', 'remove', 'origin'], targetDir).catch(() => {});
          await this.runGit(['remote', 'add', 'origin', repoUrl], targetDir);
        } catch {
          // Ignore remote configuration errors
        }
      }

      // Stage all files
      await this.runGit(['add', '-A'], targetDir);

      // Check for changes
      const status = await this.runGit(['status', '--porcelain'], targetDir);
      if (status.stdout.trim().length > 0) {
        const msg = this.options.commitMessage || `chore(publish): deploy static site (${new Date().toISOString()})`;
        await this.runGit(['commit', '-m', msg], targetDir);

        const revParse = await this.runGit(['rev-parse', 'HEAD'], targetDir);
        commitSha = revParse.stdout.trim();
        logger.info(`Created static release commit [${commitSha.slice(0, 7)}] on branch '${branch}'`);

        // Push if configured
        if (this.options.push && this.options.repo) {
          logger.info(`Pushing static release to ${this.options.repo} [${branch}]...`);
          await this.runGit(['push', '-u', 'origin', branch], targetDir);
        }
      }
    } catch (gitErr) {
      // In environments where git is unavailable or git commit fails, log warning but do not abort
      logger.warn('Git release tracking skipped or encountered error; static files deployed successfully.', {
        error: String(gitErr)
      });
    }

    // 4. Record deployment manifest
    const manifest = {
      publishedAt: new Date().toISOString(),
      target: 'github-pages',
      branch,
      cname: this.options.cname || null,
      commitSha: commitSha || null
    };

    try {
      await fs.writeFile(
        path.join(targetDir, '.aero-publish-manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf-8'
      );
    } catch {
      // Ignore manifest write error
    }

    return true;
  }

  async validate(targetDir: string): Promise<boolean> {
    const indexPath = path.join(targetDir, 'index.html');
    const sitemapPath = path.join(targetDir, 'sitemap.xml');

    const indexExists = await pathExists(indexPath);
    const sitemapExists = await pathExists(sitemapPath);

    if (!indexExists || !sitemapExists) {
      return false;
    }

    // SECURITY CHECK: Verify strictly that NO private CMS files or secrets exist in the public output
    const forbiddenPatterns = [
      '.planfo',
      'storage',
      'content',
      'settings.json',
      'config.json',
      'users.json',
      'sessions',
      'revisions',
      'backups',
      '.env',
      'refresh_tokens.json'
    ];

    for (const forbidden of forbiddenPatterns) {
      const forbiddenPath = path.join(targetDir, forbidden);
      if (await pathExists(forbiddenPath)) {
        logger.error(`CRITICAL SECURITY FAILURE: Sensitive CMS file/folder leaked into public deployment: ${forbidden}`);
        throw new Error(`Security validation failed: "${forbidden}" must never be published to public site.`);
      }
    }

    return true;
  }
}

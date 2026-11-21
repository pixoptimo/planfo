import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string | null;
  hasUpdate: boolean;
  releaseUrl: string;
  releaseNotes: string;
  publishedAt: string | null;
  repo: string;
  checkedAt: string;
  status: 'up-to-date' | 'update-available' | 'offline' | 'unconfigured';
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
let cachedResult: { data: UpdateCheckResult; expiresAt: number } | null = null;

function findRootPackageJson(): { version: string; repoSlug: string } {
  const candidates = [
    path.resolve(__dirname, '../../../../package.json'),
    path.resolve(process.cwd(), 'package.json'),
    path.resolve(process.cwd(), '../../package.json')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const raw = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
        const version = typeof raw.version === 'string' ? raw.version : '1.0.0';
        let repoSlug = process.env.PLANFO_GITHUB_REPO || '';

        if (!repoSlug && raw.repository) {
          const repoUrl = typeof raw.repository === 'string' ? raw.repository : raw.repository.url || '';
          const match = repoUrl.match(/github\.com[/:]([^/]+\/[^/.]+)(?:\.git)?/i);
          if (match?.[1]) {
            repoSlug = match[1];
          }
        }

        return { version, repoSlug: repoSlug || 'pixoptimo/planfo' };
      } catch {
        // continue
      }
    }
  }

  return {
    version: '1.0.0',
    repoSlug: process.env.PLANFO_GITHUB_REPO || 'pixoptimo/planfo'
  };
}

export function getInstalledVersion(): string {
  return findRootPackageJson().version;
}

export function getConfiguredRepo(): string {
  return findRootPackageJson().repoSlug;
}

/**
 * Compares two semver strings (e.g. "1.2.0" vs "1.0.0").
 * Returns > 0 if a > b, < 0 if a < b, 0 if equal.
 */
export function compareSemver(a: string, b: string): number {
  const cleanA = a.replace(/^v/i, '').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  const cleanB = b.replace(/^v/i, '').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);

  for (let i = 0; i < 3; i++) {
    const numA = cleanA[i] ?? 0;
    const numB = cleanB[i] ?? 0;
    if (numA !== numB) return numA - numB;
  }
  return 0;
}

export async function checkForUpdates(force = false): Promise<UpdateCheckResult> {
  const now = Date.now();
  if (!force && cachedResult && cachedResult.expiresAt > now) {
    return cachedResult.data;
  }

  const { version: currentVersion, repoSlug } = findRootPackageJson();
  const checkedAt = new Date().toISOString();
  const defaultReleaseUrl = `https://github.com/${repoSlug}/releases`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': `Planfo-CMS/${currentVersion}`
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    // 1. Try GitHub Releases API (latest release)
    const releaseRes = await fetch(`https://api.github.com/repos/${repoSlug}/releases/latest`, {
      headers,
      signal: AbortSignal.timeout(5000)
    });

    if (releaseRes.ok) {
      const data = (await releaseRes.json()) as {
        tag_name?: string;
        html_url?: string;
        body?: string;
        published_at?: string;
      };
      const latestTag = (data.tag_name || '').replace(/^v/i, '');
      const hasUpdate = Boolean(latestTag && compareSemver(latestTag, currentVersion) > 0);

      const result: UpdateCheckResult = {
        currentVersion,
        latestVersion: latestTag || currentVersion,
        hasUpdate,
        releaseUrl: data.html_url || defaultReleaseUrl,
        releaseNotes: (data.body || '').slice(0, 600),
        publishedAt: data.published_at || null,
        repo: repoSlug,
        checkedAt,
        status: hasUpdate ? 'update-available' : 'up-to-date'
      };
      cachedResult = { data: result, expiresAt: now + CACHE_TTL_MS };
      return result;
    }

    // 2. Fallback to GitHub Tags API if no formal Release object exists yet
    const tagsRes = await fetch(`https://api.github.com/repos/${repoSlug}/tags?per_page=10`, {
      headers,
      signal: AbortSignal.timeout(5000)
    });

    if (tagsRes.ok) {
      const tags = (await tagsRes.json()) as Array<{ name: string }>;
      const semverTags = tags
        .map((t) => t.name.replace(/^v/i, ''))
        .filter((t) => /^\d+\.\d+\.\d+/.test(t))
        .sort((a, b) => compareSemver(b, a));

      const latestTag = semverTags[0] || currentVersion;
      const hasUpdate = compareSemver(latestTag, currentVersion) > 0;

      const result: UpdateCheckResult = {
        currentVersion,
        latestVersion: latestTag,
        hasUpdate,
        releaseUrl: `https://github.com/${repoSlug}/releases/tag/v${latestTag}`,
        releaseNotes: '',
        publishedAt: null,
        repo: repoSlug,
        checkedAt,
        status: hasUpdate ? 'update-available' : 'up-to-date'
      };
      cachedResult = { data: result, expiresAt: now + CACHE_TTL_MS };
      return result;
    }

    const offlineResult: UpdateCheckResult = {
      currentVersion,
      latestVersion: null,
      hasUpdate: false,
      releaseUrl: defaultReleaseUrl,
      releaseNotes: '',
      publishedAt: null,
      repo: repoSlug,
      checkedAt,
      status: 'offline'
    };
    cachedResult = { data: offlineResult, expiresAt: now + 15 * 60 * 1000 }; // retry sooner (15m)
    return offlineResult;
  } catch {
    const offlineResult: UpdateCheckResult = {
      currentVersion,
      latestVersion: null,
      hasUpdate: false,
      releaseUrl: defaultReleaseUrl,
      releaseNotes: '',
      publishedAt: null,
      repo: repoSlug,
      checkedAt,
      status: 'offline'
    };
    cachedResult = { data: offlineResult, expiresAt: now + 15 * 60 * 1000 };
    return offlineResult;
  }
}

export interface UpdateApplyResult {
  updated: boolean;
  previousVersion: string;
  newVersion: string;
  message: string;
}

function findWorkspaceRootDir(): string {
  const candidates = [
    path.resolve(__dirname, '../../../../'),
    path.resolve(process.cwd(), '../../'),
    process.cwd()
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'package.json')) && fs.existsSync(path.join(dir, 'apps/server'))) {
      return dir;
    }
  }
  return process.cwd();
}

function removeTsBuildInfo(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      removeTsBuildInfo(full);
    } else if (entry.isFile() && entry.name.endsWith('.tsbuildinfo')) {
      fs.rmSync(full, { force: true });
    }
  }
}

export interface UpdateProgressStatus {
  status: 'idle' | 'downloading' | 'applying' | 'installing' | 'building' | 'completed' | 'error';
  previousVersion?: string;
  targetVersion?: string;
  newVersion?: string;
  message?: string;
  updatedAt?: string;
}

export function getUpdateProgress(): UpdateProgressStatus {
  const workspaceRoot = findWorkspaceRootDir();
  const statusFile = path.join(workspaceRoot, '.update-status.json');
  if (!fs.existsSync(statusFile)) {
    return { status: 'idle' };
  }
  try {
    return JSON.parse(fs.readFileSync(statusFile, 'utf-8')) as UpdateProgressStatus;
  } catch {
    return { status: 'idle' };
  }
}

/**
 * Spawns the detached background update worker (scripts/apply-update.mjs) and returns immediately
 * so tsx watch restarts never drop the HTTP response with "Failed to fetch".
 */
export async function startBackgroundCmsUpdate(): Promise<{
  started: boolean;
  previousVersion: string;
  targetVersion: string;
  message: string;
}> {
  const workspaceRoot = findWorkspaceRootDir();
  const check = await checkForUpdates(true);
  const previousVersion = check.currentVersion;
  const targetVersion = check.latestVersion || previousVersion;
  const repoSlug = check.repo || 'pixoptimo/planfo';
  const workerScript = path.join(workspaceRoot, 'scripts/apply-update.mjs');

  if (!fs.existsSync(workerScript)) {
    // Fallback to inline update if worker script is absent
    const res = await applyCmsUpdate();
    return {
      started: true,
      previousVersion: res.previousVersion,
      targetVersion: res.newVersion,
      message: res.message
    };
  }

  const statusFile = path.join(workspaceRoot, '.update-status.json');
  fs.writeFileSync(
    statusFile,
    JSON.stringify(
      {
        status: 'downloading',
        previousVersion,
        targetVersion,
        message: `Starting update to v${targetVersion}...`,
        updatedAt: new Date().toISOString()
      },
      null,
      2
    ),
    'utf-8'
  );

  // Invalidate cache so post-update checks read fresh version
  cachedResult = null;

  const child = spawn(process.execPath, [workerScript, workspaceRoot, repoSlug, previousVersion, targetVersion], {
    cwd: workspaceRoot,
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  return {
    started: true,
    previousVersion,
    targetVersion,
    message: `Updating Planfo CMS from v${previousVersion} to v${targetVersion} in background...`
  };
}

/**
 * Downloads the latest Planfo CMS release from GitHub and updates ONLY CMS engine files
 * (apps/, packages/, scripts/, docs/, package.json, README.md, CHANGELOG.md, install.sh)
 * while strictly preserving storage/, themes/, generated/, and .env.
 */
export async function applyCmsUpdate(): Promise<UpdateApplyResult> {
  const workspaceRoot = findWorkspaceRootDir();
  const check = await checkForUpdates(true);
  const previousVersion = check.currentVersion;
  const targetVersion = check.latestVersion || previousVersion;
  const repoSlug = check.repo || 'pixoptimo/planfo';

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'planfo-update-'));
  const tarPath = path.join(tmpDir, 'release.tar.gz');
  const extractDir = path.join(tmpDir, 'extracted');
  fs.mkdirSync(extractDir, { recursive: true });

  try {
    // Prefer tagged archive, fallback to main branch archive
    const urls = [
      `https://github.com/${repoSlug}/archive/refs/tags/v${targetVersion}.tar.gz`,
      `https://github.com/${repoSlug}/archive/refs/heads/main.tar.gz`
    ];

    let downloaded = false;
    for (const url of urls) {
      const res = await fetch(url, {
        headers: { 'User-Agent': `Planfo-CMS/${previousVersion}` },
        signal: AbortSignal.timeout(30000)
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(tarPath, buf);
        downloaded = true;
        break;
      }
    }

    if (!downloaded) {
      throw new Error(`Unable to download release archive from github.com/${repoSlug}`);
    }

    execSync(`tar -xzf "${tarPath}" -C "${extractDir}"`, { stdio: 'pipe' });
    const extractedFolders = fs.readdirSync(extractDir).filter((f) => fs.statSync(path.join(extractDir, f)).isDirectory());
    if (extractedFolders.length === 0) {
      throw new Error('Downloaded archive was empty');
    }
    const sourceRoot = path.join(extractDir, extractedFolders[0]);

    // Strictly copy ONLY CMS engine files — NEVER overwrite storage/, themes/, generated/, or .env
    const enginePaths = [
      'apps',
      'packages',
      'scripts',
      'docs',
      'package.json',
      'package-lock.json',
      'tsconfig.base.json',
      'README.md',
      'CHANGELOG.md',
      'install.sh'
    ];

    for (const rel of enginePaths) {
      const src = path.join(sourceRoot, rel);
      const dest = path.join(workspaceRoot, rel);
      if (!fs.existsSync(src)) continue;

      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        fs.cpSync(src, dest, { recursive: true, force: true });
      } else {
        fs.copyFileSync(src, dest);
      }
    }

    // Clear stale TypeScript incremental build caches
    removeTsBuildInfo(path.join(workspaceRoot, 'packages'));
    removeTsBuildInfo(path.join(workspaceRoot, 'apps'));

    // Reinstall dependencies & rebuild all workspaces
    execSync('npm install', { cwd: workspaceRoot, stdio: 'pipe' });
    execSync('npm run build', { cwd: workspaceRoot, stdio: 'pipe' });

    // Invalidate cached update check
    cachedResult = null;
    const newVersion = getInstalledVersion();

    return {
      updated: true,
      previousVersion,
      newVersion,
      message: `Planfo CMS updated from v${previousVersion} to v${newVersion}. Restart your server to run the updated version.`
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

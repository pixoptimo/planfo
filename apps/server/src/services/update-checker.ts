import fs from 'node:fs';
import path from 'node:path';
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

        return { version, repoSlug: repoSlug || 'planfo-cms/planfo' };
      } catch {
        // continue
      }
    }
  }

  return {
    version: '1.0.0',
    repoSlug: process.env.PLANFO_GITHUB_REPO || 'planfo-cms/planfo'
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

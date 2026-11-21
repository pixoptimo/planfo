#!/usr/bin/env node
/**
 * Planfo CMS — Detached Background Update Worker
 * Spawned by POST /api/system/update-apply so dev server restarts (tsx watch)
 * never interrupt downloads, npm install, or workspace builds.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

const [workspaceRoot, repoSlug, previousVersion, targetVersion] = process.argv.slice(2);
const statusFile = path.join(workspaceRoot, '.update-status.json');

function writeStatus(status, message, extra = {}) {
  try {
    fs.writeFileSync(
      statusFile,
      JSON.stringify(
        {
          status,
          previousVersion,
          targetVersion,
          message,
          updatedAt: new Date().toISOString(),
          ...extra
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch {
    // ignore
  }
}

function removeTsBuildInfo(dir) {
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

async function run() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'planfo-update-'));
  const tarPath = path.join(tmpDir, 'release.tar.gz');
  const extractDir = path.join(tmpDir, 'extracted');
  fs.mkdirSync(extractDir, { recursive: true });

  try {
    writeStatus('downloading', `Downloading Planfo CMS v${targetVersion} from GitHub...`);

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

    writeStatus('applying', `Applying Planfo CMS v${targetVersion} engine files...`);
    execSync(`tar -xzf "${tarPath}" -C "${extractDir}"`, { stdio: 'pipe' });
    const extractedFolders = fs
      .readdirSync(extractDir)
      .filter((f) => fs.statSync(path.join(extractDir, f)).isDirectory());
    if (extractedFolders.length === 0) {
      throw new Error('Downloaded archive was empty');
    }
    const sourceRoot = path.join(extractDir, extractedFolders[0]);

    // Strictly copy ONLY CMS engine files — NEVER touch storage/, themes/, generated/, or .env
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

    removeTsBuildInfo(path.join(workspaceRoot, 'packages'));
    removeTsBuildInfo(path.join(workspaceRoot, 'apps'));

    writeStatus('installing', 'Installing updated dependencies...');
    execSync('npm install', { cwd: workspaceRoot, stdio: 'pipe' });

    writeStatus('building', 'Building Planfo CMS workspaces...');
    execSync('npm run build', { cwd: workspaceRoot, stdio: 'pipe' });

    let newVersion = targetVersion;
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'package.json'), 'utf-8'));
      if (pkg.version) newVersion = pkg.version;
    } catch {}

    writeStatus('completed', `Planfo CMS updated from v${previousVersion} to v${newVersion}! Refreshing...`, {
      newVersion
    });
  } catch (err) {
    writeStatus('error', err instanceof Error ? err.message : String(err));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

run();

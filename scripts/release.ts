#!/usr/bin/env tsx
/**
 * Planfo CMS — Automated Versioned Release Script
 *
 * Usage:
 *   npm run release -- patch         # 1.0.0 -> 1.0.1
 *   npm run release -- minor         # 1.0.0 -> 1.1.0
 *   npm run release -- major         # 1.0.0 -> 2.0.0
 *   npm run release -- 1.2.3         # explicit semver
 *   npm run release -- patch --push  # also push main & tag to origin
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function run(cmd: string) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function bumpVersion(current: string, bump: string): string {
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump;
  const [major, minor, patch] = current.split('.').map((n) => parseInt(n, 10) || 0);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  if (bump === 'patch') return `${major}.${minor}.${patch + 1}`;
  throw new Error(`Invalid bump type "${bump}". Use patch, minor, major, or an explicit X.Y.Z version.`);
}

function main() {
  const args = process.argv.slice(2);
  const bumpArg = args.find((a) => !a.startsWith('--'));
  const shouldPush = args.includes('--push');
  const skipTests = args.includes('--skip-tests');

  if (!bumpArg) {
    console.error('Usage: npm run release -- <patch|minor|major|X.Y.Z> [--push] [--skip-tests]');
    process.exit(1);
  }

  const rootPkgPath = path.join(ROOT, 'package.json');
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
  const oldVersion: string = rootPkg.version || '1.0.0';
  const newVersion = bumpVersion(oldVersion, bumpArg);
  const today = new Date().toISOString().split('T')[0];

  console.log(`\n🚀 Preparing Planfo CMS Release: v${oldVersion} -> v${newVersion}\n`);

  // 1. Update root and workspace package.json files
  const pkgPaths = [
    rootPkgPath,
    ...['apps', 'packages'].flatMap((dir) => {
      const full = path.join(ROOT, dir);
      if (!fs.existsSync(full)) return [];
      return fs
        .readdirSync(full)
        .map((sub) => path.join(full, sub, 'package.json'))
        .filter((p) => fs.existsSync(p));
    })
  ];

  for (const pkgFile of pkgPaths) {
    const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
    pkg.version = newVersion;
    fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    console.log(`  ✔ Updated ${path.relative(ROOT, pkgFile)} -> ${newVersion}`);
  }

  // 2. Sync CLI version in packages/create-planfo
  const cliFile = path.join(ROOT, 'packages/create-planfo/src/planfo-cli.ts');
  if (fs.existsSync(cliFile)) {
    let content = fs.readFileSync(cliFile, 'utf-8');
    content = content.replace(/\.version\(['"][^'"]+['"]\)/, `.version('${newVersion}')`);
    content = content.replace(/Planfo CMS v[0-9]+\.[0-9]+\.[0-9]+/g, `Planfo CMS v${newVersion}`);
    fs.writeFileSync(cliFile, content, 'utf-8');
    console.log(`  ✔ Updated packages/create-planfo/src/planfo-cli.ts -> ${newVersion}`);
  }

  const installerFile = path.join(ROOT, 'packages/create-planfo/src/index.ts');
  if (fs.existsSync(installerFile)) {
    let content = fs.readFileSync(installerFile, 'utf-8');
    content = content.replace(/version:\s*['"][0-9]+\.[0-9]+\.[0-9]+['"]/, `version: '${newVersion}'`);
    fs.writeFileSync(installerFile, content, 'utf-8');
    console.log(`  ✔ Updated packages/create-planfo/src/index.ts -> ${newVersion}`);
  }

  // 3. Collect commits since last tag for release notes
  let commitLog = '';
  try {
    const lastTag = execSync('git describe --tags --abbrev=0', { cwd: ROOT, encoding: 'utf-8' }).trim();
    commitLog = execSync(`git log ${lastTag}..HEAD --pretty=format:"- %s (%h)"`, { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    commitLog = '- Initial versioned release';
  }
  if (!commitLog) commitLog = '- Maintenance and stability updates';

  // 4. Prepend entry to CHANGELOG.md
  const changelogPath = path.join(ROOT, 'CHANGELOG.md');
  const existingChangelog = fs.existsSync(changelogPath)
    ? fs.readFileSync(changelogPath, 'utf-8')
    : '# Changelog\n\nAll notable changes to Planfo CMS are documented in this file.\n\n';
  const entry = `## [v${newVersion}] — ${today}\n\n${commitLog}\n\n`;
  const updatedChangelog = existingChangelog.includes('## [')
    ? existingChangelog.replace('## [', `${entry}## [`)
    : `${existingChangelog.trimEnd()}\n\n${entry}`;
  fs.writeFileSync(changelogPath, updatedChangelog, 'utf-8');
  console.log(`  ✔ Updated CHANGELOG.md`);

  // 5. Write versions/vX.Y.Z/RELEASE.md
  const versionDir = path.join(ROOT, 'versions', `v${newVersion}`);
  fs.mkdirSync(versionDir, { recursive: true });
  fs.writeFileSync(
    path.join(versionDir, 'RELEASE.md'),
    `# Planfo CMS v${newVersion}\n\n**Release Date:** ${today}\n\n## Changes\n\n${commitLog}\n`,
    'utf-8'
  );
  console.log(`  ✔ Created versions/v${newVersion}/RELEASE.md`);

  // 6. Build & Test verification
  run('npm run build');
  if (!skipTests) {
    run('npm test');
  }

  // 7. Commit & Tag
  run('git add package.json apps packages CHANGELOG.md versions');
  run(`git commit -m "release: v${newVersion}"`);
  run(`git tag -a v${newVersion} -m "Planfo CMS v${newVersion}"`);

  console.log(`\n✅ Release v${newVersion} created locally!`);
  if (shouldPush) {
    run('git push origin main --tags');
    console.log(`\n🎉 Pushed v${newVersion} to GitHub! Installed CMS instances will now detect v${newVersion}.`);
  } else {
    console.log(`\nNext step — push to GitHub so all installed instances detect v${newVersion}:`);
    console.log(`  git push origin main --tags\n`);
  }
}

main();

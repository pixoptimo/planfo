#!/usr/bin/env node
/**
 * Planfo CMS — One-Command Fresh Project Installer
 *
 * Usage:
 *   npx github:pixoptimo/planfo my-website
 *   npx github:pixoptimo/planfo my-website --tag v1.0.0
 *
 * Downloads Planfo CMS from GitHub, strips all demo/manual blueprints & sample
 * content, resets auth for the First-Run Setup Wizard, and installs dependencies.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';

const DEFAULT_REPO = 'pixoptimo/planfo';

function parseArgs(argv) {
  const args = argv.slice(2);
  let projectName = '';
  let ref = 'main';
  let repo = process.env.PLANFO_GITHUB_REPO || DEFAULT_REPO;
  let skipInstall = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if ((arg === '--tag' || arg === '--branch' || arg === '-b') && args[i + 1]) {
      ref = args[++i];
    } else if ((arg === '--repo' || arg === '-r') && args[i + 1]) {
      repo = args[++i].replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
    } else if (arg === '--no-install') {
      skipInstall = true;
    } else if (!arg.startsWith('-') && !projectName) {
      projectName = arg;
    }
  }

  return { projectName: projectName || 'my-planfo-site', ref, repo, skipInstall };
}

function emptyDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  fs.mkdirSync(dirPath, { recursive: true });
}

function formatTitle(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || 'My Planfo Site';
}

function sanitizeToFreshProject(targetDir, projectName) {
  const siteTitle = formatTitle(projectName);
  const now = new Date().toISOString();

  // 1. Remove git history so the user starts with a clean repository
  fs.rmSync(path.join(targetDir, '.git'), { recursive: true, force: true });

  // 2. Remove internal dev/scratch files not needed in a fresh user site
  const internalFiles = [
    '# Production-Ready File-Based Static CMS.md',
    'HOW_TO_START_CREATING_CMS_PROJECT.md',
    '.active-ports.json',
    '.env'
  ];
  for (const file of internalFiles) {
    fs.rmSync(path.join(targetDir, file), { recursive: true, force: true });
  }

  // 3. Wipe generated/ completely (removes test-site, theme-test-output, stale builds)
  emptyDir(path.join(targetDir, 'generated'));
  emptyDir(path.join(targetDir, 'generated/website'));

  // 4. Wipe storage/ completely — zero manually created blueprints, demo posts, demo media, revisions, or trash
  const storageDir = path.join(targetDir, 'storage');
  emptyDir(storageDir);

  const cleanSubDirs = [
    'auth',
    'backups',
    'blueprints',
    'content/categories',
    'content/menus',
    'content/pages',
    'content/posts',
    'content/products',
    'demos',
    'media',
    'revisions',
    'sessions',
    'settings',
    'trash'
  ];
  for (const sub of cleanSubDirs) {
    fs.mkdirSync(path.join(storageDir, sub), { recursive: true });
  }

  // 5. Empty auth users -> triggers First-Run Setup Wizard at /admin
  fs.writeFileSync(
    path.join(storageDir, 'auth/users.json'),
    JSON.stringify({ users: [] }, null, 2) + '\n',
    'utf-8'
  );

  // 6. Clean media manifest
  fs.writeFileSync(
    path.join(storageDir, 'media/manifest.json'),
    JSON.stringify([], null, 2) + '\n',
    'utf-8'
  );

  // 7. Clean categories
  fs.writeFileSync(
    path.join(storageDir, 'content/categories/categories.json'),
    JSON.stringify([], null, 2) + '\n',
    'utf-8'
  );

  // 8. Clean main navigation menu
  const defaultMenu = {
    id: 'menu_main',
    name: 'Main Navigation',
    slug: 'main',
    location: 'header',
    locations: ['header', 'footer'],
    items: [
      {
        id: 'nav_home',
        label: 'Home',
        url: '/',
        type: 'custom',
        target: '_self',
        children: []
      }
    ],
    updatedAt: now
  };
  fs.writeFileSync(
    path.join(storageDir, 'content/menus/main.json'),
    JSON.stringify(defaultMenu, null, 2) + '\n',
    'utf-8'
  );

  // 9. Single minimal starter Home page
  const starterHome = {
    id: 'page_home',
    title: `Welcome to ${siteTitle}`,
    slug: 'home',
    status: 'published',
    template: 'default',
    content: {
      blocks: [
        {
          id: 'block_welcome_h1',
          type: 'heading',
          level: 1,
          text: `Welcome to ${siteTitle}`
        },
        {
          id: 'block_welcome_p',
          type: 'paragraph',
          text: 'Your fresh Planfo CMS installation is ready. Open /admin to customize this page, create posts, or build custom Blueprints.'
        }
      ]
    },
    featuredImage: '',
    noIndex: false,
    seo: {
      title: siteTitle,
      description: `${siteTitle} — Powered by Planfo Static CMS`,
      canonical: '',
      ogTitle: siteTitle,
      ogDescription: `${siteTitle} — Powered by Planfo Static CMS`,
      ogImage: '',
      robots: 'index,follow',
      noIndex: false
    },
    createdAt: now,
    updatedAt: now,
    publishedAt: now
  };
  fs.writeFileSync(
    path.join(storageDir, 'content/pages/home.json'),
    JSON.stringify(starterHome, null, 2) + '\n',
    'utf-8'
  );

  // 10. Clean site.json with all optional feature packs off by default
  const freshSettings = {
    siteName: siteTitle,
    siteUrl: 'http://localhost:3000',
    tagline: `Static website powered by Planfo CMS`,
    logo: '',
    favicon: '',
    defaultSEO: {
      title: siteTitle,
      description: `${siteTitle} — Fast, database-free static website.`,
      canonical: 'http://localhost:3000',
      ogTitle: siteTitle,
      ogDescription: `${siteTitle} — Fast, database-free static website.`,
      ogImage: '',
      robots: 'index,follow',
      noIndex: false
    },
    socialLinks: {
      twitter: '',
      facebook: '',
      instagram: '',
      github: '',
      linkedin: ''
    },
    analyticsId: '',
    timezone: 'UTC',
    language: 'en',
    footerText: `© ${new Date().getFullYear()} ${siteTitle}. Built with Planfo CMS.`,
    featurePacks: {
      catalog: false,
      portfolio: false,
      team: false,
      testimonials: false,
      events: false,
      faqs: false
    },
    activeTheme: 'planfo-default',
    deployment: {
      target: 'local',
      gitRepo: '',
      gitBranch: 'gh-pages',
      gitUsername: '',
      gitToken: '',
      cname: '',
      customDomain: '',
      autoPublishOnSave: false
    },
    updatedAt: now
  };
  fs.writeFileSync(
    path.join(storageDir, 'settings/site.json'),
    JSON.stringify(freshSettings, null, 2) + '\n',
    'utf-8'
  );
}

function main() {
  const { projectName, ref, repo, skipInstall } = parseArgs(process.argv);
  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    console.error(`\n❌ Directory "${projectName}" already exists and is not empty.\n`);
    process.exit(1);
  }

  console.log(`\n⚡ Planfo CMS — Fresh Project Installer`);
  console.log(`   Target: ${targetDir}`);
  console.log(`   Source: https://github.com/${repo} (${ref})\n`);

  const repoUrl = `https://github.com/${repo}.git`;
  const clone = spawnSync('git', ['clone', '--depth', '1', '--branch', ref, repoUrl, targetDir], {
    stdio: 'inherit'
  });

  if (clone.status !== 0) {
    console.error(`\n❌ Failed to download Planfo CMS from ${repoUrl} (${ref}).\n`);
    process.exit(clone.status || 1);
  }

  console.log(`\n🧹 Cleaning demo content, manually created blueprints, and resetting auth for a 100% fresh start...`);
  sanitizeToFreshProject(targetDir, projectName);
  console.log(`✔ Clean fresh workspace initialized (zero demo blueprints, First-Run Setup Wizard ready).`);

  if (!skipInstall) {
    console.log(`\n📦 Installing dependencies...\n`);
    try {
      execSync('npm install', { cwd: targetDir, stdio: 'inherit' });
    } catch {
      console.error(`\n❌ npm install failed. You can retry manually inside "${projectName}".\n`);
      process.exit(1);
    }
  }

  console.log(`\n✅ Fresh Planfo CMS project is ready in ./${projectName}!\n`);
  console.log(`Next steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  npm run dev\n`);
  console.log(`Then open http://localhost:3000/admin to complete the First-Run Setup Wizard.\n`);
}

main();

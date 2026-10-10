import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const BANNER = `
\x1b[36m    _                     ____ __  __ ____  \x1b[0m
\x1b[36m   / \\   ___ _ __ ___    / ___|  \\/  / ___| \x1b[0m
\x1b[36m  / _ \\ / _ \\ '__/ _ \\  | |   | |\\/| \\___ \\ \x1b[0m
\x1b[36m / ___ \\  __/ | | (_) | | |___| |  | |___) |\x1b[0m
\x1b[36m/_/   \\_\\___|_|  \\___/   \\____|_|  |_|____/ \x1b[0m
\x1b[32m ⚡ Aero CMS Concept — Zero-Database Static Architecture\x1b[0m
`;

interface ProjectOptions {
  name: string;
  theme: 'aero-modern' | 'editorial-minimal';
  enableCatalog: boolean;
  deploymentMode: 'github-pages' | 'server';
  gitRepo?: string;
  cname?: string;
}

export async function run(): Promise<void> {
  console.log(BANNER);

  const args = process.argv.slice(2);
  let targetName = args[0];

  const rl = readline.createInterface({ input, output });

  try {
    if (!targetName) {
      targetName = (await rl.question('\x1b[1m? Project directory name:\x1b[0m (my-aero-cms) ')).trim() || 'my-aero-cms';
    }

    console.log('\n\x1b[1m? Where will this website be hosted?\x1b[0m');
    console.log('  \x1b[36m1) GitHub Pages / Cloudflare Pages / Netlify\x1b[0m (Free Tier: Local CMS + Free Static Hosting) [Default]');
    console.log('  \x1b[35m2) Own Server / VPS / Hostinger\x1b[0m (Self-Hosted CMS + Static Output)');
    const deployChoice = (await rl.question('  Select target (1/2): ')).trim();
    const deploymentMode: 'github-pages' | 'server' = deployChoice === '2' ? 'server' : 'github-pages';

    let gitRepo = '';
    let cname = '';
    if (deploymentMode === 'github-pages') {
      gitRepo = (await rl.question('\x1b[1m? GitHub Repository (e.g. username/repo, optional):\x1b[0m ')).trim();
      cname = (await rl.question('\x1b[1m? Custom domain / CNAME (optional):\x1b[0m ')).trim();
    }

    const themeChoice = (await rl.question('\n\x1b[1m? Starter Design Theme:\x1b[0m \n  1) aero-modern (High-contrast dark-accented static layout) [Default]\n  2) editorial-minimal (Distraction-free publishing)\n  Select (1/2): ')).trim();
    const selectedTheme: 'aero-modern' | 'editorial-minimal' = themeChoice === '2' ? 'editorial-minimal' : 'aero-modern';

    const catalogChoice = (await rl.question('\x1b[1m? Enable Storefront Catalog Feature Pack now?\x1b[0m (y/N): ')).trim().toLowerCase();
    const enableCatalog = catalogChoice === 'y' || catalogChoice === 'yes';

    const targetDir = path.resolve(process.cwd(), targetName);

    if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
      console.error(`\x1b[31mError: Target directory '${targetName}' already exists and is not empty.\x1b[0m`);
      process.exit(1);
    }

    console.log(`\n\x1b[34m🚀 Initializing Aero CMS Concept workspace in \x1b[1m${targetDir}\x1b[0m...\x1b[0m`);

    fs.mkdirSync(targetDir, { recursive: true });

    // Initialize storage directories
    const storageDirs = [
      'storage/auth',
      'storage/settings',
      'storage/content',
      'storage/pages',
      'storage/posts',
      'storage/categories',
      'storage/media',
      'storage/products',
      'storage/revisions',
      'storage/backups',
      'themes',
      'generated/website'
    ];

    for (const dir of storageDirs) {
      fs.mkdirSync(path.join(targetDir, dir), { recursive: true });
    }

    // Default Site Settings with Theme & Feature Packs
    const siteSettings = {
      siteName: targetName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      siteUrl: deploymentMode === 'github-pages' && cname ? `https://${cname}` : 'http://localhost:3000',
      description: 'Built with Aero CMS Concept — High-performance static web publishing.',
      author: 'Aero Publisher',
      activeTheme: selectedTheme,
      deployment: {
        target: deploymentMode,
        gitRepo: gitRepo || '',
        gitBranch: 'gh-pages',
        cname: cname || '',
        customDomain: cname || '',
        autoPublishOnSave: false
      },
      featurePacks: {
        catalog: enableCatalog
      },
      seo: {
        titleTemplate: '%s | Aero Static',
        defaultTitle: 'Aero CMS',
        defaultDescription: 'Fast, secure, file-based static website.',
        robots: 'index,follow'
      }
    };

    fs.writeFileSync(
      path.join(targetDir, 'storage/settings/site.json'),
      JSON.stringify(siteSettings, null, 2),
      'utf-8'
    );

    // Project aero.config.json
    const aeroConfig = {
      name: targetName,
      version: '1.0.0',
      deployment: deploymentMode,
      theme: selectedTheme,
      features: {
        catalog: enableCatalog
      },
      ...(deploymentMode === 'github-pages'
        ? {
            git: {
              branch: 'gh-pages',
              repo: gitRepo || '',
              cname: cname || ''
            }
          }
        : {
            server: {
              webRoot: '/var/www/html',
              privateStorage: './storage'
            }
          })
    };

    fs.writeFileSync(
      path.join(targetDir, 'aero.config.json'),
      JSON.stringify(aeroConfig, null, 2),
      'utf-8'
    );

    // Default Site Navigation
    const navSettings = {
      items: [
        { id: 'nav_home', label: 'Home', url: '/', order: 1 },
        { id: 'nav_articles', label: 'Articles', url: '/posts', order: 2 },
        ...(enableCatalog ? [{ id: 'nav_catalog', label: 'Store', url: '/products', order: 3 }] : []),
        { id: 'nav_about', label: 'About', url: '/about', order: 4 }
      ]
    };

    fs.writeFileSync(
      path.join(targetDir, 'storage/settings/nav.json'),
      JSON.stringify(navSettings, null, 2),
      'utf-8'
    );

    // Initial Categories
    const initialCategories = {
      categories: [
        {
          id: 'cat_general',
          name: 'General',
          slug: 'general',
          type: 'post',
          description: 'Default topic category for articles',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };

    fs.writeFileSync(
      path.join(targetDir, 'storage/categories/categories.json'),
      JSON.stringify(initialCategories, null, 2),
      'utf-8'
    );

    // Initial Sample Post (Article Blueprint)
    const samplePost = {
      title: 'Welcome to Aero CMS',
      slug: 'welcome-to-aero-cms',
      status: 'published',
      publishedAt: new Date().toISOString(),
      author: 'Aero Team',
      category: 'general',
      tags: ['aero', 'static-cms', 'jamstack'],
      excerpt: 'Discover the power of zero-database static web publishing with Aero CMS Concept.',
      content: {
        blocks: [
          {
            id: 'b1',
            type: 'heading',
            data: { text: 'Welcome to Your New Aero CMS Site', level: 2 }
          },
          {
            id: 'b2',
            type: 'paragraph',
            data: {
              text: 'This website is powered by Aero CMS Concept. All content is stored in clean JSON/Markdown files with zero database overhead. Run builds, switch Design Themes, and toggle Feature Packs directly from your dashboard.'
            }
          }
        ]
      },
      seo: {
        title: 'Welcome to Aero CMS',
        description: 'Discover zero-database static web publishing with Aero CMS Concept.'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(targetDir, 'storage/posts/welcome-to-aero-cms.json'),
      JSON.stringify(samplePost, null, 2),
      'utf-8'
    );

    // Initial Sample Page (Page Blueprint)
    const samplePage = {
      title: 'About Us',
      slug: 'about',
      status: 'published',
      publishedAt: new Date().toISOString(),
      template: 'default',
      content: {
        blocks: [
          {
            id: 'p1',
            type: 'heading',
            data: { text: 'About Our Publication', level: 2 }
          },
          {
            id: 'p2',
            type: 'paragraph',
            data: {
              text: 'We publish high-performance web content compiled to blazing-fast static assets.'
            }
          }
        ]
      },
      seo: {
        title: 'About Us',
        description: 'Learn more about our static publishing platform.'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(targetDir, 'storage/pages/about.json'),
      JSON.stringify(samplePage, null, 2),
      'utf-8'
    );

    // Project package.json
    const packageJson = {
      name: targetName,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'npm run start:cms',
        "start:cms": "aero-cms dev",
        build: "aero-cms build",
        publish: deploymentMode === 'github-pages' ? 'aero-cms build --publish github-pages' : 'aero-cms build --publish server',
        serve: "npx serve generated/website"
      },
      dependencies: {
        "@cms/server": "^1.0.0",
        "@cms/admin": "^1.0.0",
        "@cms/generator": "^1.0.0"
      }
    };

    fs.writeFileSync(
      path.join(targetDir, 'package.json'),
      JSON.stringify(packageJson, null, 2),
      'utf-8'
    );

    // .env file
    const envContent = `# Aero CMS Concept Environment
PORT=4000
STATIC_SITE_PORT=3000
STORAGE_DIR=./storage
THEMES_DIR=./themes
GENERATED_DIR=./generated/website
JWT_SECRET=${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}
`;
    fs.writeFileSync(path.join(targetDir, '.env'), envContent, 'utf-8');

    // .gitignore - strictly protects private authentication and server data
    const gitignoreContent = `# Dependencies & Build Outputs
node_modules/
dist/
.active-ports.json
generated/website/
.DS_Store
*.log

# Sensitive CMS Private Data (Zero Database Security)
.env
.env.local
storage/auth/
storage/sessions/
storage/backups/
storage/auth/refresh_tokens.json
`;
    fs.writeFileSync(path.join(targetDir, '.gitignore'), gitignoreContent, 'utf-8');

    console.log(`\n\x1b[32m✔ Successfully created Aero CMS project in \x1b[1m${targetDir}\x1b[0m\x1b[32m!\x1b[0m`);
    console.log(`\x1b[36m⚡ Deployment Target:\x1b[0m \x1b[1m${deploymentMode === 'github-pages' ? 'GitHub Pages (Free Tier Static Hosting)' : 'Own Server (Self-Hosted)'}\x1b[0m`);
    if (deploymentMode === 'github-pages' && gitRepo) {
      console.log(`   \x1b[90mRepository: ${gitRepo} (Branch: gh-pages)\x1b[0m`);
    }
    console.log('\n\x1b[1mTo launch your new site:\x1b[0m');
    console.log(`  \x1b[36mcd\x1b[0m ${targetName}`);
    console.log(`  \x1b[36mnpm install\x1b[0m`);
    console.log(`  \x1b[36mnpm run dev\x1b[0m\n`);
    console.log('\x1b[33m✨ QuickLaunch Wizard will open automatically in your browser on first run!\x1b[0m\n');
  } finally {
    rl.close();
  }
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  run().catch((err) => {
    console.error('\x1b[31mFatal error:\x1b[0m', err);
    process.exit(1);
  });
}

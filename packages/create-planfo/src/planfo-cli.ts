import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createPlanfoProject } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('planfo')
  .description('Planfo CMS CLI — Database-free static website manager')
  .version('1.0.6');

program.on('--help', () => {
  console.log(`
\x1b[1mExamples:\x1b[0m
  $ planfo create-fresh my-site  Download & install a fresh standalone Planfo CMS from GitHub
  $ planfo init my-site          Initialize a lightweight Planfo website folder
  $ cd my-site
  $ planfo dev                   Start Planfo CMS on http://localhost:3000
  $ planfo dev -p 4000           Start Planfo CMS on a custom port
  $ planfo build                 Compile static HTML/CSS into generated/
  $ planfo preview               Preview website and admin on http://localhost:3000
  $ planfo update                Check GitHub and update your Planfo CMS installation
  $ planfo reset-admin           Reset/restore admin login to admin/admin123
  $ planfo publish               Build and publish static output to GitHub Pages

\x1b[1mTroubleshooting & Global Setup:\x1b[0m
  If the 'planfo' command is not recognized globally on your system:
  1. Link it globally from your Planfo CMS folder:
     $ npm link packages/create-planfo
  2. Or run it directly via npm scripts:
     $ npm run planfo -- dev
`);
});

function resolvePlanfoProject(targetDir?: string): { projectDir: string; storageDir: string } | null {
  const base = targetDir ? path.resolve(process.cwd(), targetDir) : process.cwd();

  // 1. Check direct planfo (preferred) or .planfo (legacy)
  if (fs.existsSync(path.join(base, 'planfo'))) {
    return { projectDir: base, storageDir: path.join(base, 'planfo') };
  }
  if (fs.existsSync(path.join(base, '.planfo'))) {
    return { projectDir: base, storageDir: path.join(base, '.planfo') };
  }

  // 2. Scan immediate subdirectories in base
  try {
    const list = fs.readdirSync(base, { withFileTypes: true });
    for (const item of list) {
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        const sub = path.join(base, item.name);
        if (fs.existsSync(path.join(sub, 'planfo'))) {
          return { projectDir: sub, storageDir: path.join(sub, 'planfo') };
        }
        if (fs.existsSync(path.join(sub, '.planfo'))) {
          return { projectDir: sub, storageDir: path.join(sub, '.planfo') };
        }
      }
    }
  } catch {}

  return null;
}

// planfo init [name]
program
  .command('init [project-name]')
  .description('Initialize a new Planfo CMS project in the current or specified directory')
  .action((projectName = '.') => {
    console.log(`\n\x1b[36m⚡ Planfo CMS v1.0.6 — Initializing Project\x1b[0m\n`);
    const result = createPlanfoProject({
      name: projectName === '.' ? path.basename(process.cwd()) : projectName,
      targetDir: projectName
    });
    if (!result.success) {
      console.error(`\x1b[31m❌ Error: ${result.error}\x1b[0m\n`);
      process.exit(1);
    }
    console.log(`\x1b[32m✔ Planfo project initialized successfully in ${result.targetDir}\x1b[0m\n`);
  });

// planfo dev [dir]
program
  .command('dev [dir]')
  .description('Start the local development server and Planfo CMS dashboard')
  .option('-p, --port <port>', 'Port number to run CMS on', '3000')
  .action((dir, options) => {
    const port = options.port || '3000';
    const projectInfo = resolvePlanfoProject(dir);
    const monorepoRoot = findMonorepoRoot();

    const projectName = projectInfo ? path.basename(projectInfo.projectDir) : 'website';
    console.log(`\n\x1b[36m⚡ Starting Planfo CMS Unified Server on port ${port}...\x1b[0m`);
    if (projectInfo) {
      console.log(`\x1b[90m  Project: ${projectInfo.projectDir}\x1b[0m`);
      console.log(`\x1b[90m  Storage: ${projectInfo.storageDir}\x1b[0m`);
    }
    console.log(`\x1b[32m  ➜ CMS Admin:      http://localhost:${port}/admin\x1b[0m`);
    console.log(`\x1b[32m  ➜ Website:        http://localhost:${port}/${projectName}/\x1b[0m`);
    console.log(`\x1b[32m  ➜ Website (Root): http://localhost:${port}/\x1b[0m\n`);

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      CMS_PORT: port,
      PORT: port
    };

    if (projectInfo) {
      env.PLANFO_PROJECT_DIR = projectInfo.projectDir;
      env.STORAGE_PATH = projectInfo.storageDir;
      env.CONTENT_PATH = path.join(projectInfo.storageDir, 'content');
      env.MEDIA_PATH = path.join(projectInfo.storageDir, 'media');
      env.SETTINGS_PATH = projectInfo.storageDir;
      env.OUTPUT_PATH = path.join(projectInfo.projectDir, 'generated');
      env.THEMES_PATH = path.join(projectInfo.storageDir, 'themes');
    }

    const child = spawn('npm', ['run', 'dev'], {
      cwd: monorepoRoot,
      stdio: 'inherit',
      env
    });

    child.on('error', (err) => {
      console.error(`Failed to start Planfo dev server: ${err.message}`);
    });
  });

// planfo build [dir]
program
  .command('build [dir]')
  .description('Generate the static HTML website into generated/')
  .action((dir) => {
    console.log(`\n\x1b[36m⚡ Generating static website with Planfo CMS...\x1b[0m\n`);
    const projectInfo = resolvePlanfoProject(dir);
    const monorepoRoot = findMonorepoRoot();

    const env: NodeJS.ProcessEnv = {
      ...process.env
    };

    if (projectInfo) {
      env.PLANFO_PROJECT_DIR = projectInfo.projectDir;
      env.STORAGE_PATH = projectInfo.storageDir;
      env.TEMPLATES_PATH = path.join(projectInfo.storageDir, 'themes');
      env.OUTPUT_PATH = path.join(projectInfo.projectDir, 'generated');
    }

    const child = spawn('npx', ['tsx', path.join(monorepoRoot, 'apps/generator/src/cli.ts')], {
      cwd: monorepoRoot,
      stdio: 'inherit',
      env
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n\x1b[32m✔ Static website successfully generated in generated/!\x1b[0m`);
        console.log(`  Open generated/index.html to view your site.\n`);
      } else {
        console.error(`\x1b[31m❌ Generator exited with code ${code}\x1b[0m`);
      }
    });
  });

// planfo preview [dir]
program
  .command('preview [dir]')
  .description('Preview the generated static website and admin on the unified port')
  .option('-p, --port <port>', 'Port number to run on', '3000')
  .action((dir, options) => {
    const port = options.port || '3000';
    const projectInfo = resolvePlanfoProject(dir);
    const monorepoRoot = findMonorepoRoot();
    const projectName = projectInfo ? path.basename(projectInfo.projectDir) : 'website';

    console.log(`\n\x1b[36m⚡ Starting Planfo CMS Unified Preview Server on port ${port}...\x1b[0m`);
    console.log(`\x1b[32m  ➜ CMS Admin:      http://localhost:${port}/admin\x1b[0m`);
    console.log(`\x1b[32m  ➜ Website:        http://localhost:${port}/${projectName}/\x1b[0m`);
    console.log(`\x1b[32m  ➜ Website (Root): http://localhost:${port}/\x1b[0m\n`);

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      CMS_PORT: port,
      PORT: port
    };

    if (projectInfo) {
      env.PLANFO_PROJECT_DIR = projectInfo.projectDir;
      env.STORAGE_PATH = projectInfo.storageDir;
      env.CONTENT_PATH = path.join(projectInfo.storageDir, 'content');
      env.MEDIA_PATH = path.join(projectInfo.storageDir, 'media');
      env.SETTINGS_PATH = projectInfo.storageDir;
      env.OUTPUT_PATH = path.join(projectInfo.projectDir, 'generated');
      env.THEMES_PATH = path.join(projectInfo.storageDir, 'themes');
    }

    const child = spawn('npm', ['run', 'start'], {
      cwd: monorepoRoot,
      stdio: 'inherit',
      env
    });

    child.on('error', (err) => {
      console.error(`Failed to start preview server: ${err.message}`);
    });
  });

// planfo publish [dir]
program
  .command('publish [dir]')
  .description('Build and publish the static website to GitHub Pages')
  .action((dir) => {
    console.log(`\n\x1b[36m⚡ Publishing static website to GitHub Pages...\x1b[0m\n`);
    const projectInfo = resolvePlanfoProject(dir);
    const monorepoRoot = findMonorepoRoot();

    const env: NodeJS.ProcessEnv = {
      ...process.env
    };

    if (projectInfo) {
      env.PLANFO_PROJECT_DIR = projectInfo.projectDir;
    }

    const child = spawn('npx', ['tsx', path.join(monorepoRoot, 'apps/generator/src/cli.ts'), '--publish', 'git'], {
      cwd: monorepoRoot,
      stdio: 'inherit',
      env
    });
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n\x1b[32m✔ Successfully published to GitHub Pages!\x1b[0m\n`);
      }
    });
  });

// planfo reset-password [new-password] [dir] (also: planfo reset-admin)
program
  .command('reset-password [new-password] [dir]')
  .alias('reset-admin')
  .description('Reset or restore admin credentials for a Planfo CMS project (default: admin / admin123)')
  .action(async (newPassword = 'admin123', dir) => {
    const projectInfo = resolvePlanfoProject(dir);
    const storageDir = projectInfo ? projectInfo.storageDir : path.resolve(process.cwd(), 'storage');
    const authDir = path.join(storageDir, 'auth');
    const usersFile = path.join(authDir, 'users.json');

    console.log(`\n\x1b[36m⚡ Resetting Planfo CMS Admin Password...\x1b[0m`);
    console.log(`\x1b[90m  Storage: ${storageDir}\x1b[0m\n`);

    try {
      if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

      const monorepoRoot = findMonorepoRoot();
      const { hashPassword } = await import(path.join(monorepoRoot, 'apps/server/dist/auth/password.js'));
      const passwordHash = await hashPassword(newPassword);
      const now = new Date().toISOString();

      let users: any[] = [];
      if (fs.existsSync(usersFile)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
          users = parsed.users || [];
        } catch {}
      }

      const adminIdx = users.findIndex((u: any) => u.role === 'admin');
      if (adminIdx >= 0) {
        users[adminIdx].passwordHash = passwordHash;
        users[adminIdx].active = true;
        users[adminIdx].updatedAt = now;
      } else {
        users.unshift({
          id: 'usr_admin_default',
          email: 'admin@example.com',
          name: 'admin',
          passwordHash,
          role: 'admin',
          active: true,
          createdAt: now,
          updatedAt: now
        });
      }

      fs.writeFileSync(usersFile, JSON.stringify({ users }, null, 2), 'utf8');

      console.log(`\x1b[32m✔ Admin credentials successfully updated!\x1b[0m\n`);
      console.log(`  \x1b[1mUsername:\x1b[0m admin (or admin@example.com)`);
      console.log(`  \x1b[1mPassword:\x1b[0m ${newPassword}\n`);
      console.log(`  You can now log in at your CMS dashboard.\n`);
    } catch (err: any) {
      console.error(`\x1b[31m❌ Failed to reset password: ${err.message}\x1b[0m\n`);
    }
  });

function findMonorepoRoot(): string {
  // 1. From package location (packages/create-planfo/dist -> ../../..)
  const candidate = path.resolve(__dirname, '../../..');
  if (fs.existsSync(path.join(candidate, 'package.json')) && fs.existsSync(path.join(candidate, 'apps/generator'))) {
    return candidate;
  }
  // 2. From cwd upwards
  let cur = process.cwd();
  while (cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, 'package.json')) && fs.existsSync(path.join(cur, 'apps/generator'))) {
      return cur;
    }
    cur = path.dirname(cur);
  }
  return candidate;
}

// planfo create-fresh <project-name>
program
  .command('create-fresh <project-name>')
  .description('Download & install a 100% fresh standalone Planfo CMS project (no demo blueprints or sample content)')
  .option('-r, --repo <url>', 'GitHub repository slug or URL', process.env.PLANFO_GITHUB_REPO || 'pixoptimo/planfo')
  .option('-b, --branch <branch>', 'Git branch or release tag to install', 'main')
  .action((projectName, options) => {
    const monorepoRoot = findMonorepoRoot();
    const installerScript = path.join(monorepoRoot, 'scripts/install.mjs');
    if (fs.existsSync(installerScript)) {
      const child = spawn(
        process.execPath,
        [installerScript, projectName, '--repo', options.repo, '--branch', options.branch],
        { stdio: 'inherit' }
      );
      child.on('close', (code) => process.exit(code || 0));
      return;
    }

    console.error(`\x1b[31m❌ Installer script not found. Run: npx github:pixoptimo/planfo ${projectName}\x1b[0m\n`);
    process.exit(1);
  });

// planfo update
program
  .command('update')
  .description('Pull the latest Planfo CMS updates from GitHub and rebuild')
  .action(() => {
    const monorepoRoot = findMonorepoRoot();
    console.log(`\n\x1b[36m⚡ Updating Planfo CMS in ${monorepoRoot}...\x1b[0m\n`);
    const child = spawn('sh', ['-c', 'git pull origin main && npm install && npm run build'], {
      cwd: monorepoRoot,
      stdio: 'inherit'
    });
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n\x1b[32m✔ Planfo CMS updated successfully!\x1b[0m\n`);
      } else {
        console.error(`\n\x1b[31m❌ Update failed with exit code ${code}.\x1b[0m\n`);
      }
    });
  });

program.parse(process.argv);

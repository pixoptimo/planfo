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
  .version('0.1.0');

program.on('--help', () => {
  console.log(`
\x1b[1mExamples:\x1b[0m
  $ planfo init my-site          Initialize a new Planfo website project
  $ cd my-site
  $ planfo dev                   Start Planfo CMS dashboard on http://localhost:3000
  $ planfo dev -p 4000           Start Planfo CMS dashboard on a custom port
  $ planfo build                 Compile static HTML/CSS into generated/
  $ planfo preview               Preview the generated static website on :8080
  $ planfo publish               Build and publish static output to GitHub Pages

\x1b[1m\x1b[33mImportant Note:\x1b[0m
  Planfo website projects are database-free and intentionally \x1b[1mDO NOT\x1b[0m contain a package.json file.
  \x1b[31m✖ Do NOT run 'npm run dev' inside your website project folder!\x1b[0m
    (Doing so causes: npm error enoent Could not read package.json)
  \x1b[32m✔ Run 'planfo dev' instead.\x1b[0m

\x1b[1mTroubleshooting & Global Setup:\x1b[0m
  If the 'planfo' command is not recognized globally on your system:
  1. Link it globally from the CMS Monorepo:
     $ cd "/Users/bejoynj/Downloads/Static CMS/CMS Project"
     $ npm link packages/create-planfo
  2. Or run it directly via Node:
     $ node "<CMS-Monorepo>/packages/create-planfo/bin/planfo.js" dev
  3. Or run it from the CMS Monorepo targeting your website folder:
     $ npm run planfo -- dev "/path/to/your-website"
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
    console.log(`\n\x1b[36m⚡ Planfo CMS Beta v0.1 — Initializing Project\x1b[0m\n`);
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

    console.log(`\n\x1b[36m⚡ Starting Planfo CMS Development Server on port ${port}...\x1b[0m`);
    if (projectInfo) {
      console.log(`\x1b[90m  Project: ${projectInfo.projectDir}\x1b[0m`);
      console.log(`\x1b[90m  Storage: ${projectInfo.storageDir}\x1b[0m`);
    }
    console.log(`\x1b[32m  ➜ CMS Dashboard: http://localhost:${port}\x1b[0m\n`);

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
  .description('Preview the generated static website')
  .option('-p, --port <port>', 'Port for static preview server', '8080')
  .action((dir, options) => {
    const port = options.port || '8080';
    const projectInfo = resolvePlanfoProject(dir);
    const projectDir = projectInfo ? projectInfo.projectDir : process.cwd();
    const generatedDir = path.join(projectDir, 'generated');

    if (!fs.existsSync(generatedDir)) {
      console.warn(`\x1b[33m⚠ Warning: 'generated/' folder not found in ${projectDir}. Running 'planfo build' first...\x1b[0m`);
    }

    console.log(`\n\x1b[36m⚡ Previewing generated static website on http://localhost:${port}...\x1b[0m\n`);
    const child = spawn('npx', ['serve', generatedDir, '-p', port], {
      cwd: projectDir,
      stdio: 'inherit'
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

// planfo reset-password [new-password] [dir]
program
  .command('reset-password [new-password] [dir]')
  .description('Reset or restore admin credentials for a Planfo CMS project')
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

program.parse(process.argv);

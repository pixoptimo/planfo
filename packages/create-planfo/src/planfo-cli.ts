import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createPlanfoProject } from './index.js';

const program = new Command();

program
  .name('planfo')
  .description('Planfo CMS CLI — Database-free static website manager')
  .version('0.1.0');

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

// planfo dev
program
  .command('dev')
  .description('Start the local development server and Planfo CMS dashboard')
  .option('-p, --port <port>', 'Port number to run CMS on', '3000')
  .action((options) => {
    const port = options.port || '3000';
    console.log(`\n\x1b[36m⚡ Starting Planfo CMS Development Server on port ${port}...\x1b[0m`);
    console.log(`\x1b[32m  ➜ CMS Dashboard: http://localhost:${port}\x1b[0m\n`);

    const rootDir = findProjectRoot(process.cwd());
    const child = spawn('npm', ['run', 'dev'], {
      cwd: rootDir,
      stdio: 'inherit',
      env: { ...process.env, CMS_PORT: port, PORT: port }
    });

    child.on('error', (err) => {
      console.error(`Failed to start Planfo dev server: ${err.message}`);
    });
  });

// planfo build
program
  .command('build')
  .description('Generate the static HTML website into generated/')
  .action(() => {
    console.log(`\n\x1b[36m⚡ Generating static website with Planfo CMS...\x1b[0m\n`);
    const rootDir = findProjectRoot(process.cwd());
    const child = spawn('npx', ['tsx', 'apps/generator/src/cli.ts'], {
      cwd: rootDir,
      stdio: 'inherit'
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

// planfo preview
program
  .command('preview')
  .description('Preview the generated static website')
  .option('-p, --port <port>', 'Port for static preview server', '8080')
  .action((options) => {
    const port = options.port || '8080';
    console.log(`\n\x1b[36m⚡ Previewing generated static website on http://localhost:${port}...\x1b[0m\n`);
    const rootDir = findProjectRoot(process.cwd());
    const generatedDir = path.join(rootDir, 'generated');
    const child = spawn('npx', ['serve', generatedDir, '-p', port], {
      cwd: rootDir,
      stdio: 'inherit'
    });
    child.on('error', (err) => {
      console.error(`Failed to start preview server: ${err.message}`);
    });
  });

// planfo publish
program
  .command('publish')
  .description('Build and publish the static website to GitHub Pages')
  .action(() => {
    console.log(`\n\x1b[36m⚡ Publishing static website to GitHub Pages...\x1b[0m\n`);
    const rootDir = findProjectRoot(process.cwd());
    const child = spawn('npx', ['tsx', 'apps/generator/src/cli.ts', '--publish', 'git'], {
      cwd: rootDir,
      stdio: 'inherit'
    });
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n\x1b[32m✔ Successfully published to GitHub Pages!\x1b[0m\n`);
      }
    });
  });

function findProjectRoot(startDir: string): string {
  let cur = startDir;
  while (cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, 'package.json')) && fs.existsSync(path.join(cur, 'apps'))) {
      return cur;
    }
    cur = path.dirname(cur);
  }
  return startDir;
}

program.parse(process.argv);

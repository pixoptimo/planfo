import { Command } from 'commander';
import path from 'node:path';
import { createPlanfoProject } from './index.js';

const program = new Command();

program
  .name('create-planfo')
  .description('Create a new Planfo CMS project — Database-free static website builder')
  .version('0.1.0')
  .arguments('[project-name]')
  .action((projectName: string = 'my-website') => {
    console.log(`\n\x1b[36m⚡ Planfo CMS (Beta v0.1)\x1b[0m`);
    console.log(`\x1b[90mScaffolding new database-free static CMS project in \x1b[1m${projectName}\x1b[0m...\n`);

    const result = createPlanfoProject({
      name: projectName,
      targetDir: projectName
    });

    if (!result.success) {
      console.error(`\x1b[31m❌ Error: ${result.error}\x1b[0m\n`);
      process.exit(1);
    }

    console.log(`\x1b[32m✔ Planfo project '${projectName}' created successfully!\x1b[0m\n`);
    console.log(`\x1b[1mNext steps:\x1b[0m`);
    console.log(`  cd ${projectName}`);
    console.log(`  planfo dev       # Open Planfo CMS on http://localhost:3000\n`);
    console.log(`  planfo build     # Generate static HTML in generated/\n`);
  });

program.parse(process.argv);

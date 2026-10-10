import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { StaticSiteGenerator } from './generator.js';
import { createPublisher } from './publishers/publisherFactory.js';

dotenv.config();

async function run(): Promise<void> {
  const findPlanfo = (dir: string): string | null => {
    if (fs.existsSync(path.join(dir, 'planfo'))) return path.join(dir, 'planfo');
    if (fs.existsSync(path.join(dir, '.planfo'))) return path.join(dir, '.planfo');
    return null;
  };

  const projectDir = process.env.PLANFO_PROJECT_DIR || (findPlanfo(process.cwd()) ? process.cwd() : undefined);
  const planfoDir = projectDir ? findPlanfo(projectDir) : null;

  const storagePath = planfoDir
    ? planfoDir
    : path.resolve(process.cwd(), process.env.STORAGE_PATH || './storage');

  const outputPath = projectDir
    ? path.join(projectDir, 'generated')
    : path.resolve(process.cwd(), process.env.OUTPUT_PATH || './generated/website');

  const templatesPath = planfoDir
    ? (fs.existsSync(path.join(planfoDir, 'themes')) ? path.join(planfoDir, 'themes') : path.resolve(process.cwd(), process.env.TEMPLATES_PATH || './themes'))
    : path.resolve(process.cwd(), process.env.TEMPLATES_PATH || './templates');

  console.log('🚀 Starting Static Site Generation...');
  console.log(`- Storage: ${storagePath}`);
  console.log(`- Templates: ${templatesPath}`);
  console.log(`- Output: ${outputPath}`);

  const publishIndex = process.argv.indexOf('--publish');
  const publisherType = publishIndex !== -1 ? (process.argv[publishIndex + 1] as any) : undefined;
  if (publisherType) {
    console.log(`🚀 Deployment Target: ${publisherType}`);
  }

  const generator = new StaticSiteGenerator({
    storagePath,
    templatesPath,
    outputPath,
    publisherType
  });

  const result = await generator.build();
  console.log('✅ Static Site Generated Successfully in', result.durationMs, 'ms');
  console.log('📊 Stats:', result.stats);
}

run().catch((err) => {
  console.error('❌ Generation Failed:', err);
  process.exit(1);
});

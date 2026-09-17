import path from 'node:path';
import dotenv from 'dotenv';
import { StaticSiteGenerator } from './generator.js';

dotenv.config();

async function run(): Promise<void> {
  const storagePath = path.resolve(process.cwd(), process.env.STORAGE_PATH || './storage');
  const templatesPath = path.resolve(process.cwd(), process.env.TEMPLATES_PATH || './templates');
  const outputPath = path.resolve(process.cwd(), process.env.OUTPUT_PATH || './generated/website');

  console.log('🚀 Starting Static Site Generation...');
  console.log(`- Storage: ${storagePath}`);
  console.log(`- Templates: ${templatesPath}`);
  console.log(`- Output: ${outputPath}`);

  const generator = new StaticSiteGenerator({
    storagePath,
    templatesPath,
    outputPath
  });

  const result = await generator.build();
  console.log('✅ Static Site Generated Successfully in', result.durationMs, 'ms');
  console.log('📊 Stats:', result.stats);
}

run().catch((err) => {
  console.error('❌ Generation Failed:', err);
  process.exit(1);
});

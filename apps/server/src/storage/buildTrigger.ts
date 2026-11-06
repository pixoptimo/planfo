import { StaticSiteGenerator } from '@cms/generator';
import { logger } from '@cms/utils';
import { config } from '../config/env.js';

let buildPromise: Promise<void> | null = null;
let pendingBuild = false;

export async function triggerStaticBuild(): Promise<void> {
  if (buildPromise) {
    pendingBuild = true;
    return;
  }

  buildPromise = (async () => {
    try {
      const generator = new StaticSiteGenerator({
        storagePath: config.STORAGE_PATH,
        templatesPath: config.TEMPLATES_PATH,
        outputPath: config.OUTPUT_PATH
      });
      await generator.build();
      logger.info('Static site automatically rebuilt after content modification');
    } catch (err) {
      logger.error('Failed to regenerate site upon content change', { error: String(err) });
    } finally {
      buildPromise = null;
      if (pendingBuild) {
        pendingBuild = false;
        triggerStaticBuild().catch(() => {});
      }
    }
  })();
}

import path from 'node:path';
import { pathExists, atomicDirectorySwap } from '@cms/utils';
import type { Publisher } from '@cms/types';

export class LocalFilesystemPublisher implements Publisher {
  readonly type = 'local' as const;

  async deploy(stagingDir: string, targetDir: string): Promise<boolean> {
    await atomicDirectorySwap(stagingDir, targetDir);
    return true;
  }

  async validate(targetDir: string): Promise<boolean> {
    const indexPath = path.join(targetDir, 'index.html');
    const sitemapPath = path.join(targetDir, 'sitemap.xml');
    return (await pathExists(indexPath)) && (await pathExists(sitemapPath));
  }
}

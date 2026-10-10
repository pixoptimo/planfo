import type { Publisher, PublisherType } from '@cms/types';
import { LocalFilesystemPublisher } from './localPublisher.js';
import { ServerFilesystemPublisher } from './serverPublisher.js';
import { GitPublisher, type GitPublisherOptions } from './gitPublisher.js';

export function createPublisher(type: PublisherType = 'local', options?: Record<string, unknown>): Publisher {
  switch (type) {
    case 'git':
    case 'github-pages':
      return new GitPublisher(options as GitPublisherOptions);
    case 'server':
      return new ServerFilesystemPublisher();
    case 'local':
    default:
      return new LocalFilesystemPublisher();
  }
}

export { GitPublisher, LocalFilesystemPublisher, ServerFilesystemPublisher };


import type { Publisher, PublisherType } from '@cms/types';
import { LocalFilesystemPublisher } from './localPublisher.js';
import { ServerFilesystemPublisher } from './serverPublisher.js';

export function createPublisher(type: PublisherType = 'local'): Publisher {
  switch (type) {
    case 'server':
      return new ServerFilesystemPublisher();
    case 'local':
    default:
      return new LocalFilesystemPublisher();
  }
}

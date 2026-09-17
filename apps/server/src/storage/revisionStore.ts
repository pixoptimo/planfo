import path from 'node:path';
import { readJson, writeJsonAtomic, ensureDir, listJsonFiles, safeResolvePath } from '@cms/utils';
import { RevisionSchema, type Revision, type ContentType, type RevisionMeta } from '@cms/schemas';
import { config } from '../config/env.js';

export class RevisionStore {
  private static getRevisionsDir(contentType: ContentType, slug: string): string {
    return safeResolvePath(path.join(config.REVISION_PATH, contentType === 'page' ? 'pages' : contentType === 'post' ? 'posts' : 'products'), slug);
  }

  static async createRevision(
    contentType: ContentType,
    contentId: string,
    slug: string,
    data: Record<string, unknown>,
    authorEmail = 'admin',
    summary = ''
  ): Promise<Revision> {
    const dir = this.getRevisionsDir(contentType, slug);
    await ensureDir(dir);

    const existingFiles = await listJsonFiles(dir);
    const version = existingFiles.length + 1;
    const versionFormatted = String(version).padStart(3, '0');
    const revisionId = `rev_${contentType}_${slug}_v${versionFormatted}`;

    const revision: Revision = {
      id: revisionId,
      contentType,
      contentId,
      slug,
      version,
      createdAt: new Date().toISOString(),
      authorEmail,
      data,
      summary: summary || `Published version ${version}`
    };

    const filePath = path.join(dir, `revision-${versionFormatted}.json`);
    await writeJsonAtomic(filePath, revision, RevisionSchema);

    return revision;
  }

  static async getRevisions(contentType: ContentType, slug: string): Promise<RevisionMeta[]> {
    const dir = this.getRevisionsDir(contentType, slug);
    const files = await listJsonFiles(dir);
    const revisions: RevisionMeta[] = [];

    for (const file of files) {
      try {
        const rev = await readJson<Revision>(file, RevisionSchema);
        revisions.push({
          id: rev.id,
          contentType: rev.contentType,
          contentId: rev.contentId,
          slug: rev.slug,
          version: rev.version,
          createdAt: rev.createdAt,
          authorEmail: rev.authorEmail,
          summary: rev.summary
        });
      } catch {
        // Skip corrupted revision
      }
    }

    return revisions.sort((a, b) => b.version - a.version);
  }

  static async getRevisionById(contentType: ContentType, slug: string, id: string): Promise<Revision | null> {
    const dir = this.getRevisionsDir(contentType, slug);
    const files = await listJsonFiles(dir);

    for (const file of files) {
      try {
        const rev = await readJson<Revision>(file, RevisionSchema);
        if (rev.id === id) {
          return rev;
        }
      } catch {
        // Skip
      }
    }

    return null;
  }
}

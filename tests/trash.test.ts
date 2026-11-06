import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TrashStore } from '../apps/server/src/storage/trashStore.js';
import { PageStore } from '../apps/server/src/storage/pageStore.js';
import { initializeStorage } from '../apps/server/src/storage/storageInit.js';
import type { Page } from '@cms/schemas';

describe('Soft Delete & Trash System', () => {
  beforeAll(async () => {
    await initializeStorage();
  });

  it('should move deleted item to trash, restore it as draft, and permanently delete it', async () => {
    const slug = `trash-test-${Date.now()}`;
    const page: Page = {
      id: `page_${Date.now()}`,
      title: 'Test Trash Page',
      slug,
      status: 'published',
      template: 'default',
      content: { blocks: [] },
      featuredImage: '',
      seo: {
        title: 'Trash Test',
        description: 'Trash test description',
        canonical: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        robots: 'index,follow'
      },
      noIndex: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    };

    // 1. Save original page and delete it to trash
    await PageStore.save(page);
    expect(await PageStore.getBySlug(slug)).not.toBeNull();

    // 2. Move to Trash and delete from PageStore
    const trashed = await TrashStore.moveToTrash('page', page, 'admin@example.com');
    await PageStore.delete(slug);

    expect(trashed.trashId).toBeDefined();
    expect(trashed.entityType).toBe('page');
    expect(trashed.title).toBe('Test Trash Page');

    // Verify page is gone from active store
    expect(await PageStore.getBySlug(slug)).toBeNull();

    // Verify page is present in Trash
    const allTrash = await TrashStore.getAll();
    expect(allTrash.some((i) => i.trashId === trashed.trashId)).toBe(true);

    const count = await TrashStore.getCount();
    expect(count).toBeGreaterThan(0);

    // 3. Restore from trash
    const restoreRes = await TrashStore.restore(trashed.trashId, 'admin@example.com');
    expect(restoreRes.success).toBe(true);

    // Check that it's back in PageStore with status 'draft'
    const restoredPage = await PageStore.getBySlug(slug);
    expect(restoredPage).not.toBeNull();
    expect(restoredPage?.status).toBe('draft');

    // Check that it's removed from trash
    const inTrashAfterRestore = await TrashStore.getById(trashed.trashId);
    expect(inTrashAfterRestore).toBeNull();

    // 4. Test permanent delete
    const trashedAgain = await TrashStore.moveToTrash('page', restoredPage!, 'admin@example.com');
    await PageStore.delete(slug);

    const permanentlyDeleted = await TrashStore.deletePermanently(trashedAgain.trashId, 'admin@example.com');
    expect(permanentlyDeleted).toBe(true);
    expect(await TrashStore.getById(trashedAgain.trashId)).toBeNull();
  });

  it('should support trashing, restoring, and permanently deleting media items', async () => {
    const filename = `test-media-${Date.now()}.png`;
    const mediaItem = {
      id: `media_${Date.now()}`,
      filename,
      originalName: 'test.png',
      mimeType: 'image/png',
      size: 1024,
      url: `/media/${filename}`,
      createdAt: new Date().toISOString()
    };

    // 1. Move media to trash
    const trashed = await TrashStore.moveToTrash('media', mediaItem, 'admin@example.com');
    expect(trashed.entityType).toBe('media');
    expect(trashed.title).toBe(mediaItem.id);

    // 2. Restore media from trash
    const restored = await TrashStore.restore(trashed.trashId, 'admin@example.com');
    expect(restored.success).toBe(true);

    // 3. Move to trash again and permanently delete
    const trashedAgain = await TrashStore.moveToTrash('media', mediaItem, 'admin@example.com');
    const purged = await TrashStore.deletePermanently(trashedAgain.trashId, 'admin@example.com');
    expect(purged).toBe(true);
  });
});

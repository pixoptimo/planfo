import { describe, it, expect, beforeAll } from 'vitest';
import { PageStore } from '../apps/server/src/storage/pageStore.js';
import { PostStore } from '../apps/server/src/storage/postStore.js';
import { ProductStore } from '../apps/server/src/storage/productStore.js';
import { CategoryStore } from '../apps/server/src/storage/categoryStore.js';
import { initializeStorage } from '../apps/server/src/storage/storageInit.js';
import { slugify, makeUniqueSlug } from '@cms/utils';
import type { Page, Post, Product } from '@cms/schemas';

describe('Content Management & Filesystem Storage', () => {
  beforeAll(async () => {
    await initializeStorage();
  });

  it('should generate URL safe slugs and handle uniqueness', () => {
    const raw = 'Hello World & 100% Modern CMS!';
    const slug = slugify(raw);
    expect(slug).toBe('hello-world-100-modern-cms');

    const existing = ['about-us', 'about-us-2'];
    const uniqueSlug = makeUniqueSlug('about-us', existing);
    expect(uniqueSlug).toBe('about-us-3');
  });

  it('should perform complete CRUD operations on Pages', async () => {
    const slug = `test-page-${Date.now()}`;
    const page: Page = {
      id: `page_${Date.now()}`,
      title: 'Test Dynamic Page',
      slug,
      status: 'draft',
      template: 'default',
      content: {
        blocks: [
          { id: '1', type: 'heading', level: 2, text: 'Test Heading' },
          { id: '2', type: 'paragraph', text: 'Test Paragraph Content' }
        ]
      },
      featuredImage: '',
      seo: {
        title: 'SEO Title',
        description: 'SEO Description',
        canonical: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        robots: 'index,follow'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null
    };

    // Create / Save
    await PageStore.save(page);
    const retrieved = await PageStore.getBySlug(slug);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Test Dynamic Page');
    expect(retrieved?.content.blocks.length).toBe(2);

    // Update
    page.title = 'Updated Dynamic Page Title';
    await PageStore.save(page);
    const updated = await PageStore.getBySlug(slug);
    expect(updated?.title).toBe('Updated Dynamic Page Title');

    // Delete
    const deleted = await PageStore.delete(slug);
    expect(deleted).toBe(true);
    const afterDelete = await PageStore.getBySlug(slug);
    expect(afterDelete).toBeNull();
  });

  it('should perform complete CRUD operations on Posts', async () => {
    const slug = `test-post-${Date.now()}`;
    const post: Post = {
      id: `post_${Date.now()}`,
      title: 'Test Post Article',
      slug,
      excerpt: 'Brief summary',
      content: {
        blocks: [{ id: 'p1', type: 'paragraph', text: 'Blog content...' }]
      },
      featuredImage: '',
      author: 'Author Name',
      category: 'technology',
      tags: ['tech', 'cms'],
      status: 'draft',
      template: 'default',
      seo: {
        title: 'Post SEO',
        description: 'Post SEO Desc',
        canonical: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        robots: 'index,follow'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null
    };

    await PostStore.save(post);
    const retrieved = await PostStore.getBySlug(slug);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.tags).toEqual(['tech', 'cms']);

    await PostStore.delete(slug);
    const check = await PostStore.getBySlug(slug);
    expect(check).toBeNull();
  });

  it('should perform complete CRUD operations on Products', async () => {
    const slug = `test-product-${Date.now()}`;
    const product: Product = {
      id: `prod_${Date.now()}`,
      name: 'Mechanical Switch Set',
      slug,
      sku: 'SW-001',
      price: 29.99,
      currency: 'USD',
      shortDescription: 'Tactile switches',
      description: { blocks: [] },
      images: ['/media/switch.jpg'],
      category: 'hardware',
      tags: ['hardware', 'diy'],
      status: 'draft',
      featured: true,
      template: 'default',
      seo: {
        title: 'Switches',
        description: 'Best switches',
        canonical: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        robots: 'index,follow'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null
    };

    await ProductStore.save(product);
    const retrieved = await ProductStore.getBySlug(slug);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.price).toBe(29.99);
    expect(retrieved?.featured).toBe(true);

    await ProductStore.delete(slug);
  });
});

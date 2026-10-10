import { describe, it, expect, beforeAll } from 'vitest';
import { BlueprintStore, BlueprintEntryStore } from '../apps/server/src/storage/blueprintStore.js';
import { initializeStorage } from '../apps/server/src/storage/storageInit.js';
import type { Blueprint, BlueprintEntry } from '@cms/schemas';

describe('Content Blueprints System & Dynamic Collections', () => {
  beforeAll(async () => {
    await initializeStorage();
  });

  it('should list built-in core blueprints and protect them from deletion', async () => {
    const builtIns = BlueprintStore.getBuiltInBlueprints();
    expect(builtIns.length).toBeGreaterThanOrEqual(2);
    expect(builtIns.map((b) => b.slug)).toContain('pages');
    expect(builtIns.map((b) => b.slug)).toContain('posts');

    const canDeletePages = await BlueprintStore.delete('pages');
    expect(canDeletePages).toBe(false);

    const canDeletePosts = await BlueprintStore.delete('posts');
    expect(canDeletePosts).toBe(false);
  });

  it('should create, retrieve, update, and delete custom blueprints', async () => {
    const testSlug = `testimonials-${Date.now()}`;
    const blueprint: Blueprint = {
      id: `bp_${Date.now()}`,
      name: 'Customer Testimonials',
      singularName: 'Testimonial',
      slug: testSlug,
      icon: 'MessageSquare',
      description: 'Reviews and quotes from customers',
      hasCategories: true,
      hasTags: true,
      hasContentEditor: true,
      isBuiltIn: false,
      fields: [
        {
          id: 'fld_author',
          name: 'author_role',
          label: 'Author Role',
          type: 'text',
          required: true,
          options: [],
          placeholder: 'e.g. VP Marketing',
          description: ''
        },
        {
          id: 'fld_company',
          name: 'company',
          label: 'Company Name',
          type: 'text',
          required: false,
          options: [],
          placeholder: 'e.g. Acme Inc',
          description: ''
        },
        {
          id: 'fld_rating',
          name: 'rating',
          label: 'Star Rating',
          type: 'number',
          required: false,
          options: [],
          placeholder: '5',
          description: ''
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Save blueprint
    await BlueprintStore.save(blueprint);

    // 2. Retrieve by slug
    const fetched = await BlueprintStore.getBySlug(testSlug);
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe('Customer Testimonials');
    expect(fetched?.fields.length).toBe(3);
    expect(fetched?.fields[0].name).toBe('author_role');

    // 3. Update blueprint
    const updated: Blueprint = {
      ...blueprint,
      description: 'Updated description for reviews',
      updatedAt: new Date().toISOString()
    };
    await BlueprintStore.save(updated, testSlug);

    const fetchedUpdated = await BlueprintStore.getBySlug(testSlug);
    expect(fetchedUpdated?.description).toBe('Updated description for reviews');

    // 4. Clean up blueprint
    const deleted = await BlueprintStore.delete(testSlug);
    expect(deleted).toBe(true);

    const fetchedAfterDelete = await BlueprintStore.getBySlug(testSlug);
    expect(fetchedAfterDelete).toBeNull();
  });

  it('should store, retrieve, and delete dynamic entries for custom blueprints', async () => {
    const bpSlug = `case-studies-${Date.now()}`;
    const blueprint: Blueprint = {
      id: `bp_${Date.now()}`,
      name: 'Case Studies',
      singularName: 'Case Study',
      slug: bpSlug,
      icon: 'Briefcase',
      description: 'Client portfolio case studies',
      hasCategories: true,
      hasTags: true,
      hasContentEditor: true,
      isBuiltIn: false,
      fields: [
        {
          id: 'fld_client',
          name: 'client_name',
          label: 'Client Name',
          type: 'text',
          required: true,
          options: [],
          placeholder: '',
          description: ''
        },
        {
          id: 'fld_impact',
          name: 'metric',
          label: 'Key Metric',
          type: 'text',
          required: false,
          options: [],
          placeholder: '',
          description: ''
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await BlueprintStore.save(blueprint);

    // Create an entry
    const entrySlug = 'stripe-migration';
    const entry: BlueprintEntry = {
      id: `ent_${Date.now()}`,
      blueprintId: blueprint.id,
      title: 'Stripe Global Migration',
      slug: entrySlug,
      status: 'published',
      publishedAt: new Date().toISOString(),
      category: 'fintech',
      tags: ['cloud', 'payments'],
      excerpt: 'How we migrated high-throughput billing systems.',
      featuredImage: '/media/stripe-case.jpg',
      data: {
        client_name: 'Stripe Inc.',
        metric: '+350% Scale'
      },
      content: {
        blocks: [
          { id: 'b1', type: 'heading', level: 2, text: 'The Challenge' },
          { id: 'b2', type: 'paragraph', text: 'Handling massive distributed transactions.' }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await BlueprintEntryStore.save(bpSlug, entry);

    // Verify entry count on blueprint
    const count = await BlueprintStore.getEntryCount(bpSlug);
    expect(count).toBe(1);

    // Retrieve entry
    const fetchedEntry = await BlueprintEntryStore.getBySlug(bpSlug, entrySlug);
    expect(fetchedEntry).not.toBeNull();
    expect(fetchedEntry?.title).toBe('Stripe Global Migration');
    expect(fetchedEntry?.data?.client_name).toBe('Stripe Inc.');
    expect(fetchedEntry?.data?.metric).toBe('+350% Scale');
    expect(fetchedEntry?.category).toBe('fintech');
    expect(fetchedEntry?.tags).toContain('cloud');

    // List entries
    const allEntries = await BlueprintEntryStore.getAll(bpSlug);
    expect(allEntries.length).toBe(1);

    // Delete entry
    const entryDeleted = await BlueprintEntryStore.delete(bpSlug, entrySlug);
    expect(entryDeleted).toBe(true);

    const countAfter = await BlueprintStore.getEntryCount(bpSlug);
    expect(countAfter).toBe(0);

    // Clean up blueprint
    await BlueprintStore.delete(bpSlug);
  });
});

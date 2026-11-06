import { z } from 'zod';
import { SEOSchema } from './seo.js';
import { StructuredContentSchema } from './content.js';

export const ContentStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

export const PageContentSchema = z.union([
  StructuredContentSchema,
  z.string(),
  z.object({ html: z.string() })
]).default({ blocks: [] });
export type PageContent = z.infer<typeof PageContentSchema>;

export const PageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  status: ContentStatusSchema.default('draft'),
  template: z.string().default('default'),
  content: PageContentSchema,
  featuredImage: z.string().optional().default(''),
  seo: SEOSchema.default({}),
  noIndex: z.boolean().optional().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable().default(null)
});
export type Page = z.infer<typeof PageSchema>;

export const CreatePageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format').optional(),
  status: ContentStatusSchema.default('draft'),
  template: z.string().default('default'),
  content: PageContentSchema.optional().default({ blocks: [] }),
  featuredImage: z.string().optional().default(''),
  seo: SEOSchema.optional(),
  noIndex: z.boolean().optional().default(false)
});
export type CreatePageInput = z.infer<typeof CreatePageSchema>;

export const UpdatePageSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  status: ContentStatusSchema.optional(),
  template: z.string().optional(),
  content: PageContentSchema.optional(),
  featuredImage: z.string().optional(),
  seo: SEOSchema.optional(),
  noIndex: z.boolean().optional()
});
export type UpdatePageInput = z.infer<typeof UpdatePageSchema>;

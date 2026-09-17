import { z } from 'zod';
import { SEOSchema } from './seo.js';
import { StructuredContentSchema } from './content.js';
import { ContentStatusSchema } from './page.js';

export const PostSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  excerpt: z.string().default(''),
  content: StructuredContentSchema.default({ blocks: [] }),
  featuredImage: z.string().optional().default(''),
  author: z.string().default(''),
  category: z.string().default('general'),
  tags: z.array(z.string()).default([]),
  status: ContentStatusSchema.default('draft'),
  template: z.string().default('default'),
  seo: SEOSchema.default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable().default(null)
});
export type Post = z.infer<typeof PostSchema>;

export const CreatePostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  excerpt: z.string().optional().default(''),
  content: StructuredContentSchema.default({ blocks: [] }),
  featuredImage: z.string().optional().default(''),
  author: z.string().optional().default(''),
  category: z.string().optional().default('general'),
  tags: z.array(z.string()).optional().default([]),
  status: ContentStatusSchema.default('draft'),
  template: z.string().default('default'),
  seo: SEOSchema.optional()
});
export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export const UpdatePostSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  excerpt: z.string().optional(),
  content: StructuredContentSchema.optional(),
  featuredImage: z.string().optional(),
  author: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: ContentStatusSchema.optional(),
  template: z.string().optional(),
  seo: SEOSchema.optional()
});
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;

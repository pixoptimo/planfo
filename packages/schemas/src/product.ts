import { z } from 'zod';
import { SEOSchema } from './seo.js';
import { StructuredContentSchema } from './content.js';
import { ContentStatusSchema } from './page.js';

export const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  sku: z.string().default(''),
  price: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  shortDescription: z.string().default(''),
  description: StructuredContentSchema.default({ blocks: [] }),
  images: z.array(z.string()).default([]),
  category: z.string().default('general'),
  tags: z.array(z.string()).default([]),
  status: ContentStatusSchema.default('draft'),
  featured: z.boolean().default(false),
  template: z.string().default('default'),
  seo: SEOSchema.default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable().default(null)
});
export type Product = z.infer<typeof ProductSchema>;

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  sku: z.string().optional().default(''),
  price: z.number().min(0).default(0),
  currency: z.string().optional().default('USD'),
  shortDescription: z.string().optional().default(''),
  description: StructuredContentSchema.default({ blocks: [] }),
  images: z.array(z.string()).optional().default([]),
  category: z.string().optional().default('general'),
  tags: z.array(z.string()).optional().default([]),
  status: ContentStatusSchema.default('draft'),
  featured: z.boolean().optional().default(false),
  template: z.string().default('default'),
  seo: SEOSchema.optional()
});
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  sku: z.string().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().optional(),
  shortDescription: z.string().optional(),
  description: StructuredContentSchema.optional(),
  images: z.array(z.string()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: ContentStatusSchema.optional(),
  featured: z.boolean().optional(),
  template: z.string().optional(),
  seo: SEOSchema.optional()
});
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

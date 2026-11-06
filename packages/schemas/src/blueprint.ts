import { z } from 'zod';
import { StructuredContentSchema } from './content.js';
import { SEOSchema } from './seo.js';

export const BlueprintFieldTypeSchema = z.enum([
  'text',
  'textarea',
  'number',
  'boolean',
  'date',
  'image',
  'select',
  'url',
  'email',
  'content'
]);
export type BlueprintFieldType = z.infer<typeof BlueprintFieldTypeSchema>;

export const BlueprintFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Field name is required').regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must be alphanumeric identifier'),
  label: z.string().min(1, 'Field label is required'),
  type: BlueprintFieldTypeSchema.default('text'),
  required: z.boolean().default(false),
  defaultValue: z.any().optional(),
  options: z.array(z.string()).default([]),
  placeholder: z.string().optional().default(''),
  description: z.string().optional().default('')
});
export type BlueprintField = z.infer<typeof BlueprintFieldSchema>;

export const BlueprintSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Blueprint name is required'),
  singularName: z.string().min(1, 'Singular name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  icon: z.string().default('FileText'),
  description: z.string().optional().default(''),
  hasCategories: z.boolean().default(true),
  hasTags: z.boolean().default(true),
  hasContentEditor: z.boolean().default(true),
  isBuiltIn: z.boolean().default(false),
  fields: z.array(BlueprintFieldSchema).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Blueprint = z.infer<typeof BlueprintSchema>;

export const CreateBlueprintSchema = z.object({
  name: z.string().min(1, 'Blueprint name is required'),
  singularName: z.string().min(1, 'Singular name is required'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  icon: z.string().default('FileText'),
  description: z.string().optional().default(''),
  hasCategories: z.boolean().default(true),
  hasTags: z.boolean().default(true),
  hasContentEditor: z.boolean().default(true),
  fields: z.array(BlueprintFieldSchema).default([])
});
export type CreateBlueprintInput = z.infer<typeof CreateBlueprintSchema>;

export const UpdateBlueprintSchema = CreateBlueprintSchema.partial();
export type UpdateBlueprintInput = z.infer<typeof UpdateBlueprintSchema>;

export const BlueprintEntrySchema = z.object({
  id: z.string(),
  blueprintId: z.string().default('templates'),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  status: z.enum(['draft', 'published']).default('draft'),
  publishedAt: z.string().nullable().optional(),
  category: z.string().optional().default('general'),
  tags: z.array(z.string()).default([]),
  excerpt: z.string().optional().default(''),
  featuredImage: z.string().optional().default(''),
  data: z.record(z.any()).default({}),
  content: StructuredContentSchema.optional().default({ blocks: [] }),
  seo: SEOSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type BlueprintEntry = z.infer<typeof BlueprintEntrySchema>;

export const CreateBlueprintEntrySchema = z.object({
  blueprintId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  category: z.string().optional().default('general'),
  tags: z.array(z.string()).default([]),
  excerpt: z.string().optional().default(''),
  featuredImage: z.string().optional().default(''),
  data: z.record(z.any()).default({}),
  content: StructuredContentSchema.optional().default({ blocks: [] }),
  seo: SEOSchema.optional()
});
export type CreateBlueprintEntryInput = z.infer<typeof CreateBlueprintEntrySchema>;

export const UpdateBlueprintEntrySchema = CreateBlueprintEntrySchema.partial();
export type UpdateBlueprintEntryInput = z.infer<typeof UpdateBlueprintEntrySchema>;

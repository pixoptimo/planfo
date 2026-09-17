import { z } from 'zod';

export const ContentTypeSchema = z.enum(['page', 'post', 'product']);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const RevisionSchema = z.object({
  id: z.string().min(1),
  contentType: ContentTypeSchema,
  contentId: z.string().min(1),
  slug: z.string().min(1),
  version: z.number().int().min(1),
  createdAt: z.string().datetime(),
  authorEmail: z.string().default('system'),
  data: z.record(z.unknown()),
  summary: z.string().optional().default('')
});
export type Revision = z.infer<typeof RevisionSchema>;

export const RevisionMetaSchema = z.object({
  id: z.string(),
  contentType: ContentTypeSchema,
  contentId: z.string(),
  slug: z.string(),
  version: z.number(),
  createdAt: z.string(),
  authorEmail: z.string(),
  summary: z.string().optional()
});
export type RevisionMeta = z.infer<typeof RevisionMetaSchema>;

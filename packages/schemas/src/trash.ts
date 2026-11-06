import { z } from 'zod';

export const TrashEntityTypeSchema = z.enum([
  'page',
  'post',
  'product',
  'blueprint',
  'blueprint-entry',
  'media'
]);

export type TrashEntityType = z.infer<typeof TrashEntityTypeSchema>;

export const TrashedItemSchema = z.object({
  trashId: z.string(),
  entityType: TrashEntityTypeSchema,
  blueprintSlug: z.string().optional(),
  originalId: z.string(),
  originalSlug: z.string(),
  title: z.string(),
  data: z.record(z.any()),
  deletedAt: z.string(),
  deletedBy: z.string().optional()
});

export type TrashedItem = z.infer<typeof TrashedItemSchema>;

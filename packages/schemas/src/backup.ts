import { z } from 'zod';

export const BackupMetadataSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  createdAt: z.string().datetime(),
  size: z.number().min(0),
  cmsVersion: z.string().default('1.0.0'),
  contentsCount: z.object({
    pages: z.number().default(0),
    posts: z.number().default(0),
    products: z.number().default(0),
    categories: z.number().default(0),
    media: z.number().default(0),
    revisions: z.number().default(0)
  })
});
export type BackupMetadata = z.infer<typeof BackupMetadataSchema>;

import { z } from 'zod';

export const MediaItemSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().min(0),
  width: z.number().optional(),
  height: z.number().optional(),
  alt: z.string().optional().default(''),
  url: z.string().min(1),
  createdAt: z.string().datetime()
});
export type MediaItem = z.infer<typeof MediaItemSchema>;

export const MediaManifestSchema = z.object({
  items: z.array(MediaItemSchema).default([])
});
export type MediaManifest = z.infer<typeof MediaManifestSchema>;

export const UpdateMediaSchema = z.object({
  alt: z.string().optional(),
  originalName: z.string().optional()
});
export type UpdateMediaInput = z.infer<typeof UpdateMediaSchema>;

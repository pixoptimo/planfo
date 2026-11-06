import { z } from 'zod';

export const ThemeManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string().default('1.0.0'),
  author: z.string().default('Planfo CMS'),
  description: z.string().default('A clean static design theme for Planfo CMS.'),
  thumbnail: z.string().optional().default(''),
  supportedPacks: z.array(z.string()).default(['pages', 'articles']),
  templates: z.array(z.string()).optional().default([])
});

export type ThemeManifest = z.infer<typeof ThemeManifestSchema>;

export const ThemeInfoSchema = ThemeManifestSchema.extend({
  isActive: z.boolean().default(false),
  isDefault: z.boolean().optional().default(false),
  path: z.string().optional(),
  templates: z.array(z.string()).default([])
});

export type ThemeInfo = z.infer<typeof ThemeInfoSchema>;

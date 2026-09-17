import { z } from 'zod';

export const SEOSchema = z.object({
  title: z.string().default(''),
  description: z.string().default(''),
  canonical: z.string().default(''),
  ogTitle: z.string().default(''),
  ogDescription: z.string().default(''),
  ogImage: z.string().default(''),
  robots: z.string().default('index,follow')
});

export type SEO = z.infer<typeof SEOSchema>;

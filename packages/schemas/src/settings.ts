import { z } from 'zod';
import { SEOSchema } from './seo.js';

export const SiteSettingsSchema = z.object({
  siteName: z.string().default('My Static CMS'),
  siteUrl: z.string().default('http://localhost:3000'),
  tagline: z.string().default('Blazing fast static website'),
  logo: z.string().optional().default(''),
  favicon: z.string().optional().default(''),
  defaultSEO: SEOSchema.default({
    title: 'My Static CMS',
    description: 'A modern, blazing fast static website',
    robots: 'index,follow'
  }),
  socialLinks: z.object({
    twitter: z.string().optional().default(''),
    facebook: z.string().optional().default(''),
    instagram: z.string().optional().default(''),
    github: z.string().optional().default(''),
    linkedin: z.string().optional().default('')
  }).default({}),
  analyticsId: z.string().optional().default(''),
  timezone: z.string().default('UTC'),
  language: z.string().default('en'),
  footerText: z.string().default('© 2026 Static CMS. All rights reserved.'),
  updatedAt: z.string().datetime().optional()
});
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;

export const UpdateSiteSettingsSchema = SiteSettingsSchema.partial();
export type UpdateSiteSettingsInput = z.infer<typeof UpdateSiteSettingsSchema>;

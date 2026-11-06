import { z } from 'zod';

export interface MenuItem {
  id: string;
  label: string;
  url?: string;
  target?: '_self' | '_blank';
  noLink?: boolean;
  children?: MenuItem[];
}

export const MenuItemSchema: z.ZodType<MenuItem> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    label: z.string().min(1, 'Label is required'),
    url: z.string().optional().default(''),
    target: z.enum(['_self', '_blank']).optional().default('_self'),
    noLink: z.boolean().optional().default(false),
    children: z.array(MenuItemSchema).optional().default([])
  })
);

export const MenuSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Menu name is required'),
  slug: z.string().min(1, 'Menu slug is required'),
  location: z.string().optional().default(''),
  locations: z.array(z.string()).optional().default([]),
  items: z.array(MenuItemSchema).default([]),
  updatedAt: z.string().datetime()
});
export type Menu = z.infer<typeof MenuSchema>;

export const CreateMenuSchema = z.object({
  name: z.string().min(1, 'Menu name is required'),
  slug: z.string().min(1, 'Menu slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format').optional(),
  location: z.string().optional().default(''),
  locations: z.array(z.string()).optional().default([]),
  items: z.array(MenuItemSchema).optional().default([])
});
export type CreateMenuInput = z.infer<typeof CreateMenuSchema>;

export const UpdateMenuSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  locations: z.array(z.string()).optional(),
  items: z.array(MenuItemSchema).optional()
});
export type UpdateMenuInput = z.infer<typeof UpdateMenuSchema>;

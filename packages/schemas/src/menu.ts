import { z } from 'zod';

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  target?: '_self' | '_blank';
  children?: MenuItem[];
}

export const MenuItemSchema: z.ZodType<MenuItem> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    label: z.string().min(1, 'Label is required'),
    url: z.string().min(1, 'URL is required'),
    target: z.enum(['_self', '_blank']).optional().default('_self'),
    children: z.array(MenuItemSchema).optional().default([])
  })
);

export const MenuSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Menu name is required'),
  slug: z.string().min(1, 'Menu slug is required'),
  items: z.array(MenuItemSchema).default([]),
  updatedAt: z.string().datetime()
});
export type Menu = z.infer<typeof MenuSchema>;

export const UpdateMenuSchema = z.object({
  name: z.string().min(1).optional(),
  items: z.array(MenuItemSchema)
});
export type UpdateMenuInput = z.infer<typeof UpdateMenuSchema>;

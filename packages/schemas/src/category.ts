import { z } from 'zod';

export const CategoryTypeSchema = z.enum(['post', 'product']);
export type CategoryType = z.infer<typeof CategoryTypeSchema>;

export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  type: CategoryTypeSchema.default('post'),
  description: z.string().optional().default(''),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Category = z.infer<typeof CategorySchema>;

export const CategoriesFileSchema = z.object({
  categories: z.array(CategorySchema).default([])
});
export type CategoriesFile = z.infer<typeof CategoriesFileSchema>;

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  type: CategoryTypeSchema.default('post'),
  description: z.string().optional().default('')
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  type: CategoryTypeSchema.optional(),
  description: z.string().optional()
});
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'editor', 'author']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  passwordHash: z.string().min(1),
  role: UserRoleSchema,
  name: z.string().optional().default(''),
  active: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type User = z.infer<typeof UserSchema>;

export const UsersFileSchema = z.object({
  users: z.array(UserSchema)
});
export type UsersFile = z.infer<typeof UsersFileSchema>;

export const LoginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: UserRoleSchema,
  name: z.string().optional().default(''),
  active: z.boolean().default(true)
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: UserRoleSchema.optional(),
  name: z.string().optional(),
  active: z.boolean().optional()
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime()
});
export type Session = z.infer<typeof SessionSchema>;

export const PermissionEnum = z.enum([
  'pages.read', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish',
  'posts.read', 'posts.create', 'posts.update', 'posts.delete', 'posts.publish',
  'products.read', 'products.create', 'products.update', 'products.delete', 'products.publish',
  'media.read', 'media.upload', 'media.delete',
  'categories.read', 'categories.create', 'categories.update', 'categories.delete',
  'menus.read', 'menus.update',
  'settings.read', 'settings.update',
  'users.read', 'users.create', 'users.update', 'users.delete',
  'revisions.read', 'revisions.restore',
  'backups.read', 'backups.create', 'backups.restore', 'backups.delete',
  'publish.all'
]);
export type Permission = z.infer<typeof PermissionEnum>;

export const RolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'pages.read', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish',
    'posts.read', 'posts.create', 'posts.update', 'posts.delete', 'posts.publish',
    'products.read', 'products.create', 'products.update', 'products.delete', 'products.publish',
    'media.read', 'media.upload', 'media.delete',
    'categories.read', 'categories.create', 'categories.update', 'categories.delete',
    'menus.read', 'menus.update',
    'settings.read', 'settings.update',
    'users.read', 'users.create', 'users.update', 'users.delete',
    'revisions.read', 'revisions.restore',
    'backups.read', 'backups.create', 'backups.restore', 'backups.delete',
    'publish.all'
  ],
  editor: [
    'pages.read', 'pages.create', 'pages.update', 'pages.publish',
    'posts.read', 'posts.create', 'posts.update', 'posts.publish',
    'products.read', 'products.create', 'products.update', 'products.publish',
    'media.read', 'media.upload', 'media.delete',
    'categories.read', 'categories.create', 'categories.update',
    'menus.read', 'menus.update',
    'settings.read',
    'revisions.read', 'revisions.restore',
    'publish.all'
  ],
  author: [
    'pages.read',
    'posts.read', 'posts.create', 'posts.update',
    'products.read',
    'media.read', 'media.upload',
    'categories.read',
    'menus.read'
  ]
};

import { z } from 'zod';

export const ContentBlockTypeSchema = z.enum([
  'heading',
  'paragraph',
  'blockquote',
  'list',
  'image',
  'button',
  'table',
  'callout',
  'divider',
  'code'
]);
export type ContentBlockType = z.infer<typeof ContentBlockTypeSchema>;

export const HeadingBlockSchema = z.object({
  id: z.string(),
  type: z.literal('heading'),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]).default(2),
  text: z.string().default('')
});

export const ParagraphBlockSchema = z.object({
  id: z.string(),
  type: z.literal('paragraph'),
  text: z.string().default('')
});

export const BlockquoteBlockSchema = z.object({
  id: z.string(),
  type: z.literal('blockquote'),
  text: z.string().default(''),
  citation: z.string().optional().default('')
});

export const ListBlockSchema = z.object({
  id: z.string(),
  type: z.literal('list'),
  style: z.enum(['ordered', 'unordered']).default('unordered'),
  items: z.array(z.string()).default([])
});

export const ImageBlockSchema = z.object({
  id: z.string(),
  type: z.literal('image'),
  url: z.string().default(''),
  alt: z.string().default(''),
  caption: z.string().optional().default(''),
  width: z.number().optional(),
  height: z.number().optional()
});

export const ButtonBlockSchema = z.object({
  id: z.string(),
  type: z.literal('button'),
  text: z.string().default('Click Here'),
  url: z.string().default('#'),
  variant: z.enum(['primary', 'secondary', 'outline']).default('primary'),
  target: z.enum(['_self', '_blank']).default('_self')
});

export const TableBlockSchema = z.object({
  id: z.string(),
  type: z.literal('table'),
  headers: z.array(z.string()).default([]),
  rows: z.array(z.array(z.string())).default([])
});

export const CalloutBlockSchema = z.object({
  id: z.string(),
  type: z.literal('callout'),
  variant: z.enum(['info', 'warning', 'success', 'error']).default('info'),
  title: z.string().optional().default(''),
  text: z.string().default('')
});

export const DividerBlockSchema = z.object({
  id: z.string(),
  type: z.literal('divider')
});

export const CodeBlockSchema = z.object({
  id: z.string(),
  type: z.literal('code'),
  language: z.string().default('plaintext'),
  code: z.string().default('')
});

export const ContentBlockSchema = z.discriminatedUnion('type', [
  HeadingBlockSchema,
  ParagraphBlockSchema,
  BlockquoteBlockSchema,
  ListBlockSchema,
  ImageBlockSchema,
  ButtonBlockSchema,
  TableBlockSchema,
  CalloutBlockSchema,
  DividerBlockSchema,
  CodeBlockSchema
]);
export type ContentBlock = z.infer<typeof ContentBlockSchema>;

export const StructuredContentSchema = z.object({
  blocks: z.array(ContentBlockSchema).default([])
});
export type StructuredContent = z.infer<typeof StructuredContentSchema>;

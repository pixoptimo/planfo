/**
 * Converts text into a clean, URL-safe slug.
 * Mirrors the server-side @cms/utils slugify implementation.
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFKD') // Normalize accented unicode characters (e.g. é -> e)
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars (excluding space and hyphen)
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with single hyphen
    .replace(/^-+|-+$/g, ''); // Strip leading and trailing hyphens
}

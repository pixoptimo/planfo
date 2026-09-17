/**
 * Converts a string into a clean, URL-safe slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFKD') // Normalize accented unicode characters
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars
    .replace(/[\s_-]+/g, '-') // Swap spaces/underscores for single hyphen
    .replace(/^-+|-+$/g, ''); // Strip leading and trailing hyphens
}

/**
 * Ensures a slug is unique by appending an incrementing counter if needed.
 */
export function makeUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
  currentId?: string,
  existingItems?: Array<{ id: string; slug: string }>
): string {
  let targetSlug = baseSlug || 'item';
  let counter = 1;

  while (existingSlugs.includes(targetSlug)) {
    if (currentId && existingItems) {
      const match = existingItems.find((item) => item.slug === targetSlug);
      if (match && match.id === currentId) {
        break;
      }
    }
    counter++;
    targetSlug = `${baseSlug}-${counter}`;
  }

  return targetSlug;
}

/**
 * Resolves a media or image URL to ensure proper root-relative or absolute path
 * in the admin panel regardless of current sub-route depth.
 */
export function getMediaUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  // Ensure root-relative leading slash so that /admin/blueprints/... does not resolve relative to subroutes
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

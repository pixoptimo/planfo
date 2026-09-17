import path from 'node:path';

/**
 * Validates and resolves a relative or sub-path against an allowed root directory.
 * Throws an error if the path attempts to escape the root directory (path traversal).
 */
export function safeResolvePath(rootDir: string, targetPath: string): string {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(resolvedRoot, targetPath);

  // Ensure resolvedTarget starts with resolvedRoot
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Access Denied: Path traversal detected for "${targetPath}"`);
  }

  return resolvedTarget;
}

/**
 * Sanitizes a filename to ensure it is safe from traversal and invalid characters.
 */
export function sanitizeFilename(filename: string): string {
  const base = path.basename(filename);
  // Remove dangerous chars, keep alphanumerics, dots, hyphens, underscores
  const clean = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!clean || clean === '.' || clean === '..') {
    return `file_${Date.now()}`;
  }
  return clean;
}

/**
 * Validates that a slug contains only safe URL characters.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

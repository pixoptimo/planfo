import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env if present
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CMS_HOST: z.string().default('localhost'),
  CMS_PORT: z.coerce.number().default(4000),
  SITE_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_URL: z.string().url().default('http://localhost:5173'),
  
  // Storage & paths
  STORAGE_PATH: z.string().default('./storage'),
  MEDIA_PATH: z.string().default('./storage/media'),
  CONTENT_PATH: z.string().default('./storage/content'),
  REVISION_PATH: z.string().default('./storage/revisions'),
  SESSION_PATH: z.string().default('./storage/sessions'),
  SETTINGS_PATH: z.string().default('./storage/settings'),
  BACKUP_PATH: z.string().default('./storage/backups'),

  OUTPUT_PATH: z.string().default('./generated/website'),
  TEMPLATES_PATH: z.string().default('./templates'),

  // Security
  COOKIE_SECURE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 characters').default('cms_cookie_secret_dev_key_32_chars_long_minimum_safe!'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(10)
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const rawConfig = parsed.data;

import fs from 'node:fs';

// Find project root (look for root package.json with workspaces)
function findWorkspaceRoot(startDir: string): string {
  let current = startDir;
  while (current !== path.dirname(current)) {
    const pkgPath = path.join(current, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.workspaces) {
          return current;
        }
      } catch {}
    }
    current = path.dirname(current);
  }
  return startDir;
}

const workspaceRoot = findWorkspaceRoot(process.cwd());

// Resolve all relative paths against workspaceRoot
export const config = {
  ...rawConfig,
  STORAGE_PATH: path.resolve(workspaceRoot, rawConfig.STORAGE_PATH),
  MEDIA_PATH: path.resolve(workspaceRoot, rawConfig.MEDIA_PATH),
  CONTENT_PATH: path.resolve(workspaceRoot, rawConfig.CONTENT_PATH),
  REVISION_PATH: path.resolve(workspaceRoot, rawConfig.REVISION_PATH),
  SESSION_PATH: path.resolve(workspaceRoot, rawConfig.SESSION_PATH),
  SETTINGS_PATH: path.resolve(workspaceRoot, rawConfig.SETTINGS_PATH),
  BACKUP_PATH: path.resolve(workspaceRoot, rawConfig.BACKUP_PATH),
  OUTPUT_PATH: path.resolve(workspaceRoot, rawConfig.OUTPUT_PATH),
  TEMPLATES_PATH: path.resolve(workspaceRoot, rawConfig.TEMPLATES_PATH)
};

export type AppConfig = typeof config;

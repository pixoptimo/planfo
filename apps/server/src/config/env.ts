import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env if present
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CMS_HOST: z.string().default('localhost'),
  CMS_PORT: z.coerce.number().default(4000),
  SITE_URL: z.string().url().default('http://localhost:4000'),
  ADMIN_URL: z.string().url().default('http://localhost:4000'),
  
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
  THEMES_PATH: z.string().default('./themes'),

  // Security
  COOKIE_SECURE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 characters').default('cms_cookie_secret_dev_key_32_chars_long_minimum_safe!'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(5000),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(100)
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

export const workspaceRoot = findWorkspaceRoot(process.cwd());

function detectPlanfoProject(): { projectDir: string; storageDir: string } | null {
  const envDir = process.env.PLANFO_PROJECT_DIR;
  if (envDir) {
    const directPlanfo = path.join(envDir, 'planfo');
    const directDotPlanfo = path.join(envDir, '.planfo');
    if (fs.existsSync(directPlanfo)) return { projectDir: envDir, storageDir: directPlanfo };
    if (fs.existsSync(directDotPlanfo)) return { projectDir: envDir, storageDir: directDotPlanfo };
    return { projectDir: envDir, storageDir: directPlanfo };
  }

  const cur = process.cwd();
  if (fs.existsSync(path.join(cur, 'planfo'))) return { projectDir: cur, storageDir: path.join(cur, 'planfo') };
  if (fs.existsSync(path.join(cur, '.planfo'))) return { projectDir: cur, storageDir: path.join(cur, '.planfo') };

  return null;
}

const activePlanfo = detectPlanfoProject();

// Resolve all relative paths against workspaceRoot
export const config = {
  ...rawConfig,
  WORKSPACE_ROOT: workspaceRoot,
  ADMIN_DIST_PATH: path.resolve(workspaceRoot, 'apps/admin/dist'),
  STORAGE_PATH: activePlanfo ? activePlanfo.storageDir : path.resolve(workspaceRoot, rawConfig.STORAGE_PATH),
  MEDIA_PATH: activePlanfo ? path.join(activePlanfo.storageDir, 'media') : path.resolve(workspaceRoot, rawConfig.MEDIA_PATH),
  CONTENT_PATH: activePlanfo ? path.join(activePlanfo.storageDir, 'content') : path.resolve(workspaceRoot, rawConfig.CONTENT_PATH),
  REVISION_PATH: activePlanfo ? path.join(activePlanfo.storageDir, 'revisions') : path.resolve(workspaceRoot, rawConfig.REVISION_PATH),
  SESSION_PATH: activePlanfo ? path.join(activePlanfo.storageDir, 'sessions') : path.resolve(workspaceRoot, rawConfig.SESSION_PATH),
  SETTINGS_PATH: activePlanfo ? activePlanfo.storageDir : path.resolve(workspaceRoot, rawConfig.SETTINGS_PATH),
  BACKUP_PATH: activePlanfo ? path.join(activePlanfo.storageDir, 'backups') : path.resolve(workspaceRoot, rawConfig.BACKUP_PATH),
  OUTPUT_PATH: activePlanfo ? path.join(activePlanfo.projectDir, 'generated') : path.resolve(workspaceRoot, rawConfig.OUTPUT_PATH),
  TEMPLATES_PATH: activePlanfo ? path.join(activePlanfo.storageDir, 'themes') : path.resolve(workspaceRoot, rawConfig.TEMPLATES_PATH),
  THEMES_PATH: activePlanfo ? path.join(activePlanfo.storageDir, 'themes') : path.resolve(workspaceRoot, rawConfig.THEMES_PATH)
};

export type AppConfig = typeof config;

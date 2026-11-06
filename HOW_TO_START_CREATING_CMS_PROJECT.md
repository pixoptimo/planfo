# How to Start Creating the CMS Project — Architectural & Engineering Guide
### A Step-by-Step Blueprint for Building a Production-Ready, Database-Free Static CMS

> **Document Version:** 1.0.0  
> **Target Audience:** System Architects, Full-Stack Engineers, and Developers starting or extending the Planfo CMS platform.  
> **Core Principle:** Zero Database • Atomic Filesystem Storage • 100% Static Web Output • Enterprise Security

---

## 📑 Table of Contents

1. [Executive Overview & Architectural Philosophy](#1-executive-overview--architectural-philosophy)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Monorepo Structure & Workspace Anatomy](#3-monorepo-structure--workspace-anatomy)
4. [Phase 1: Project Setup & Monorepo Initialization](#4-phase-1-project-setup--monorepo-initialization)
5. [Phase 2: Data Modeling with Schemas & TypeScript Types](#5-phase-2-data-modeling-with-schemas--typescript-types)
6. [Phase 3: Core Utility Engine (Atomic I/O, Locks, Security)](#6-phase-3-core-utility-engine-atomic-io-locks-security)
7. [Phase 4: Filesystem Database & Storage Engine](#7-phase-4-filesystem-database--storage-engine)
8. [Phase 5: Authenticated Express API & RBAC Server](#8-phase-5-authenticated-express-api--rbac-server)
9. [Phase 6: Static Site Generator (SSG) Engine & EJS Templates](#9-phase-6-static-site-generator-ssg-engine--ejs-templates)
10. [Phase 7: React + Vite + Tailwind Admin Dashboard](#10-phase-7-react--vite--tailwind-admin-dashboard)
11. [Phase 8: Project Bootstrapping, Seed Data & CLI Tools](#11-phase-8-project-bootstrapping-seed-data--cli-tools)
12. [Phase 9: Step-by-Step Implementation Roadmap (Day 1 to Launch)](#12-phase-9-step-by-step-implementation-roadmap-day-1-to-launch)
13. [Phase 10: Production Deployment & Hosting Strategies](#13-phase-10-production-deployment--hosting-strategies)

---

## 1. Executive Overview & Architectural Philosophy

When building a traditional CMS (like WordPress, Drupal, or Strapi), you are tied to a relational database (MySQL/PostgreSQL) or a document store (MongoDB). Every web visitor request triggers database queries, server-side caching layers, and runtime PHP/Node.js processes. This introduces database bottlenecks, SQL injection vulnerabilities, continuous maintenance overhead, and hosting complexity.

### The Decoupled Static CMS Model
The **Planfo Static CMS** solves this problem by decoupling the content management system from the public website:

```text
┌──────────────────────────────────────────────────────────┐
│                   CMS RUNTIME (Private)                  │
│                                                          │
│   [Admin Dashboard] ──HTTP──► [Authenticated Express API]│
│                                           │              │
│                                           ▼              │
│                             [Filesystem JSON Store]      │
│                                           │              │
│                                           ▼              │
│                             [Static Site Generator]      │
└───────────────────────────────────────────┼──────────────┘
                                            │ Atomic Build Swap
                                            ▼
┌──────────────────────────────────────────────────────────┐
│                  PUBLIC WEBSITE (100% Static)            │
│                                                          │
│   [Generated HTML / CSS / Assets] ──► [CDN / Nginx / S3] │
│                                           │              │
│                                           ▼              │
│                                    [Web Visitor]         │
└──────────────────────────────────────────────────────────┘
```

### Core Tenets:
1. **Zero Database Dependency:** Content, revisions, menus, taxonomies, and users are saved as structured, human-readable JSON files in `storage/`.
2. **Git-Friendly & Portable:** Your entire website content lives in text files. You can commit content changes to Git, branch, merge, or clone across machines.
3. **Impenetrable Public Security:** The public website runs on pure static files (HTML, CSS, JS, images). There is no database to hack, no SQL injection, and no Node.js runtime exposed to public visitors.
4. **Atomic Concurrency:** Filesystem writes use atomic temporary writes (`.tmp`) plus rename operations, backed by in-process asynchronous mutex locks.
5. **Instant Publishing via Atomic Swap:** The Static Site Generator compiles to an isolated staging directory (`.staging-timestamp`), verifies build health, and performs an atomic directory swap into `generated/website/` with zero downtime.

---

## 2. High-Level System Architecture

The project is structured into three primary domains:

| Domain | Module / App | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **Shared Libraries** | `packages/schemas`<br>`packages/types`<br>`packages/utils` | TypeScript, Zod, Sanitize-HTML | Shared contracts, schema validation, atomic I/O, security sanitizers, concurrency locks. |
| **Backend & Engine** | `apps/server`<br>`apps/generator` | Express, Argon2id, Multer, EJS | RESTful API, authentication, RBAC, storage management, and template compilation engine. |
| **Frontend & UI** | `apps/admin`<br>`templates/` | React, Vite, Tailwind CSS, Lucide | Admin UI dashboard, structured block editor, media library, and semantic EJS templates. |

---

## 3. Monorepo Structure & Workspace Anatomy

Here is the production-grade directory layout used by the project:

```text
cms-monorepo/
├── apps/
│   ├── admin/                    # React 18 + Vite + Tailwind CSS admin UI
│   │   ├── src/
│   │   │   ├── components/       # UI components (Modal, BlockEditor, Navbar, Sidebar)
│   │   │   ├── context/          # AuthContext, ToastContext
│   │   │   ├── pages/            # Dashboard, Pages, Posts, Products, Media, Settings
│   │   │   └── api/              # API client methods with credentials
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── generator/                # Static Site Generation Engine
│   │   ├── src/
│   │   │   ├── compiler.ts       # EJS template compilation
│   │   │   ├── generator.ts      # Site generation orchestrator
│   │   │   ├── sitemap.ts        # sitemap.xml & robots.txt generator
│   │   │   └── cli.ts            # Command-line generator entrypoint
│   │   └── package.json
│   │
│   └── server/                   # Express REST API & Filesystem Storage
│       ├── src/
│       │   ├── controllers/      # Route controllers (Auth, Content, Media, Publish)
│       │   ├── middleware/       # Auth guard, RBAC, Rate limiting, Upload validation
│       │   ├── storage/          # BaseStorageManager & entity storage classes
│       │   ├── server.ts         # Express app initialization
│       │   └── config.ts         # Environment and path configurations
│       └── package.json
│
├── packages/
│   ├── schemas/                  # Zod validation schemas
│   │   ├── src/
│   │   │   ├── auth.ts           # User, Login, Session schemas
│   │   │   ├── content.ts        # Page, Post, Product, Category schemas
│   │   │   ├── media.ts          # Media item & upload schemas
│   │   │   ├── settings.ts       # Site identity, SEO, social links
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── types/                    # Shared TypeScript types & interfaces
│   │   ├── src/
│   │   │   ├── api.ts            # API responses, requests
│   │   │   ├── content.ts        # Content entity types
│   │   │   └── template.ts       # Template rendering contexts
│   │   └── package.json
│   │
│   └── utils/                    # Reusable utility functions
│       ├── src/
│       │   ├── atomicFs.ts       # Safe atomic file read/write & directory swap
│       │   ├── lock.ts           # Concurrency file mutex lock
│       │   ├── pathSecurity.ts   # Directory traversal defense (safeResolvePath)
│       │   ├── sanitizer.ts      # HTML & Block content sanitizer
│       │   ├── slugify.ts        # URL-safe slug generator
│       │   └── logger.ts         # Secret-scrubbed JSON logger
│       └── package.json
│
├── storage/                      # Flat-file JSON database (created at runtime)
│   ├── auth/users.json           # User credentials & hashed passwords
│   ├── content/
│   │   ├── pages/                # Individual page JSON files
│   │   ├── posts/                # Blog post JSON files
│   │   ├── products/             # Product catalog JSON files
│   │   ├── categories/           # Category taxonomy JSON files
│   │   └── menus/                # Navigation structure JSON files
│   ├── media/                    # Uploaded media assets
│   ├── revisions/                # Historical version snapshots
│   ├── sessions/                 # Active HTTP-only session tokens
│   ├── settings/site.json        # Global site settings & metadata
│   └── backups/                  # 1-click exported ZIP archives
│
├── templates/                    # Semantic HTML/EJS site templates
│   ├── layout.html               # Master layout wrapper (header, nav, footer)
│   ├── home.html                 # Homepage template
│   ├── assets/style.css          # Public CSS stylesheet
│   ├── page/default.html         # Standard page layout
│   ├── post/default.html         # Blog article single view
│   ├── post/list.html            # Blog archive list
│   ├── product/default.html      # Product detail view
│   └── product/list.html         # Product catalog list
│
├── generated/
│   └── website/                  # Live production-ready static output
│
├── scripts/
│   ├── create-admin.ts           # Interactive admin account setup
│   └── seed-sample-content.ts    # Demo data populator
│
├── .env.example
├── package.json                  # Root monorepo workspace definition
├── tsconfig.base.json            # Shared TypeScript configuration
└── vitest.config.ts              # Automated test runner config
```

---

## 4. Phase 1: Project Setup & Monorepo Initialization

### 1. Initialize Root Workspace
Create the root directory and initialize the npm workspace configuration:

```bash
mkdir cms-project && cd cms-project
git init
npm init -y
```

### 2. Configure `package.json` for Workspaces
Edit the root `package.json` to enable npm workspaces:

```json
{
  "name": "static-cms-monorepo",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "concurrently -n \"SERVER,ADMIN\" -c \"blue,green\" \"npm:dev:server\" \"npm:dev:admin\"",
    "dev:server": "npm run dev --workspace=@cms/server",
    "dev:admin": "npm run dev --workspace=@cms/admin",
    "build": "npm run build --workspaces --if-present",
    "start": "npm run start --workspace=@cms/server",
    "generate": "npx tsx apps/generator/src/cli.ts",
    "serve:website": "npx serve generated/website -p 8080",
    "create-admin": "npx tsx scripts/create-admin.ts",
    "seed": "npx tsx scripts/seed-sample-content.ts",
    "test": "vitest run"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "concurrently": "^10.0.5",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

### 3. Setup Shared `tsconfig.base.json`
Create a base TypeScript configuration for consistent compilation across all workspaces:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true
  }
}
```

---

## 5. Phase 2: Data Modeling with Schemas & TypeScript Types

Always define your data contracts **before** writing server or UI code. We use **Zod** for runtime schema validation and TypeScript type inference.

### 1. Why Schema-First?
- Every file read from the disk is validated against a Zod schema. If a file is tampered with or corrupted, the system catches it immediately.
- Client requests undergo automatic runtime validation.
- TypeScript types are inferred directly from Zod via `z.infer<typeof Schema>`, eliminating duplication between types and validators.

### 2. Core Schemas (`packages/schemas/src/`)

#### Content Schema (`content.ts`)
```typescript
import { z } from 'zod';

// Rich Content Block Structure
export const ContentBlockSchema = z.object({
  id: z.string(),
  type: z.enum([
    'heading',
    'paragraph',
    'blockquote',
    'list',
    'image',
    'button',
    'callout',
    'table',
    'code',
    'divider'
  ]),
  data: z.record(z.any())
});

// Common SEO Fields
export const SeoSchema = z.object({
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  noIndex: z.boolean().default(false)
});

// Page Entity Schema
export const PageSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  template: z.string().default('default'),
  blocks: z.array(ContentBlockSchema).default([]),
  seo: SeoSchema.default({}),
  status: z.enum(['draft', 'published']).default('draft'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// Post Entity Schema (with Author, Tags, and Category)
export const PostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().max(300).default(''),
  featuredImage: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  authorId: z.string(),
  blocks: z.array(ContentBlockSchema).default([]),
  seo: SeoSchema.default({}),
  status: z.enum(['draft', 'published']).default('draft'),
  publishedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// Product Entity Schema
export const ProductSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().min(1),
  price: z.number().nonnegative(),
  currency: z.string().default('USD'),
  shortDescription: z.string().default(''),
  gallery: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  blocks: z.array(ContentBlockSchema).default([]),
  seo: SeoSchema.default({}),
  status: z.enum(['draft', 'published']).default('draft'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
```

#### Authentication & User Schema (`auth.ts`)
```typescript
import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'editor', 'author']);

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2),
  passwordHash: z.string(), // Argon2id hash
  role: UserRoleSchema,
  active: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
```

---

## 6. Phase 3: Core Utility Engine (Atomic I/O, Locks, Security)

The `@cms/utils` package is the bedrock of system stability and filesystem security.

### 1. Atomic File System (`atomicFs.ts`)
Prevent file corruption during server crashes or concurrent writes:
- **Temporary Write Pattern:** Data is written to `filepath.tmp.[random]`.
- **Atomic Rename:** `fs.promises.rename(tmpPath, filepath)` replaces the target file atomically at the operating system level (POSIX atomic operation).
- **Directory Assurance:** Directories are recursively created if missing before writing.

```typescript
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export async function atomicWriteFile(filePath: string, content: string | Buffer): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  const tempPath = `${filePath}.tmp.${crypto.randomBytes(6).toString('hex')}`;
  try {
    await fs.writeFile(tempPath, content, 'utf8');
    await fs.rename(tempPath, filePath);
  } catch (err) {
    try { await fs.unlink(tempPath); } catch {}
    throw err;
  }
}

export async function atomicWriteJson<T>(filePath: string, data: T): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  await atomicWriteFile(filePath, json);
}

export async function atomicReadJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error: any) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}
```

### 2. Concurrency Lock Manager (`lock.ts`)
Ensure that two concurrent requests do not write to the same JSON file simultaneously:

```typescript
export class LockManager {
  private static locks: Map<string, Promise<void>> = new Map();

  public static async runWithLock<T>(key: string, task: () => Promise<T>): Promise<T> {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.locks.set(key, lockPromise);

    try {
      return await task();
    } finally {
      this.locks.delete(key);
      releaseLock!();
    }
  }
}
```

### 3. Path Traversal Defense (`pathSecurity.ts`)
Malicious slugs or filenames must never navigate outside the designated directory:

```typescript
import path from 'node:path';

export function safeResolvePath(baseDir: string, relativePath: string): string {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, relativePath);

  if (!resolvedTarget.startsWith(resolvedBase + path.sep) && resolvedTarget !== resolvedBase) {
    throw new Error(`Security Violation: Path traversal detected outside ${baseDir}`);
  }

  return resolvedTarget;
}
```

### 4. HTML & Rich Block Sanitizer (`sanitizer.ts`)
Uses `sanitize-html` to scrub user input and safely render block content into clean HTML:

```typescript
import sanitizeHtml from 'sanitize-html';

export function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'img', 'button', 'table']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'width', 'height'],
      a: ['href', 'target', 'rel'],
      button: ['class', 'data-*']
    }
  });
}
```

---

## 7. Phase 4: Filesystem Database & Storage Engine

The storage engine lives in `apps/server/src/storage/` and exposes a consistent CRUD API for filesystem entities.

### 1. `BaseStorageManager<T>`
```typescript
import path from 'node:path';
import fs from 'node:fs/promises';
import { z } from 'zod';
import { atomicReadJson, atomicWriteJson, safeResolvePath, LockManager } from '@cms/utils';

export abstract class BaseStorageManager<T extends { id: string }> {
  protected storageDir: string;
  protected schema: z.ZodSchema<T>;

  constructor(storageDir: string, schema: z.ZodSchema<T>) {
    this.storageDir = storageDir;
    this.schema = schema;
  }

  protected getFilePath(id: string): string {
    return safeResolvePath(this.storageDir, `${id}.json`);
  }

  public async getById(id: string): Promise<T | null> {
    const filePath = this.getFilePath(id);
    const data = await atomicReadJson<T>(filePath);
    if (!data) return null;
    return this.schema.parse(data);
  }

  public async getAll(): Promise<T[]> {
    await fs.mkdir(this.storageDir, { recursive: true });
    const files = await fs.readdir(this.storageDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const items: T[] = [];
    for (const file of jsonFiles) {
      const filePath = path.join(this.storageDir, file);
      const data = await atomicReadJson<T>(filePath);
      if (data) {
        try {
          items.push(this.schema.parse(data));
        } catch (err) {
          console.error(`Invalid schema in ${filePath}:`, err);
        }
      }
    }
    return items;
  }

  public async save(item: T): Promise<T> {
    const validated = this.schema.parse(item);
    const filePath = this.getFilePath(item.id);

    await LockManager.runWithLock(filePath, async () => {
      await atomicWriteJson(filePath, validated);
    });

    return validated;
  }

  public async delete(id: string): Promise<boolean> {
    const filePath = this.getFilePath(id);
    return await LockManager.runWithLock(filePath, async () => {
      try {
        await fs.unlink(filePath);
        return true;
      } catch (err: any) {
        if (err.code === 'ENOENT') return false;
        throw err;
      }
    });
  }
}
```

### 2. Specialized Storage Classes
Create dedicated managers extending `BaseStorageManager<T>`:
- `PageStorageManager`: Adds `.getBySlug(slug)` and slug collision checks.
- `PostStorageManager`: Adds filtering by category, tag, author, and status.
- `ProductStorageManager`: Adds filtering by SKU and price range.
- `RevisionStorageManager`: Takes a snapshot of content prior to update/publish for 1-click rollback.

---

## 8. Phase 5: Authenticated Express API & RBAC Server

The Express backend (`apps/server`) exposes secure endpoints and manages content lifecycles.

### 1. Essential Middlewares
- **Helmet:** Sets security headers (`X-Content-Type-Options`, `X-Frame-Options`, etc.).
- **CORS:** Configured with `credentials: true` and restricted to the `ADMIN_URL` origin.
- **Cookie-Parser:** Securely parses HTTP-only session cookies.
- **Express-Rate-Limit:** Prevents brute-force login attempts and API flooding.

### 2. Argon2id Password Hashing & Authentication
```typescript
import argon2 from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3
  });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return await argon2.verify(hash, plain);
}
```

### 3. Role-Based Access Control (RBAC) Middleware
```typescript
import { Request, Response, NextFunction } from 'express';

export function requireRole(allowedRoles: Array<'admin' | 'editor' | 'author'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
}
```

### 4. REST API Endpoints Route Map

```text
POST   /api/auth/login        # Authenticate, issue HTTP-only cookie
POST   /api/auth/logout       # Invalidate session, clear cookie
GET    /api/auth/me           # Get current user profile & role

GET    /api/pages             # List all pages (filtered by status)
POST   /api/pages             # Create new page
GET    /api/pages/:id         # Get page detail
PUT    /api/pages/:id         # Update page
DELETE /api/pages/:id         # Delete page

GET    /api/posts             # List blog posts (category, tag, status filter)
POST   /api/posts             # Create new blog post
PUT    /api/posts/:id         # Update post

GET    /api/products          # List catalog products
POST   /api/products          # Create product

POST   /api/media/upload      # Multer file upload (MIME validation, sanitize name)
GET    /api/media             # List uploaded media files

GET    /api/settings          # Get global site settings
PUT    /api/settings          # Update site settings

POST   /api/publish           # Trigger Static Site Generation & atomic swap
POST   /api/preview           # In-memory compile draft for live preview
POST   /api/backups/create    # 1-click ZIP snapshot of storage/
POST   /api/backups/restore   # Restore storage/ from ZIP archive
```

---

## 9. Phase 6: Static Site Generator (SSG) Engine & EJS Templates

The generator (`apps/generator`) transforms raw JSON data into a blazing-fast, static website.

### 1. Template Compilation Pipeline
1. **Load Data:** Read all published Pages, Posts, Products, Categories, Menus, and Settings.
2. **Setup Context:** Assemble navigation tree, global SEO, and active theme tokens.
3. **Compile Templates:** Render semantic HTML using EJS (`ejs.renderFile`).
4. **Generate Taxonomies:** Build archive pages (`/blog/category/:slug`).
5. **Generate SEO Assets:** Generate `sitemap.xml` with canonical URLs and `robots.txt`.
6. **Copy Static Assets:** Copy CSS, JavaScript, and Media into the output directory.

### 2. Zero-Downtime Atomic Staging Swap
Writing directly into the live public directory can result in visitors viewing partially generated pages. The generator resolves this using an **isolated staging swap**:

```typescript
import fs from 'node:fs/promises';
import path from 'node:path';

export async function publishStagingToLive(stagingDir: string, liveDir: string): Promise<void> {
  const backupDir = `${liveDir}.old.${Date.now()}`;

  // 1. If live directory exists, move to temporary backup
  try {
    await fs.rename(liveDir, backupDir);
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }

  // 2. Move staging directory to live
  try {
    await fs.rename(stagingDir, liveDir);
  } catch (err) {
    // Rollback if failure
    try { await fs.rename(backupDir, liveDir); } catch {}
    throw err;
  }

  // 3. Clean up old backup asynchronously
  try {
    await fs.rm(backupDir, { recursive: true, force: true });
  } catch {}
}
```

### 3. Template Structure (`templates/`)
- `layout.html`: Includes `<head>`, Open Graph meta tags, navigation menu, `<%- body %>`, and footer.
- `home.html`: Homepage showcase featuring hero, featured products, and latest blog posts.
- `page/default.html`: Standard content template rendering rich blocks.
- `post/default.html`: Article layout with author info, publication date, and tags.
- `product/default.html`: E-commerce catalog item with price, gallery, and specs.

---

## 10. Phase 7: React + Vite + Tailwind Admin Dashboard

The dashboard (`apps/admin`) delivers a clean, modern user experience for content editors.

### 1. Core Architecture
- **Vite:** Instant hot-module replacement and rapid bundling.
- **Tailwind CSS:** Responsive, accessible, and themeable UI styling.
- **React Router:** SPA routing with authentication guards.
- **Lucide Icons:** Clean, modern icon set.

### 2. Structured Block Content Editor
Instead of an unconstrained, error-prone WYSIWYG editor that generates bloated HTML, use a **structured block editor**:
- **Blocks Available:** Heading (H1–H6), Paragraph, Blockquote, Lists, Callout (Info/Warning), Image, Button, Table, Code Block, Divider.
- Editors can add, delete, edit, and reorder blocks easily.
- Output is stored as clean JSON blocks, rendered into sanitized HTML during generation.

### 3. Integrated Top-Bar Publish Modal
- A persistent "Publish Changes" button in the admin header.
- Triggers `POST /api/publish`.
- Displays real-time build logs, count of generated pages, elapsed build time, and a direct link to view the generated static site.

---

## 11. Phase 8: Project Bootstrapping, Seed Data & CLI Tools

### 1. Admin Bootstrapping CLI (`scripts/create-admin.ts`)
Allows initial setup of an administrative account via CLI:

```typescript
import readline from 'node:readline/promises';
import { hashPassword } from '../apps/server/src/utils/crypto.js';
import { UserStorageManager } from '../apps/server/src/storage/UserStorage.js';

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('=== Planfo CMS Admin Bootstrapper ===');

  const email = await rl.question('Admin Email: ');
  const name = await rl.question('Admin Name: ');
  const password = await rl.question('Admin Password: ');
  rl.close();

  const passwordHash = await hashPassword(password);
  const userStorage = new UserStorageManager('./storage/auth');

  await userStorage.create({
    email,
    name,
    passwordHash,
    role: 'admin',
    active: true
  });

  console.log(`✓ Admin user ${email} created successfully.`);
}

main();
```

### 2. Seed Data Script (`scripts/seed-sample-content.ts`)
Populates the store with:
- Global site settings (site title, tagline, logo).
- Main navigation menu with dropdown links.
- Sample Pages: "Home", "About Us", "Contact".
- Sample Categories & Blog Posts.
- Sample Products with gallery images and pricing.

---

## 12. Phase 9: Step-by-Step Implementation Roadmap (Day 1 to Launch)

Follow this execution sequence when building the project from scratch:

```text
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Workspace & Monorepo Setup                             │
│ • Root package.json with workspaces                             │
│ • tsconfig.base.json and Vitest setup                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ Step 2: Shared Contracts (@cms/schemas & @cms/types)            │
│ • Define ContentBlock, Page, Post, Product, User Zod schemas    │
│ • Export inferred TypeScript types                              │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ Step 3: Core Utilities (@cms/utils)                             │
│ • Implement atomicFs (atomicWrite, atomicRename)                │
│ • Implement LockManager (in-memory async file mutex)            │
│ • Implement safeResolvePath (path traversal protection)         │
│ • Implement sanitizer and slugifier                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ Step 4: Storage Layer (apps/server/src/storage)                 │
│ • Implement BaseStorageManager<T> with CRUD methods             │
│ • Implement PageStorage, PostStorage, ProductStorage, etc.      │
│ • Add RevisionStorageManager for snapshot rollbacks             │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ Step 5: Express API & Security (apps/server)                    │
│ • Express server with Helmet, CORS, Cookie-Parser, Rate-Limit   │
│ • Argon2id authentication & HTTP-only session cookies           │
│ • Implement RBAC middleware and CRUD controllers                │
│ • Implement Multer media upload handler                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ Step 6: Templates & SSG Engine (templates/ & apps/generator)    │
│ • Build semantic HTML EJS templates (layout, home, post, etc.)  │
│ • Build Generator class (extract JSON, compile EJS, sitemap)    │
│ • Implement atomic staging directory swap                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ Step 7: React Admin Dashboard (apps/admin)                      │
│ • Setup Vite + React + Tailwind CSS                             │
│ • Build AuthContext, Login page, and protected routes           │
│ • Build Block Content Editor and Media Library                  │
│ • Build Site Settings editor and 1-Click Publish Modal          │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ Step 8: CLI Tools & Verification                                │
│ • Create admin bootstrapper (scripts/create-admin.ts)           │
│ • Create demo seeder (scripts/seed-sample-content.ts)           │
│ • Run automated integration tests (npm test)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Phase 10: Production Deployment & Hosting Strategies

Because the CMS output is purely static, you get maximum deployment flexibility:

### 1. Hosting the Admin CMS Backend (`apps/server`)
- Run with Node.js on a lightweight VPS (Ubuntu, Debian), Docker container, or cloud app platform (Railway, Render, DigitalOcean App Platform).
- Use **PM2** or **systemd** for process management:
  ```bash
  pm2 start apps/server/dist/server.js --name "cms-api"
  ```
- Put Nginx or Caddy in front with SSL termination (`certbot`).
- Persistent volume: Ensure the `storage/` directory is mounted on persistent disk storage.

### 2. Hosting the Public Website (`generated/website/`)
Deploy the static output to any web hosting platform or CDN:

| Provider | Deployment Method | Advantages |
| :--- | :--- | :--- |
| **Cloudflare Pages** | Direct Git push or `wrangler pages deploy` | Zero cost, global edge network, instant cache invalidation |
| **Vercel / Netlify** | `vercel deploy --prod` or Netlify CLI | Seamless previews, automated SSL, global CDN |
| **AWS S3 + CloudFront**| `aws s3 sync generated/website s3://my-site` | Enterprise grade, ultra-low cost, high durability |
| **Nginx / Apache** | Simple `rsync` to `/var/www/html` | Full control, on-premise, no third-party dependencies |

### 3. Automated Webhook Deployment
Configure the CMS `POST /api/publish` endpoint to trigger an external webhook (e.g. GitHub Repository Dispatch, Cloudflare Pages Deploy Hook, or AWS S3 sync script) immediately after local generation completes.

---

## 💡 Summary & Quick Start Commands

There are **two different contexts** when working with this system:
1. **CMS Core Engine Monorepo** (The codebase building the CMS itself).
2. **Created Website Project** (A website project created via `planfo init` or `create-planfo`).

---

### Context A: Developing Inside the CMS Monorepo (`CMS Project/`)

Inside the core CMS development repository:

```bash
# 1. Install dependencies across all workspaces
npm install

# 2. Copy and configure environment variables
cp .env.example .env

# 3. Create your first administrator account
npm run create-admin

# 4. (Optional) Seed demonstration content
npm run seed

# 5. Start development servers (Server on :4000, Admin on :5173)
npm run dev

# 6. Build the static site and preview it
npm run generate
npm run serve:website
```

The CMS Admin will be accessible at `http://localhost:5173`, and the compiled static website will be served at `http://localhost:8080`.

---

### Context B: Running a Website Project Created with Planfo (e.g. `UICells/CMS/`)

When you create a website with `create-planfo` or `planfo init`, the project structure is:
```text
my-website/
├── planfo/
│   ├── config.json         # Project configuration
│   ├── settings.json       # Site title, metadata & settings
│   ├── content/pages/      # Human-readable JSON pages
│   ├── media/              # Media assets
│   └── themes/             # Design themes
├── generated/              # Compiled static HTML output
└── README.md
```

> [!IMPORTANT]
> **Planfo website projects intentionally do NOT have a `package.json` file!**  
> Running `npm run dev` inside a created website project will fail with:  
> `npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '.../package.json'`.

To start the CMS dashboard for your website project, use the **`planfo`** CLI instead of `npm`:

```bash
# 1. Start the CMS Dashboard for your website
planfo dev

# Or specify a custom port:
planfo dev --port 3000

# 2. Build the static website into generated/
planfo build

# 3. Preview the compiled static website
planfo preview
```

#### How to Enable the `planfo` Command on Your Mac

If your terminal says `command not found: planfo`:

**Option 1: Link `planfo` globally from the CMS Monorepo:**
```bash
cd "/Users/bejoynj/Downloads/Static CMS/CMS Project"
npm link packages/create-planfo
```
Now `planfo dev` and `planfo build` will work anywhere on your machine!

**Option 2: Run directly from your project directory via node:**
```bash
node "/Users/bejoynj/Downloads/Static CMS/CMS Project/packages/create-planfo/bin/planfo.js" dev
```

**Option 3: Run from the CMS Monorepo targeting your project folder:**
```bash
cd "/Users/bejoynj/Downloads/Static CMS/CMS Project"
npm run planfo -- dev "/Users/bejoynj/Downloads/Pixoptimo/Templates/UICells/CMS"
```



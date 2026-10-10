# Production-Ready File-Based Static CMS — Walkthrough

We have designed, implemented, tested, and verified a **Production-Ready File-Based Static CMS** built with TypeScript, Node.js, Express, React, Vite, Tailwind CSS, Zod, and Argon2id.

---

## 🏛️ System Architecture Summary

The CMS manages content using the filesystem as the persistent store with atomic file operations, while the generated public website is **100% static HTML/CSS/assets** requiring **zero database or CMS API at runtime**.

```text
Admin Dashboard (React + Vite + Tailwind CSS)
            │
            ▼ (HTTP-only Cookies / RBAC / CSRF / Rate Limiting)
 Authenticated CMS API (Node.js + Express)
            │
            ▼ (Atomic .tmp writes, locking, path traversal protection)
 Filesystem Storage (storage/)
            │
            ▼ (Atomic staging swap, template compiler, validation)
 Static Site Generator (apps/generator)
            │
            ▼ (HTML, CSS, Assets, sitemap.xml, robots.txt)
 Generated Website (generated/website)
            │
            ▼
 Static Hosting (Nginx / CDN / S3 / Netlify / Vercel)
            │
            ▼
     Public Visitor
```

---

## 📦 What Was Built

### 1. Monorepo Packages
- **`packages/schemas`**: Complete Zod validation schemas for Users, Sessions, Roles & Permissions, Pages, Posts, Products, Categories, Menus, Media, SEO, Site Settings, Revisions, and Backups.
- **`packages/types`**: Shared TypeScript types, API response interfaces, template contexts, and publisher abstractions.
- **`packages/utils`**:
  - `atomicFs.ts`: Atomic file writes via `.tmp` files + atomic renames, safe JSON I/O, directory assurance, and atomic staging directory swaps.
  - `lock.ts`: In-process asynchronous file lock manager preventing concurrent write collisions.
  - `pathSecurity.ts`: Path traversal sanitizer (`safeResolvePath`) ensuring paths never escape configured roots.
  - `slugify.ts`: URL-safe slug generator with duplicate resolution.
  - `sanitizer.ts`: Rich content block renderer and strict HTML sanitizer against XSS.
  - `logger.ts`: Structured JSON audit logger with secret/password scrubbing.

### 2. Backend Server (`apps/server`)
- **Zero Database Persistent Store**: Storage managers for Pages, Posts, Products, Categories, Menus, Media, Settings, Revisions, Sessions, and Backups.
- **Argon2id Authentication**: Secure password hashing with Argon2id and HTTP-only cookie sessions.
- **Role-Based Access Control (RBAC)**: Granular permissions for `admin`, `editor`, and `author`.
- **Security & Protection**: Helmet headers, CORS with credentials, CSRF verification, rate limiting on API & login endpoints, and path traversal protection.
- **REST Endpoints**:
  - `/api/auth`: Login, logout, me
  - `/api/pages`: CRUD, preview, revisions
  - `/api/posts`: CRUD, category/tag filtering, preview, revisions
  - `/api/products`: SKU, pricing, gallery, preview, revisions
  - `/api/categories` & `/api/menus`: Taxonomy and navigation
  - `/api/media`: Upload with MIME/extension checks, file management
  - `/api/settings`: Site branding, social links, analytics, global SEO
  - `/api/publish`: Triggers static site generation and atomic deployment
  - `/api/revisions`: Version snapshots and non-destructive restore
  - `/api/backups`: 1-click `.zip` archive creation, download, restore, and delete
  - `/api/preview`: Live in-memory preview rendering of draft content

### 3. Static Site Generator & Templates (`apps/generator` & `templates/`)
- **Template Compiler**: EJS engine compiling semantic HTML templates:
  - `layout.html`: Base layout with responsive navigation and footer
  - `home.html`: Homepage with hero section, featured products, and latest articles
  - `page/default.html` & `page/landing.html`: Clean content and landing layouts
  - `post/default.html` & `post/list.html`: Blog detail and categorized archives
  - `product/default.html` & `product/list.html`: Product detail with gallery and catalog
  - `assets/style.css`: Modern responsive stylesheet with rich typography and dark aesthetics
- **Atomic Publisher**: Generates to isolated staging directory (`.staging-xxx`), validates output, and performs an atomic directory swap into `generated/website/`.
- **Automated SEO**: Standard-compliant `sitemap.xml` with canonical URLs and `robots.txt`.

### 4. Admin Dashboard UI (`apps/admin`)
- Built with React, Vite, React Router, Tailwind CSS, and Lucide icons.
- **Sleek SaaS Dashboard**: Metric cards (pages, posts, products, drafts, media), quick actions, and recent activity stream.
- **Structured Block Editor**: Headings (H1–H6), Paragraphs, Blockquotes, Lists, Tables, Callouts, Buttons, Images, Code blocks, and Dividers with reordering and live HTML preview.
- **Media Library**: Drag & drop upload, thumbnail grid, image preview modal, copy URL.
- **SEO & Settings Editor**: Real-time Google Search Result SERP snippet preview widget.
- **1-Click Static Site Publisher**: Top-bar publish button with live progress modal displaying execution time and generation statistics.

### 5. CLI Utilities
- `npm run create-admin`: Interactive CLI to bootstrap an admin user with Argon2id.
- `npm run seed`: Seeds demonstration pages, blog posts, and products.
- `npm run generate`: Standalone static site generator CLI.

---

## 🧪 Verification & Test Results

All 14 automated unit and integration tests in 4 test suites pass:

```text
 ✓ tests/security.test.ts (5 tests)
 ✓ tests/auth.test.ts (3 tests)
 ✓ tests/content.test.ts (4 tests)
 ✓ tests/generator.test.ts (2 tests)

Test Files: 4 passed (4)
Tests:      14 passed (14)
Duration:   1.33s
```

### Verified Scenarios:
1. **Argon2id Hashing**: Passwords verified with Argon2id parameters; invalid passwords and inactive accounts rejected.
2. **Session Lifecycle**: Filesystem session cookies expire accurately and get purged automatically.
3. **Filesystem CRUD & Slugs**: Verified page, post, and product creation, duplicate slug handling, and updates.
4. **Static Generator Build**: Generated complete static site containing `index.html`, `sitemap.xml`, `robots.txt`, blog articles, and product catalogs.
5. **Draft Isolation**: Confirmed that draft content is **never** emitted to the static website output directory or sitemap.
6. **Live Preview**: Authenticated preview endpoint renders draft content in-memory with real templates.
7. **Security & Path Traversal**: Verified that path traversal attacks (`../../etc/passwd`) are blocked, HTML XSS vectors are sanitized, and RBAC permissions are enforced.
8. **Production Build**: `npm run build` cleanly compiled all monorepo workspaces without errors.

# Planfo CMS — User Guide

This guide explains how to use every feature in the **Planfo CMS Admin Studio**.

---

## 1. Dashboard (`/admin`)

The Dashboard provides a real-time overview of your static publication:
- **Editorial Posts Card:** Live count of total, published, and draft articles.
- **Site Pages Card:** Live count of static pages (Home, About, Contact, etc.).
- **Collections & Media Card:** Count of custom Blueprints, dynamic entries, and Media Library assets, plus a one-click **Recompile site** button.
- **Update Notification Banner:** Automatically appears whenever a newer version of Planfo CMS is published on GitHub.
- **Quick Actions:** Create a New Post, Create a New Page, or jump straight to editing existing pages.

---

## 2. Sidebar Navigation

The left navigation rail can be **collapsed** (icon-only mode with hover tooltips) or **expanded** (full brand logo and section labels):
- **CONTENT:** Pages, Posts
- **COLLECTIONS:** Dynamic custom collections created in Blueprints (e.g., UI Templates, Case Studies, Team Members)
- **BLUEPRINTS & TAXONOMY:** Blueprints Studio, Categories & Tags, Feature Packs
- **ASSETS & NAV:** Media Library, Navigation Menus, Themes
- **SYSTEM & CONFIG:** Users & Roles, Site Settings & SEO, Revisions, Backups, Trash

---

## 3. Authoring Pages & Posts

Both the **Page Editor** (`/admin/pages/:slug`) and **Post Editor** (`/admin/posts/:slug`) feature a 3-panel editorial workspace:

1. **Left Panel — Insert Blocks Palette:**
   - Docked next to the navigation rail and collapsible for distraction-free writing.
   - Supported blocks: **Heading (H1–H6)**, **Paragraph**, **Blockquote**, **Image**, **List**, **Table**, **Callout**, **Button / CTA**, **Code Block**, **Feature Grid**, and **Divider**.
2. **Center Panel — Full-Width Manuscript Canvas:**
   - Independently scrollable with desktop/mobile viewport preview toggle, inline block reordering, and Undo/Redo history.
   - New pages and posts start with a clean blank canvas (no dummy placeholder text).
3. **Right Panel — Settings & SEO Inspector:**
   - **Settings Tab:** Status (Draft/Published), URL Slug & Permalink preview, Template selector, Featured Image picker, and (for Posts) Author, Category, and Tags.
   - **SEO & Social Tab:** Live Google SERP Preview, Meta Title & Description with character counters, Canonical URL, OpenGraph Title/Description, and Search Engine `noIndex` toggle.

---

## 4. Blueprints & Custom Collections

Use **Blueprints Studio** (`/admin/blueprints/studio`) to model any structured content type without writing database migrations:
- Define custom fields (`text`, `textarea`, `number`, `url`, `boolean`, `select`, `image`, `date`, etc.).
- Enable optional **Feature Packs** (`/admin/blueprints/feature-packs`) for pre-configured schemas.
- Each custom Blueprint automatically appears in the sidebar under **COLLECTIONS** with its own list view and dedicated **Dynamic Entry Editor**.

---

## 5. Categories & Tags (`/admin/categories`)

- Organize blog posts and catalog items into clean URL archives (`/blog/category/<slug>`).
- Add descriptions and slugs with instant slug generation.

---

## 6. Media Library (`/admin/media`)

- Drag-and-drop image and asset uploads.
- **Automatic WebP Optimization:** Raster images (PNG/JPEG) are automatically compressed and converted to WebP while preserving SVGs and `.ico`/favicon assets.
- Copy public URLs or pick media directly inside any Page, Post, or Blueprint editor.

---

## 7. Navigation Menus (`/admin/navigation`)

- Create and manage multi-level nested menus for Header, Footer, and Mobile locations.
- Add links from existing Pages, Posts, Categories, Blueprint Entries, or Custom URLs.

---

## 8. Themes (`/admin/themes`)

- Switch between installed static themes under `themes/`.
- Preview active templates before publishing.

---

## 9. Site Settings & Global SEO (`/admin/settings` & `/admin/settings/seo`)

- **General Settings:** Site Name, Tagline, Logo, Favicon, Language, and **Planfo CMS Version & Updates** (check GitHub for updates anytime).
- **SEO & Indexing:** Site-wide default Meta Title/Description, OpenGraph image, and global "Discourage search engines" (`noindex, nofollow` + `robots.txt`) switch.
- **Hosting & Deployment:** Configure Local Static Output or 1-click GitHub Pages deployment.
- **URL Tools:** Safe global search-and-replace across JSON storage when migrating domains (with Dry Run preview).

---

## 10. Users & Roles (`/admin/users`)

Role-Based Access Control (RBAC):
- **Admin:** Full access to all content, settings, users, publishing, and backups.
- **Editor:** Manage and publish pages, posts, collections, categories, and media.
- **Author:** Create and edit own posts.

---

## 11. Revisions, Backups & Trash

- **Revisions (`/admin/revisions`):** Every publish creates an immutable snapshot. Roll back non-destructively at any time.
- **Backups (`/admin/backups`):** Create, download, and restore complete portable `.zip` snapshots of your `storage/` directory.
- **Trash (`/admin/trash`):** Deleted items move safely to Trash first; restore them with one click or permanently purge when ready.

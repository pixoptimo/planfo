# Planfo CMS

**Planfo CMS** is a production-ready, database-free Static Content Management System built with TypeScript, React, Express, and Tailwind CSS.

> **"The CMS manages content locally or on your server, while the public website remains 100% static HTML/CSS/JS — zero database, zero runtime overhead."**

---

## Key Features

- **Zero Database Architecture:** All content, schemas, settings, and revisions are stored as structured JSON on disk (`storage/`) with atomic file writes and lock management.
- **Modern Editorial Studio:** Full-width block editors for **Pages**, **Posts**, and **Custom Blueprints**, featuring collapsible navigation, docked Insert Blocks palette, live SERP preview, and independent inner scrolling.
- **Dynamic Content Blueprints:** Create custom content types (UI Templates, Case Studies, Team Members, FAQs, Events, etc.) visually with custom fields and Feature Packs.
- **Automatic WebP Media Pipeline:** Built-in image compression & WebP conversion preserving SVGs and favicons.
- **Enterprise Security & RBAC:** Argon2id password hashing, HTTP-only session cookies, CSRF protection, rate limiting, path traversal protection, Zod validation, and role-based permissions (`admin`, `editor`, `author`).
- **Built-in Version & Update Notifications:** Installed projects automatically check GitHub Releases and notify admins in the **Dashboard** and **Settings** when a newer version is available.
- **Revisions, Backups & Trash:** Non-destructive revision rollbacks, 1-click portable `.zip` backups, and two-stage Trash recovery.
- **1-Click Static Publishing:** Generates clean static HTML, minified assets, `sitemap.xml`, and `robots.txt` into `generated/website/` — ready for GitHub Pages, Cloudflare Pages, Netlify, Vercel, or any web host.

---

## Quick Start (One-Command Fresh Install)

Create a **100% fresh Planfo CMS project** with a single command — no manual `git clone`, no demo blueprints, no sample clutter, and ready for the First-Run Setup Wizard:

### Option A: Using `npx` (macOS, Linux, Windows)
```bash
npx github:pixoptimo/planfo my-website
```

### Option B: Using `curl` (macOS / Linux)
```bash
curl -fsSL https://raw.githubusercontent.com/pixoptimo/planfo/main/install.sh | bash -s my-website
```

### Start Development Server
```bash
cd my-website
npm run dev
```

- **Admin Dashboard:** `http://localhost:3000/admin` (launches the First-Run Setup Wizard automatically)
- **Live Static Site:** `http://localhost:3000/`

### Production Build & Static Generation
```bash
npm run build
npm run generate
npm start
```

---

## Documentation

| Guide | Description |
| :--- | :--- |
| **[Installation & Setup Guide](docs/INSTALLATION.md)** | Fresh install from GitHub, CLI installer, `.env` options, production deployment |
| **[Complete User Guide](docs/USER_GUIDE.md)** | Walkthrough of every CMS module (Pages, Posts, Blueprints, Media, SEO, Users, Backups) |
| **[Releasing & Auto-Updates](docs/RELEASING_AND_UPDATES.md)** | Semantic versioned releases (`npm run release`), GitHub update checks, safe upgrades |
| **[Changelog](CHANGELOG.md)** | Version history and release notes |
| **[Template Creation Bible](TEMPLATE_CREATION_BIBLE.md)** | Deep-dive guide to building custom static themes and templates |

---

## Project Structure

```text
├── apps/
│   ├── admin/             # React + Vite + Tailwind CSS Admin Studio
│   ├── generator/         # Static Site Generator & GitHub Pages publisher
│   └── server/            # Express API, Auth, RBAC, Update Checker, Storage
├── packages/
│   ├── create-planfo/     # Planfo CLI & Fresh Project Installer
│   ├── schemas/           # Shared Zod validation schemas
│   ├── types/             # Shared TypeScript contracts
│   └── utils/             # Atomic file I/O, locks, sanitization, security
├── docs/                  # Installation, User Guide, Releasing & Updates docs
├── scripts/               # release.ts, create-admin.ts, reset-admin.ts, seed
├── storage/               # Filesystem JSON storage & media
├── themes/                # Static HTML/EJS themes
├── generated/             # Compiled static website output
├── versions/              # Archived release notes per version
└── tests/                 # Automated Vitest test suite (64 tests)
```

---

## Versioning & Releases

Cut a new versioned release across all workspaces with one command:

```bash
npm run release -- patch   # 1.0.0 -> 1.0.1
npm run release -- minor   # 1.0.0 -> 1.1.0
npm run release -- major   # 1.0.0 -> 2.0.0
```

Push the commit and tag (`git push origin main --tags`) so every installed Planfo CMS instance automatically displays the update notification.

---

## License

MIT

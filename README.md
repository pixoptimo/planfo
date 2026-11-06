# Planfo Static CMS — Production-Ready File-Based Content Management System

A high-performance, production-ready Content Management System (CMS) designed to manage content for static HTML websites with **zero database dependencies**.

---

## 🌟 Core Architectural Principle

> **"The CMS manages content, but the public website remains 100% static and does not require a database, CMS API, or Node.js runtime to serve visitors."**

```text
Admin Dashboard (React + Vite + Tailwind)
            │
            ▼ (HTTP-only Cookies / RBAC / CSRF)
 Authenticated CMS API (Node.js + Express)
            │
            ▼ (Atomic writes, concurrency locks, path protection)
 Filesystem Storage (storage/)
            │
            ▼ (Atomic staging swap & schema validation)
 Static Site Generator (apps/generator)
            │
            ▼ (HTML, CSS, Assets, sitemap.xml, robots.txt)
 Generated Website (generated/website)
            │
            ▼
 Static Web Server / CDN / Nginx / S3
            │
            ▼
     Website Visitor
```

---

## 🚀 Key Features

- 📁 **Zero Database Requirement**: Persistent storage is structured JSON on the filesystem (`storage/`).
- ⚡ **Atomic File Operations**: Safe temporary writes (`.tmp`) + atomic rename (`fs.rename`) with in-process lock manager prevents file corruption.
- 🔒 **Enterprise-Grade Security**:
  - **Argon2id** password hashing
  - Secure **HTTP-only session cookies** (no tokens in `localStorage`)
  - **Rate limiting** & login brute-force throttling
  - **Path traversal protection** (`safeResolvePath`)
  - Strict input validation via **Zod**
  - **HTML sanitization** via allowlist filters
  - Structured JSON audit logging with automatic secret/password scrubbing
- 👥 **Role-Based Access Control (RBAC)**:
  - `admin`: Full administrative access, user management, publishing, backups
  - `editor`: Create, edit, and publish pages, posts, products, categories, media
  - `author`: Create and edit own blog posts
- ✍️ **Structured Rich Content Editor**:
  - Block-based editing: Headings (H1–H6), Paragraphs, Blockquotes, Ordered/Unordered Lists, Images, Buttons, Callouts, Tables, Code Blocks, Dividers
  - No unsafe arbitrary HTML or JavaScript injection
- 🛍️ **Multi-Entity Content Management**:
  - **Pages**: Slug management, custom templates, structured body, SEO
  - **Blog Posts**: Excerpts, authoring, categories, tags, SEO
  - **Products Catalog**: SKU codes, price & currency, short summary, gallery, feature toggles
  - **Categories & Tags**: Hierarchical archive generation
  - **Navigation**: Multi-level nested dropdown menu manager
  - **Media Library**: Upload validation, safe filename generation, URL copying
- 🔄 **Revisions & Versioning**:
  - Automated snapshots on publish
  - Non-destructive rollback (restoring creates a new revision without losing history)
- 💾 **Portable Backups**:
  - 1-click `.zip` archive creation and restoration across different environments
- 👁️ **Live Draft Preview**:
  - Authenticated in-memory rendering of draft content without publishing to live output
- 🌐 **Automated SEO & Static Generation**:
  - Automatic `sitemap.xml` with canonical URLs and priorities
  - `robots.txt` generator
  - Dynamic Open Graph and Twitter card meta tags

---

## 📂 Project Structure

```text
├── apps/
│   ├── admin/             # React + Vite + Tailwind CSS dashboard
│   ├── generator/         # Static site generation engine & publishers
│   └── server/            # Express API, auth, storage managers, RBAC
│
├── packages/
│   ├── schemas/           # Zod validation schemas
│   ├── types/             # Shared TypeScript types & contracts
│   └── utils/             # Atomic I/O, lockfile, sanitization, path security
│
├── storage/               # Filesystem store (auto-initialized)
│   ├── auth/users.json
│   ├── content/
│   │   ├── pages/
│   │   ├── posts/
│   │   ├── products/
│   │   ├── categories/
│   │   └── menus/
│   ├── media/
│   ├── revisions/
│   ├── sessions/
│   ├── settings/
│   └── backups/
│
├── templates/             # Semantic HTML/CSS EJS templates
│   ├── layout.html
│   ├── home.html
│   ├── assets/style.css
│   ├── page/
│   ├── post/
│   └── product/
│
├── generated/
│   └── website/           # Deployable static build output
│
└── scripts/
    ├── create-admin.ts    # CLI to bootstrap admin user with Argon2id
    └── seed-sample-content.ts
```

---

## 🛠️ Getting Started

### 1. Requirements
- Node.js `>= 18.0.0`
- npm `>= 9.0.0`

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Review the `.env` variables:
```env
NODE_ENV=development

CMS_HOST=localhost
CMS_PORT=4000

SITE_URL=http://localhost:3000
ADMIN_URL=http://localhost:5173

STORAGE_PATH=./storage
MEDIA_PATH=./storage/media
CONTENT_PATH=./storage/content
REVISION_PATH=./storage/revisions
SESSION_PATH=./storage/sessions
SETTINGS_PATH=./storage/settings
BACKUP_PATH=./storage/backups

OUTPUT_PATH=./generated/website
TEMPLATES_PATH=./templates

COOKIE_SECURE=false
COOKIE_SECRET=cms_cookie_secret_dev_key_32_chars_long_minimum_safe!
```

---

## 👤 Bootstrap Admin User

Run the interactive setup command:
```bash
npm run create-admin
```
Follow the prompts to enter an email and password (minimum 8 characters). The password will be hashed with **Argon2id** and saved to `storage/auth/users.json`.

Alternatively, populate demonstration content and admin user:
```bash
npm run seed
```

---

## 💻 Development Workflow

Start both CMS Backend API (Port 4000) and Admin Dashboard (Port 5173):
```bash
npm run dev
```

- **Admin Dashboard**: `http://localhost:5173`
- **CMS Backend API**: `http://localhost:4000`

---

## 🏗️ Generating & Publishing the Static Website

To trigger a static generation via CLI:
```bash
npm run generate
```

Or click **"Publish Static Site"** in the top-right corner of the Admin Dashboard.

The output will be compiled atomically into `generated/website/` (or your configured `OUTPUT_PATH`).

To preview the generated static site with any local web server:
```bash
npx serve generated/website -p 3000
```

---

## 🧪 Running Automated Tests

Run the full automated test suite:
```bash
npm test
```
Tests cover:
- Authentication & Argon2id hashing
- Session lifecycle & expiration
- Content CRUD & unique slug generation
- Static Site Generator & draft isolation
- Path traversal & XSS security protections
- RBAC permissions

---

## 🚢 Production Deployment

### 1. Build for Production
```bash
npm run build
```

### 2. Start CMS Server in Production
```bash
export NODE_ENV=production
export COOKIE_SECURE=true
npm run start
```

### 3. Serving the Public Static Site (Nginx Example)
Because the generated website is pure HTML, CSS, and media, configure your web server to serve the static directory:

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/site; # Point to OUTPUT_PATH
    index index.html;

    location / {
        try_files $uri $uri/ /index.html =404;
    }

    # Cache static assets
    location ~* \.(css|js|jpg|jpeg|png|webp|gif|svg|ico)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### 4. Reverse Proxy CMS Admin (Nginx Example)
```nginx
server {
    listen 443 ssl http2;
    server_name cms.example.com;

    ssl_certificate /etc/letsencrypt/live/cms.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cms.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🛡️ Security Best Practices

1. **Production Cookies**: Always set `COOKIE_SECURE=true` in production when serving over HTTPS.
2. **Path Traversal**: All filesystem operations are verified using `safeResolvePath`. Never allow symbolic links pointing outside the storage root.
3. **Backup Protection**: Ensure the `storage/` directory is never placed inside the public web root.
4. **Content Sanitization**: Rich content is validated against schema definitions and sanitized with strict HTML allowlists.

---

## 📄 License
MIT License. Built for performance, resilience, and simplicity.

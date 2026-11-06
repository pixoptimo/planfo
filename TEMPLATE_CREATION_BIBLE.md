# Planfo CMS — Template Creation Bible
### The Definitive Architecture & Theme Development Manual (Production v1.0 Standard)

> **Document Version:** 1.0.0 (Production Release)  
> **Target Audience:** Theme Developers, Frontend Engineers, UI Architects, and Open-Source Contributors.  
> **CMS Compatibility:** Planfo CMS Beta v0.1 through Production v1.0  
> **Philosophy:** Zero Database • 100% Static HTML/CSS • Pure Vanilla • Instant Generation

---

## 📑 Table of Contents

1. [Executive Overview & Philosophy](#1-executive-overview--philosophy)
2. [Project & Theme Directory Anatomy](#2-project--theme-directory-anatomy)
3. [`theme.json` Specification & Manifest Configuration](#3-themejson-specification--manifest-configuration)
4. [Template Hierarchy & Cascade Engine](#4-template-hierarchy--cascade-engine)
5. [Layout Inheritance & EJS Templating Syntax](#5-layout-inheritance--ejs-templating-syntax)
6. [Context Variables & Data Pipeline Reference](#6-context-variables--data-pipeline-reference)
7. [The Blueprints Engine — Custom Schemas & Dynamic Fields](#7-the-blueprints-engine--custom-schemas--dynamic-fields)
8. [Step-by-Step: Converting Static HTML to a Planfo Theme](#8-step-by-step-converting-static-html-to-a-planfo-theme)
9. [Dynamic Hero Section & Catalog Grid Implementation](#9-dynamic-hero-section--catalog-grid-implementation)
10. [Product Details Architecture & Multi-Tab Specs](#10-product-details-architecture--multi-tab-specs)
11. [Hardware Device Simulator & Live HTML Upload Runner](#11-hardware-device-simulator--live-html-upload-runner)
12. [Asset Path Resolution & Portable `assetPrefix` Pattern](#12-asset-path-resolution--portable-assetprefix-pattern)
13. [Build Lifecycle & Static Site Generation](#13-build-lifecycle--static-site-generation)
14. [Publishing, Packaging & Theme Store Quality Checklist](#14-publishing-packaging--theme-store-quality-checklist)

---

## 1. Executive Overview & Philosophy

Planfo CMS is a **database-free, file-based Content Management System** built specifically for modern static websites, marketing showcases, portfolio creators, and documentation sites.

### Core Architectural Pillars
- **Zero Database Overhead:** No MySQL, PostgreSQL, or SQLite servers to configure or patch. All content, configuration, and schemas are saved as human-readable JSON files in the `planfo/` folder.
- **Git-Friendly Version Control:** Because all content is JSON, an entire website can be versioned, branched, reviewed, and collaborated on using standard Git workflows.
- **Pure Static Distribution:** The static generator compiles EJS templates and JSON content into a 100% self-contained `generated/` directory containing only HTML, CSS, JavaScript, and media assets.
- **Instant Deployment:** Works seamlessly on GitHub Pages, Cloudflare Pages, Netlify, Vercel, AWS S3, or any standard Apache/Nginx web server with zero server-side runtimes.
- **Modern Performance Guarantee:** Built to achieve effortless **100/100 Google Lighthouse** scores across Performance, Accessibility, Best Practices, and SEO.

---

## 2. Project & Theme Directory Anatomy

A complete Planfo CMS project is structured cleanly into three main top-level concerns:

```
my-planfo-project/
├── planfo/                        # [CMS Core Data Store]
│   ├── config.json                # Project runtime configuration
│   ├── settings.json              # Site identity, SEO defaults & feature packs
│   ├── blueprints/                # Custom content type schemas
│   │   └── templates.json         # Custom Templates blueprint definition
│   ├── content/                   # User-authored structured content
│   │   ├── pages/                 # Standalone pages (home.json, about.json, contact.json)
│   │   ├── templates/             # Custom blueprint entries (quantum-saas.json, etc.)
│   │   ├── categories/            # Taxonomies & category definitions
│   │   └── menus/                 # Navigation menu structures (main.json)
│   ├── media/                     # Uploaded images, documents, and media
│   └── themes/                    # Installed themes directory
│       └── pixoptimo-theme/       # Active Theme directory (see anatomy below)
│
├── generated/                     # [Compiled Static Output - Ready to Deploy]
│   ├── index.html                 # Homepage catalog
│   ├── details.html               # Interactive specifications documentation
│   ├── demo.html                  # Live studio hardware device simulator
│   ├── privacy.html               # Legal privacy policy
│   ├── terms.html                 # Legal terms of service
│   ├── products/                  # Static pre-rendered product detail pages
│   │   ├── quantum-saas/index.html
│   │   ├── nexus-fintech/index.html
│   │   └── ...
│   ├── assets/                    # Compiled theme assets (CSS, JS, images, fonts)
│   ├── sample-templates/          # Standalone preview templates
│   ├── sitemap.xml                # Search engine XML sitemap
│   └── robots.txt                 # Search engine crawler instructions
│
├── README.md                      # Project documentation
└── TEMPLATE_CREATION_BIBLE.md     # This comprehensive developer manual
```

### Theme Directory Structure (`planfo/themes/[theme-id]/`)

Each Planfo CMS theme is self-contained inside its own folder under `planfo/themes/`:

```
planfo/themes/pixoptimo-theme/
├── theme.json                     # Theme manifest and supported features
├── layout.html                    # Master wrapper with <head>, navigation, footer & <%- body %>
├── index.html                     # Homepage template (dynamic hero + product catalog loop)
├── details.html                   # Standalone parameter-driven product details template
├── demo.html                      # Interactive hardware device simulator & HTML upload runner
├── privacy.html                   # Standalone legal privacy template
├── terms.html                     # Standalone legal terms template
├── page/                          # Page templates
│   └── default.html               # Fallback template for generic pages (About, Contact)
├── product/                       # Product templates
│   ├── default.html               # Dedicated pre-rendered product detail page
│   └── list.html                  # Product catalog archive template
├── assets/                        # Theme static assets (copied to generated/assets/)
│   ├── css/
│   │   ├── style.css              # Core design tokens, typography, grid & animations
│   │   ├── details.css            # Multi-tab specs, code blocks & sidebar styling
│   │   └── demo.css               # Device simulator frames & toolbar styling
│   ├── js/
│   │   ├── app.js                 # Catalog filter, live search, sort & dark mode
│   │   ├── details.js             # Tab switcher, file tree renderer & clipboard copy
│   │   ├── demo.js                # Viewport simulator & HTML file upload runner
│   │   └── templates-data.js      # Central template metadata dataset
│   └── images/                    # Template preview thumbnails & showcase graphics
└── sample-templates/              # Live HTML template bundles served by simulator
    ├── quantum-saas.html
    ├── nexus-fintech.html
    ├── avant-agency.html
    └── aurelie-luxury.html
```

---

## 3. `theme.json` Specification & Manifest Configuration

Every theme MUST contain a valid `theme.json` at its root. This manifest tells Planfo CMS the theme's identity, metadata, supported feature packs, and available template layouts.

```json
{
  "id": "pixoptimo-theme",
  "name": "Pixoptimo Showcase & Studio",
  "version": "1.0.0",
  "author": "Pixoptimo Labs",
  "description": "Production-grade UI template catalog, live hardware device simulator, interactive HTML previewer, and technical documentation theme.",
  "thumbnail": "assets/images/quantum-saas.jpg",
  "supportedPacks": [
    "pages",
    "articles",
    "catalog",
    "blueprints"
  ],
  "templates": [
    "default",
    "index",
    "details",
    "demo",
    "product/default",
    "product/list",
    "page/default"
  ]
}
```

### Manifest Fields Reference
| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique alphanumeric theme identifier matching folder name (e.g. `pixoptimo-theme`). |
| `name` | `string` | User-friendly display name shown in Planfo Admin Settings. |
| `version` | `string` | Semantic version string (e.g. `1.0.0`). |
| `author` | `string` | Author, agency, or developer name. |
| `description`| `string` | Short summary of theme capabilities. |
| `thumbnail` | `string` | Relative path to theme preview banner. |
| `supportedPacks` | `string[]` | Feature packs supported by the theme (`pages`, `articles`, `catalog`, `blueprints`). |
| `templates` | `string[]` | Available templates that content editors can select in page settings. |

---

## 4. Template Hierarchy & Cascade Engine

Planfo CMS uses a deterministic cascade algorithm to determine which template file renders a given page or content entry:

### 1. Home Page (`/index.html`)
1. If `home.json` has `template` set to a custom value (e.g. `landing`) -> checks `page/landing.html`.
2. Otherwise, prioritizes `index.html` in the theme root.
3. Falls back to `home.html` in the theme root.
4. Falls back to `page/default.html` or `page.html`.

### 2. Standalone Pages (`/[slug]/index.html`)
1. Checks `page/${page.template}.html` (e.g. `page/about.html`).
2. Falls back to `page/default.html`.
3. Falls back to `page.html`.

### 3. Product Details Pages (`/products/[slug]/index.html`)
1. Checks `product/${product.template}.html` (e.g. `product/default.html`).
2. Falls back to `product/default.html`.
3. Falls back to `product.html`.

### 4. Custom Blueprint Entries (`/${blueprint.slug}/[slug]/index.html`)
1. Checks `${blueprint.slug}/${entry.template}.html`.
2. If `blueprint.slug === 'products'`, checks `product/default.html`.
3. Falls back to `post/default.html`.

### 5. Root Theme Standalone Pages (`details.html`, `demo.html`, `privacy.html`, `terms.html`)
If any standalone `.html` file is placed at the theme root, Planfo CMS automatically renders and outputs it directly to the root of `generated/` wrapped inside `layout.html`.

---

## 5. Layout Inheritance & EJS Templating Syntax

Planfo CMS uses standard, high-performance [EJS (Embedded JavaScript)](https://ejs.co) templates.

### The Master Wrapper (`layout.html`)
Every rendered template is injected into `layout.html` through the special `<%- body %>` slot.

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Dynamic SEO Meta Tags -->
  <%- metaTags %>

  <!-- Portable Asset Prefix -->
  <%
    let assetPrefix = '.';
    if (typeof activeSlug !== 'undefined') {
      if (activeSlug === 'home' || activeSlug === 'demo' || activeSlug === 'details' || activeSlug === 'privacy' || activeSlug === 'terms') {
        assetPrefix = '.';
      } else if (typeof product !== 'undefined' || (typeof blueprint !== 'undefined' && blueprint.slug === 'products')) {
        assetPrefix = '../..';
      } else {
        assetPrefix = '..';
      }
    }
  %>

  <link rel="stylesheet" href="<%= assetPrefix %>/assets/css/style.css">
  <% if (typeof activeSlug !== 'undefined' && (activeSlug === 'details' || typeof product !== 'undefined')) { %>
  <link rel="stylesheet" href="<%= assetPrefix %>/assets/css/details.css">
  <% } %>
  <% if (typeof activeSlug !== 'undefined' && activeSlug === 'demo') { %>
  <link rel="stylesheet" href="<%= assetPrefix %>/assets/css/demo.css">
  <% } %>
</head>
<body class="<%= (typeof activeSlug !== 'undefined' && activeSlug === 'demo') ? 'demo-body' : '' %>">

  <% if (typeof activeSlug !== 'undefined' && activeSlug === 'demo') { %>
    <!-- Studio Simulator renders without header/footer clutter -->
    <%- body %>
  <% } else { %>
    <!-- Standard Header -->
    <header class="site-header">
      <div class="container">
        <a href="<%= assetPrefix %>/index.html" class="brand-logo">
          <span><%= site.siteName || 'PIXOPTIMO' %></span>
        </a>
        <nav class="nav-links">
          <a href="<%= assetPrefix %>/index.html">Explore Catalog</a>
          <a href="<%= assetPrefix %>/demo.html">Live Simulator</a>
        </nav>
      </div>
    </header>

    <!-- Main Content Body Slot -->
    <main id="mainContent">
      <%- body %>
    </main>

    <!-- Standard Footer -->
    <footer class="site-footer">
      <div class="container">
        <p><%= site.footerText %></p>
      </div>
    </footer>
  <% } %>

  <script src="<%= assetPrefix %>/assets/js/templates-data.js"></script>
  <script src="<%= assetPrefix %>/assets/js/app.js"></script>
</body>
</html>
```

### EJS Syntax Quick Reference
- `<%= value %>`: HTML-escapes and outputs the expression.
- `<%- html %>`: Outputs raw HTML without escaping (used for `<%- body %>`, `<%- metaTags %>`, `<%- renderContent(content) %>`).
- `<% code %>`: JavaScript control-flow code (e.g. `if`, `for`, `forEach`).

---

## 6. Context Variables & Data Pipeline Reference

Whenever Planfo CMS compiles a template, it supplies a rich data context object:

### Global Context (Available on All Pages)
| Variable | Type | Description |
| :--- | :--- | :--- |
| `site` | `SiteSettings` | Site identity: `siteName`, `tagline`, `siteUrl`, `logo`, `footerText`, `defaultSEO`. |
| `menu` | `Menu` | Navigation structure with `items` array (`title`, `url`, `target`). |
| `pages` | `Page[]` | Array of all published standalone pages. |
| `products` | `Product[]` | Array of all published products / template items. |
| `activeSlug`| `string` | Slug of the currently active route (`home`, `demo`, `details`, etc.). |
| `currentYear`| `number` | Current calendar year (e.g. `2026`). |
| `metaTags` | `string` | Complete HTML `<title>`, `<meta description>`, and Open Graph tags. |
| `body` | `string` | The inner compiled HTML content (accessible inside `layout.html`). |

### Helper Functions (Available in Templates)
| Helper | Signature | Description |
| :--- | :--- | :--- |
| `formatDate(dateStr)` | `(string) => string` | Formats ISO date into readable string (e.g. `Oct 8, 2026`). |
| `formatPrice(amount, curr)` | `(number, string) => string` | Formats currency amount (e.g. `$49.00`). |
| `renderContent(blocks)` | `(ContentBlocks) => string` | Renders Planfo structured editor blocks into semantic HTML. |
| `escapeHtml(str)` | `(string) => string` | Safely escapes HTML special characters. |
| `escapeAttribute(str)` | `(string) => string` | Safely escapes string for use inside HTML attributes. |
| `safeJson(obj)` | `(any) => string` | Safely serializes JS objects to JSON for inline `<script>` tags, converting `<` to `\u003c` and `>` to `\u003e` to prevent HTML tokenizer breakage and premature script closure. |

### ⚠️ Critical Rule: Safe JSON Serialization in `<script>` Tags

When serializing structured CMS content into client-side JavaScript (e.g. `window.TEMPLATES_DATA`), **NEVER** use unescaped `JSON.stringify(...)` directly inside an inline `<script>` tag if fields might contain HTML snippets or code samples (such as `<script src="...">` or `<div>`).

**The HTML Tokenizer Rule:**
HTML parsers look for the literal sequence `</script>` to terminate script tags, ignoring quotes or JavaScript string syntax. If a product field contains `</script>`, the browser prematurely closes the `<script>` tag and dumps the remainder of the JSON string as raw, unparsed text directly onto the visual webpage!

**The Production Solution:**
Always use `safeJson(...)`:
```html
<script>
  window.TEMPLATES_DATA = <%- safeJson(products.map(p => ({
    id: p.slug,
    title: p.title,
    quickStartCode: p.data?.quickStartCode || ''
  }))) %>;
</script>
```
Or use the universal fallback pattern:
```html
<script>
  window.TEMPLATES_DATA = <%- (typeof safeJson === 'function' ? safeJson : (o => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')))(products.map(p => ({
    id: p.slug,
    title: p.title,
    ...
  }))) %>;
</script>
```
The browser's JavaScript engine automatically parses `\u003c` and `\u003e` back into `<` and `>`, ensuring 100% data integrity with zero HTML bleed.

---

## 7. The Blueprints Engine — Custom Schemas & Dynamic Fields

Blueprints allow Planfo CMS to manage custom data types without needing database migrations.

### The Template Blueprint Schema (`planfo/blueprints/templates.json`)
The custom Templates Blueprint defines all fields for UI templates, layouts, or digital showcases:

```json
{
  "id": "bp_templates",
  "name": "Templates",
  "singularName": "Template",
  "slug": "templates",
  "icon": "Layers",
  "description": "Showcase catalog for modern UI templates, layouts, and web components.",
  "hasCategories": true,
  "hasTags": true,
  "hasContentEditor": true,
  "isBuiltIn": false,
  "fields": [
    {
      "id": "fld_tagline",
      "name": "tagline",
      "label": "Tagline / Card Subtitle",
      "type": "textarea",
      "required": true,
      "placeholder": "Ultra-lean autonomous telemetry cockpit..."
    },
    {
      "id": "fld_badge",
      "name": "badge",
      "label": "Card Badge Text",
      "type": "text",
      "required": false,
      "placeholder": "Trending / Popular / Award Winner"
    },
    {
      "id": "fld_badge_color",
      "name": "badgeColor",
      "label": "Badge Color Theme",
      "type": "select",
      "options": ["purple", "emerald", "pink", "gold", "blue"],
      "defaultValue": "purple"
    },
    {
      "id": "fld_price",
      "name": "price",
      "label": "Price Display",
      "type": "text",
      "defaultValue": "Free"
    },
    {
      "id": "fld_is_free",
      "name": "isFree",
      "label": "Is Free Template?",
      "type": "boolean",
      "defaultValue": true
    },
    {
      "id": "fld_demo_url",
      "name": "demoUrl",
      "label": "Demo Preview URL",
      "type": "text",
      "placeholder": "sample-templates/quantum-saas.html"
    },
    {
      "id": "fld_download_file",
      "name": "downloadFile",
      "label": "Download File / Bundle URL",
      "type": "text",
      "placeholder": "sample-templates/quantum-saas.html"
    },
    {
      "id": "fld_version",
      "name": "version",
      "label": "Template Version",
      "type": "text",
      "defaultValue": "v1.0.0"
    },
    {
      "id": "fld_release_date",
      "name": "releaseDate",
      "label": "Release Date",
      "type": "text"
    },
    {
      "id": "fld_last_updated",
      "name": "lastUpdated",
      "label": "Last Updated",
      "type": "text"
    },
    {
      "id": "fld_license",
      "name": "license",
      "label": "License Type",
      "type": "text",
      "defaultValue": "MIT Commercial & Personal"
    },
    {
      "id": "fld_author",
      "name": "author",
      "label": "Author / Studio",
      "type": "text",
      "defaultValue": "Pixoptimo Labs"
    },
    {
      "id": "fld_rating",
      "name": "rating",
      "label": "Review Rating (out of 5)",
      "type": "number",
      "defaultValue": 4.98
    },
    {
      "id": "fld_review_count",
      "name": "reviewCount",
      "label": "Total Review Count",
      "type": "number",
      "defaultValue": 100
    },
    {
      "id": "fld_downloads",
      "name": "downloads",
      "label": "Download Count Display",
      "type": "text",
      "defaultValue": "10,000+"
    },
    {
      "id": "fld_file_size",
      "name": "fileSize",
      "label": "Bundle Size",
      "type": "text",
      "defaultValue": "14.2 KB (Gzipped)"
    },
    {
      "id": "fld_tech_stack",
      "name": "techStack",
      "label": "Tech Stack Chips",
      "type": "textarea",
      "placeholder": "HTML5 Semantic, Vanilla CSS3, Custom Properties"
    },
    {
      "id": "fld_features",
      "name": "features",
      "label": "Key Features Checklist",
      "type": "textarea",
      "placeholder": "Enter each feature bullet on a new line"
    },
    {
      "id": "fld_quick_start",
      "name": "quickStartCode",
      "label": "Quick Start Code Snippet",
      "type": "textarea"
    },
    {
      "id": "fld_css_tokens",
      "name": "cssTokens",
      "label": "CSS Custom Properties / Tokens",
      "type": "textarea"
    },
    {
      "id": "fld_lh_performance",
      "name": "lighthousePerformance",
      "label": "Lighthouse: Performance Score",
      "type": "number",
      "defaultValue": 100
    },
    {
      "id": "fld_lh_accessibility",
      "name": "lighthouseAccessibility",
      "label": "Lighthouse: Accessibility Score",
      "type": "number",
      "defaultValue": 100
    },
    {
      "id": "fld_lh_best_practices",
      "name": "lighthouseBestPractices",
      "label": "Lighthouse: Best Practices Score",
      "type": "number",
      "defaultValue": 100
    },
    {
      "id": "fld_lh_seo",
      "name": "lighthouseSeo",
      "label": "Lighthouse: SEO Score",
      "type": "number",
      "defaultValue": 100
    },
    {
      "id": "fld_changelog",
      "name": "changelog",
      "label": "Changelog & Release Notes",
      "type": "textarea"
    }
  ]
}
```

### Accessing Blueprint Data in Templates
All custom fields defined in the blueprint are accessible under `product.data` (or `entry.data`):
```html
<span>Badge: <%= product.data.badge %></span>
<span>Price: <%= product.data.price %></span>
<span>Author: <%= product.data.author %></span>
```

---

## 8. Step-by-Step: Converting Static HTML to a Planfo Theme

To convert any static HTML/CSS web design into a native Planfo CMS theme, follow this 7-step process:

1. **Create the Theme Directory:** Create `planfo/themes/[theme-name]/` and create `theme.json`.
2. **Copy Assets:** Move CSS to `assets/css/`, JS to `assets/js/`, and images to `assets/images/`.
3. **Extract `layout.html`:** Take the common `<head>`, `<header>`, and `<footer>` elements from your HTML pages and wrap the inner body with `<%- body %>`.
4. **Make the Hero Section Dynamic:** In `index.html`, replace static hero headings, taglines, and pill text with EJS expressions reading from `page.title`, `page.pill`, and `page.excerpt`.
5. **Implement the Products Loop:** Replace hardcoded cards with `<% products.forEach(template => { ... }) %>`.
6. **Build Details & Demo Pages:** Create `product/default.html` (pre-rendered) and `demo.html` (interactive viewport simulator).
7. **Serialize Client-side Dataset:** Add `<script>window.TEMPLATES_DATA = <%- JSON.stringify(products) %></script>` to allow instantaneous client-side search, filtering, and sorting without server roundtrips.

---

## 9. Dynamic Hero Section & Catalog Grid Implementation

In `index.html`, the hero section dynamically synchronizes with CMS page settings:

```html
<section class="hero-catalog">
  <div class="container">
    <div class="hero-pill">
      <span class="pulsing-dot"></span>
      <span><%= page.pill || site.tagline %></span>
    </div>

    <h1 class="hero-title">
      <%- page.title.replace(/\n/g, '<br>') %>
    </h1>

    <p class="hero-description">
      <%= page.excerpt || site.defaultSEO.description %>
    </p>

    <!-- Interactive Filtering & Live Search Controls -->
    <div class="catalog-controls">
      <div class="filter-pills">
        <button class="filter-pill active" data-category="all">All Templates</button>
        <button class="filter-pill" data-category="saas">SaaS &amp; Dashboard</button>
        <button class="filter-pill" data-category="fintech">Fintech &amp; Web3</button>
        <button class="filter-pill" data-category="agency">Creative Studio</button>
        <button class="filter-pill" data-category="ecommerce">Luxury E-Commerce</button>
      </div>

      <div class="search-sort-row">
        <input type="search" id="templateSearch" class="search-input" placeholder="Search templates...">
        <select id="templateSort" class="sort-select">
          <option value="featured">Featured First</option>
          <option value="rating">Highest Rated</option>
          <option value="downloads">Most Popular</option>
          <option value="free">Free First</option>
        </select>
      </div>
    </div>
  </div>
</section>

<!-- Dynamic Products Grid -->
<section class="container">
  <div class="templates-grid" id="templatesGrid">
    <% products.forEach(function(template) { %>
      <% const d = template.data || {}; %>
      <article class="template-card" id="card-<%= template.slug %>">
        <div class="card-thumbnail-box">
          <img src="<%= template.featuredImage %>" alt="<%= template.title %>" class="card-thumbnail" loading="lazy">
          <span class="badge badge-<%= d.badgeColor || 'purple' %>"><%= d.badge || 'PRO' %></span>
          <span class="card-price-top"><%= d.price || 'Free' %></span>
        </div>

        <div class="card-content">
          <h2 class="card-title">
            <a href="details.html?id=<%= template.slug %>"><%= template.title %></a>
          </h2>
          <p class="card-description"><%= d.tagline || template.excerpt %></p>
          
          <div class="card-actions">
            <a href="details.html?id=<%= template.slug %>" class="btn btn-details">Details</a>
            <a href="demo.html?id=<%= template.slug %>" class="btn btn-demo">Demo</a>
          </div>
        </div>
      </article>
    <% }); %>
  </div>
</section>
```

---

## 10. Product Details Architecture & Multi-Tab Specs

Planfo provides both:
1. **Pre-rendered Static Detail Pages (`products/[slug]/index.html`):** Generated using `product/default.html` for instant SEO indexing and crawlers.
2. **Interactive Standalone Detail Page (`details.html?id=[slug]`):** Client-side parameterized view for instant catalog browsing.

### Tabbed Documentation Layout
- **Tab 1 (Overview & Features):** Architectural philosophy + feature checklist bullets.
- **Tab 2 (File Architecture):** Zero-build folder hierarchy tree.
- **Tab 3 (Documentation & Rules):** Copyable Quick Start snippet, CSS custom property tokens table, and W3C/WCAG validation standards.
- **Tab 4 (Changelog):** Semantic version history timeline.
- **Sidebar Specifications:** Release date, framework, bundle size, license, and Google Lighthouse 100 benchmark radar scores.

---

## 11. Hardware Device Simulator & Live HTML Upload Runner

The live simulator (`demo.html`) gives users and designers an interactive hardware testing cockpit:

### Features & Capabilities
1. **Viewport Frame Emulation:**
   - **Desktop Mode:** 100% full-width immersive canvas.
   - **Tablet Mode:** 768px × 1024px hardware bezel frame.
   - **Mobile Mode:** 390px × 820px smartphone simulation with dynamic island pill.
2. **Live HTML Upload Runner:**
   - File picker button (`#btnUploadHtml`) allows users to upload any `.html` or `.htm` file.
   - Drag-and-drop listener on `#demoStage` reveals a dropzone overlay.
   - The file is read instantly in-memory via `FileReader.readAsText()` and mounted via `iframe.srcdoc = htmlContent`.
   - Dimension badge displays the active file name.
3. **Direct Template Download:**
   - Download action triggers instant client-side download of the active template bundle or zip.

---

## 12. Asset Path Resolution & Portable `assetPrefix` Pattern

To ensure your static site can be opened directly from the local filesystem (`file://`), deployed into a subdirectory (e.g. `username.github.io/my-site/`), or hosted at a root custom domain without breaking links, always use the `assetPrefix` pattern:

```ejs
<%
  let assetPrefix = '.';
  if (typeof activeSlug !== 'undefined') {
    if (activeSlug === 'home' || activeSlug === 'demo' || activeSlug === 'details' || activeSlug === 'privacy' || activeSlug === 'terms') {
      assetPrefix = '.';
    } else if (typeof product !== 'undefined' || (typeof blueprint !== 'undefined' && blueprint.slug === 'products')) {
      assetPrefix = '../..';
    } else {
      assetPrefix = '..';
    }
  }
%>

<link rel="stylesheet" href="<%= assetPrefix %>/assets/css/style.css">
<script src="<%= assetPrefix %>/assets/js/app.js"></script>
```

---

## 13. Build Lifecycle & Static Site Generation

Planfo CMS compiles static sites via its CLI:

```bash
# Generate the static website into generated/
npx planfo build

# Preview the static site locally on http://localhost:8080
npx planfo preview

# Publish directly to GitHub Pages
npx planfo publish
```

### Generation Pipeline Stages
1. **Load Site Data:** Reads `settings.json`, `pages/*.json`, `products/*.json`, and `blueprints/*.json`.
2. **Resolve Theme:** Locates the active theme folder declared in `settings.json`.
3. **Compile Homepage & Pages:** Generates `/index.html` and standalone pages (`/about/index.html`, etc.).
4. **Compile Products Catalog:** Generates `/products/[slug]/index.html` for every published item.
5. **Compile Root Standalone Templates:** Compiles `details.html`, `demo.html`, `privacy.html`, `terms.html`.
6. **Generate Sitemap & Robots:** Creates standards-compliant `sitemap.xml` and `robots.txt`.
7. **Copy Asset Trees:** Recursively synchronizes `assets/`, `sample-templates/`, and `media/` into `generated/`.

---

## 14. Publishing, Packaging & Theme Store Quality Checklist

Before distributing or publishing a Planfo CMS theme to the community marketplace, verify every item on this quality checklist:

- [x] **Manifest Validity:** `theme.json` has a unique ID, valid semantic version, and lists all supported templates.
- [x] **Zero Build Dependencies:** The theme requires no Node build steps (Webpack, Vite, Rollup) on the client — pure HTML, CSS, and JS.
- [x] **W3C Standards:** Clean HTML5 semantic hierarchy (`<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`) with a single `<h1>` per page.
- [x] **WCAG 2.1 AAA Accessibility:** Proper color contrast, keyboard focus rings (`:focus-visible`), and descriptive ARIA labels.
- [x] **Lighthouse 100 Target:** Verified 99-100 scores for Performance, Accessibility, Best Practices, and SEO.
- [x] **Mobile First & Responsive:** Fluid scaling across all viewports from 320px to 4K displays.
- [x] **Dark & Light Mode:** Seamless theme switching with OS system preference auto-detection.
- [x] **Interactive Simulator:** Device switcher and HTML upload runner tested across modern browsers.

---

*Authored by Planfo CMS Core Architecture Team • Published for Production v1.0 Distribution.*

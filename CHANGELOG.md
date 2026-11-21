# Changelog

All notable changes to **Planfo CMS** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.0.0] — 2026-11-21

### Added
- **Editorial Admin Studio (v1 UI)**:
  - Expandable & collapsible left navigation rail (`SidebarRail`) with full brand logo, categorized sections (`CONTENT`, `COLLECTIONS`, `BLUEPRINTS & TAXONOMY`, `ASSETS & NAV`, `SYSTEM & CONFIG`), and badge indicators.
  - Full-width inner editor layouts with fixed headers/sidebars and smooth independent inner scrolling (`PageEdit`, `PostEdit`, `DynamicEntryEdit`, `BlueprintCreate`, `BlueprintStudio`).
  - Docked, collapsible Insert Blocks palette aligned with the left navigation rail across all content editors.
  - Standardized right inspector rail with dedicated **Settings** and **SEO & Social** tabs (including live Google SERP preview, character counters, OpenGraph metadata, and `noIndex` controls).
- **Dynamic Content Blueprints Engine**:
  - Visual Blueprint Studio for creating custom content schemas (e.g., UI Templates, Case Studies, Team Members, Testimonials, FAQs, Events) with custom fields and Feature Packs.
- **Automatic GitHub Update Checker**:
  - Backend `/api/system/update-check` endpoint that checks GitHub Releases/Tags with 6-hour caching and offline resilience.
  - Dismissible update notification banner on the **Dashboard** and a **CMS Version & Updates** panel inside **Settings**.
- **Versioned Release & Fresh Installer CLI**:
  - Automated `npm run release -- <patch|minor|major>` script to bump all workspace versions, update `CHANGELOG.md`, archive `versions/vX.Y.Z/RELEASE.md`, verify builds/tests, and create git tags.
  - `planfo create-fresh <project-name>` and `planfo update` CLI commands.
- **Core Static CMS Platform**:
  - Zero-database atomic filesystem storage (`storage/`), Argon2id authentication, HTTP-only session cookies, CSRF protection, RBAC (`admin`, `editor`, `author`), WebP image compression pipeline, visual revision history, portable `.zip` backups, two-stage Trash manager, and atomic static site generation (`generated/website/`).
- **Complete Production Documentation**:
  - `README.md`, `CHANGELOG.md`, `docs/INSTALLATION.md`, `docs/USER_GUIDE.md`, and `docs/RELEASING_AND_UPDATES.md`.

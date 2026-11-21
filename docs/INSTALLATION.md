# Planfo CMS — Installation & Setup Guide

This guide covers every way to install, configure, and run a fresh **Planfo CMS** project for local development or production hosting.

---

## Prerequisites

- **Node.js** `v20.0.0` or higher (LTS recommended)
- **npm** `v10.0.0` or higher
- **Git** `v2.30+`

Verify your environment:
```bash
node -v
npm -v
git --version
```

---

## Option 1: Fresh Standalone Project from GitHub (Recommended)

Clone the repository into a new project folder and install dependencies:

```bash
git clone https://github.com/pixoptimo/planfo.git my-website
cd my-website
npm install
```

### Reset Admin State for a Fresh Start (Optional)
If you want the **First-Run Setup Wizard** to prompt you to create your own administrator account on first launch:

```bash
echo '{ "users": [] }' > storage/auth/users.json
```

### Start the Development Server
```bash
npm run dev
```

This starts both the Express CMS API / Static Server and the Vite Admin UI concurrently:
- **Admin Dashboard:** `http://localhost:3000/admin` (or the port printed in terminal)
- **Live Static Website:** `http://localhost:3000/`

---

## Option 2: Using the Planfo CLI (`create-planfo`)

If you have linked the Planfo CLI globally (`npm link packages/create-planfo`):

### Download & Install a Fresh Standalone Dev Project
```bash
planfo create-fresh my-website --repo https://github.com/pixoptimo/planfo.git
cd my-website
npm run dev
```

### Initialize a Lightweight Content-Only Folder
```bash
planfo init my-site
cd my-site
planfo dev
```

---

## First-Run Setup Wizard

1. Open `http://localhost:3000/admin` in your browser.
2. If no admin account exists yet, you are automatically redirected to `/admin/setup`.
3. Enter your **Admin Email**, **Display Name**, and a strong **Password** (minimum 8 characters, hashed with Argon2id).
4. Once completed, you are signed in via a secure HTTP-only cookie and taken directly to the **Editorial Studio Dashboard**.

---

## Environment Configuration (`.env`)

Copy `.env.example` to `.env` in your project root to customize ports, secrets, or GitHub update tracking:

```bash
cp .env.example .env
```

| Variable | Default | Description |
| :--- | :--- | :--- |
| `CMS_PORT` | `3000` | Port for the CMS API, Admin UI, and Static Server |
| `SITE_URL` | `http://localhost:3000` | Public canonical URL used in `sitemap.xml` and OpenGraph tags |
| `SESSION_SECRET` | Auto-generated | Secret key for signing HTTP-only session cookies |
| `PLANFO_GITHUB_REPO` | From `package.json` | GitHub `owner/repo` slug checked for CMS updates (e.g. `myorg/planfo`) |
| `GITHUB_TOKEN` | *(Optional)* | Optional GitHub PAT if checking updates on a private repo |

---

## Production Build & Startup

To compile all packages, build the optimized Admin UI, generate the static website, and run the production server:

```bash
npm run build
npm run generate
npm start
```

### Deploying the Static Output
Your compiled website lives inside `generated/website/`. You can deploy that folder directly to:
- **GitHub Pages** (built-in 1-click publish in Settings → Hosting & Deployment)
- **Cloudflare Pages**, **Netlify**, or **Vercel**
- **Nginx / Apache / AWS S3 / Any Static Web Host**

> **Security Note:** Never deploy `storage/` or `.env` to a public static host. Only `generated/website/` is served to visitors.

---

## Useful CLI Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start CMS server + Admin UI in development mode |
| `npm run build` | Compile all TypeScript workspaces and build Admin UI |
| `npm start` | Start production Express server |
| `npm run generate` | Run static site generator manually |
| `npm run create-admin` | Interactively create a new admin user |
| `npm run reset-admin` | Reset admin credentials to defaults |
| `npm test` | Run the full Vitest automated test suite |
| `npm run release -- patch` | Bump version, update changelog, build, test, and tag a new release |

# Planfo CMS — Versioned Release & Update Process

Planfo CMS uses **Semantic Versioning** (`vMAJOR.MINOR.PATCH`) and **GitHub Releases / Tags** so every installed project can automatically detect when a new version is published.

---

## 1. How Installed Projects Detect Updates

Every running Planfo CMS instance includes:
1. **`GET /api/system/info`** — returns the locally installed version from `package.json` and the configured GitHub repository (`owner/planfo`).
2. **`GET /api/system/update-check`** — queries GitHub's public Releases API (`https://api.github.com/repos/<owner>/<repo>/releases/latest`, with a fallback to `/tags`), caches the result for 6 hours, and compares versions using semantic versioning.
3. **Admin UI Notifications:**
   - **Dashboard:** Automatically displays a dismissible **"Planfo CMS vX.Y.Z is available"** banner when a newer tag exists on GitHub.
   - **Settings → General Settings:** Shows the **Planfo CMS Version & Updates** card with installed version, latest version, a **"Check for Updates"** button (`?force=true`), release notes link, and the exact upgrade command.

> **Offline Safe:** If a server has no internet access or GitHub is unreachable, the check fails silently and never blocks the CMS.

---

## 2. How to Publish a New Versioned Release (Maintainers)

Whenever you finish new features or bug fixes, run the automated release script:

```bash
# Patch release (bug fixes: 1.0.0 -> 1.0.1)
npm run release -- patch

# Minor release (new features: 1.0.0 -> 1.1.0)
npm run release -- minor

# Major release (breaking changes: 1.0.0 -> 2.0.0)
npm run release -- major

# Explicit version
npm run release -- 1.2.0
```

### What `npm run release` Automates
1. Bumps `"version"` across root `package.json`, all `apps/*/package.json`, all `packages/*/package.json`, and `packages/create-planfo` CLI files.
2. Generates release notes from git commits since the last tag.
3. Prepends the new version section to `CHANGELOG.md`.
4. Archives a release record in `versions/vX.Y.Z/RELEASE.md`.
5. Runs `npm run build` and `npm test` to verify everything builds and passes.
6. Creates a `release: vX.Y.Z` git commit and annotated git tag `vX.Y.Z`.

### Push to GitHub
Push your commits and tags (or pass `--push` to the release script):

```bash
git push origin main --tags
```

*(Optional but recommended)* In GitHub → **Releases** → **Draft a new release**, select tag `vX.Y.Z` and paste the changelog notes. Every installed Planfo CMS project will immediately show the new version notification!

---

## 3. How Users Upgrade an Existing Planfo Project

Because all website content, users, media, and settings live inside `storage/`, upgrading the CMS engine preserves user data:

### Recommended Upgrade Steps
1. Create a 1-click backup in **Admin → Backups** (recommended before major updates).
2. Run in your project root:
   ```bash
   git pull origin main && npm install && npm run build
   ```
   *(Or if using the global CLI: `planfo update`)*
3. Restart your server (`npm run dev` or `npm start`).
4. Verify the updated version under **Settings → Planfo CMS Version & Updates**.

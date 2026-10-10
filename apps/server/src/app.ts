import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { helmetMiddleware, corsMiddleware, csrfProtection } from './middleware/security.js';
import { requestLogger } from './middleware/loggerMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './auth/middleware.js';
import { config } from './config/env.js';
import { systemInfo } from './systemInfo.js';

// Import routers
import { authRouter } from './routes/auth.routes.js';
import { pageRouter } from './routes/page.routes.js';
import { postRouter } from './routes/post.routes.js';
import { productRouter } from './routes/product.routes.js';
import { categoryRouter } from './routes/category.routes.js';
import { menuRouter } from './routes/menu.routes.js';
import { mediaRouter } from './routes/media.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { publishRouter } from './routes/publish.routes.js';
import { revisionRouter } from './routes/revision.routes.js';
import { backupRouter } from './routes/backup.routes.js';
import { userRouter } from './routes/user.routes.js';
import { statsRouter } from './routes/stats.routes.js';
import { previewRouter } from './routes/preview.routes.js';
import { themeRouter } from './routes/theme.routes.js';
import { blueprintRouter } from './routes/blueprint.routes.js';

export function createApp(): express.Application {
  const app = express();

  // Trust proxy for reverse proxies like Nginx
  app.set('trust proxy', 1);

  // Security and base middlewares
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(cookieParser(config.COOKIE_SECRET));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(csrfProtection);
  app.use(requestLogger);

  // Serve media files safely
  app.use('/media', express.static(config.MEDIA_PATH, {
    maxAge: '1d',
    dotfiles: 'ignore',
    fallthrough: false
  }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Dynamic system and port info endpoint
  app.get('/api/system/info', (_req, res) => {
    res.json({
      success: true,
      data: {
        cmsHost: systemInfo.cmsHost,
        cmsPort: systemInfo.cmsPort,
        cmsUrl: systemInfo.cmsUrl,
        sitePort: systemInfo.sitePort,
        siteUrl: systemInfo.siteUrl,
        isStaticServerRunning: systemInfo.isStaticServerRunning
      }
    });
  });

  // Apply general rate limit to API
  app.use('/api', apiRateLimiter);

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/pages', pageRouter);
  app.use('/api/posts', postRouter);
  app.use('/api/products', productRouter);
  app.use('/api/categories', categoryRouter);
  app.use('/api/menus', menuRouter);
  app.use('/api/media', mediaRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/publish', publishRouter);
  app.use('/api/revisions', revisionRouter);
  app.use('/api/backups', backupRouter);
  app.use('/api/users', userRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/preview', previewRouter);
  app.use('/api/themes', themeRouter);
  app.use('/api/blueprints', blueprintRouter);

  // API 404 Handler for unknown endpoints under /api
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `API route not found: ${req.method} ${req.path}` }
    });
  });

  // Admin Dashboard (SPA) - Unified WordPress Model
  const adminDistPath = config.ADMIN_DIST_PATH;
  if (fs.existsSync(adminDistPath)) {
    // Serve static files from built admin panel (express.static automatically redirects /admin to /admin/)
    app.use('/admin', express.static(adminDistPath, { index: 'index.html', redirect: true }));

    // SPA fallback for HTML5 client-side routing inside /admin/*
    app.get('/admin/*', (_req, res) => {
      res.sendFile(path.join(adminDistPath, 'index.html'));
    });
  } else {
    app.get(['/admin', '/admin/*'], (_req, res) => {
      res.status(503).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Aero CMS Admin</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f1f5f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .box { text-align: center; max-width: 480px; padding: 2rem; background: #111827; border: 1px solid #1f2937; border-radius: 1rem; }
            h1 { color: #10b981; }
            code { background: #1e293b; padding: 0.2rem 0.5rem; border-radius: 0.25rem; color: #38bdf8; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Aero CMS Admin</h1>
            <p>Admin panel assets not built yet. Run <code>npm run build --workspace=@cms/admin</code></p>
          </div>
        </body>
        </html>
      `);
    });
  }

  // Smart Permalink Redirector: Redirect mismatched collection URLs (e.g. /blog/:slug -> /products/:slug)
  app.get('/blog/:slug', (req, res, next) => {
    const slug = req.params.slug;
    try {
      const postFile = path.join(config.CONTENT_PATH, 'posts', `${slug}.json`);
      if (!fs.existsSync(postFile)) {
        // Check if this slug belongs to a product
        const productFile = path.join(config.CONTENT_PATH, 'products', `${slug}.json`);
        if (fs.existsSync(productFile)) {
          return res.redirect(301, `/products/${slug}`);
        }

        // Check if this slug belongs to any custom blueprint collection
        if (fs.existsSync(config.CONTENT_PATH)) {
          const contentDirs = fs.readdirSync(config.CONTENT_PATH, { withFileTypes: true });
          for (const d of contentDirs) {
            if (d.isDirectory() && !['posts', 'pages', 'media', 'menus'].includes(d.name)) {
              if (fs.existsSync(path.join(config.CONTENT_PATH, d.name, `${slug}.json`))) {
                return res.redirect(301, `/${d.name}/${slug}`);
              }
            }
          }
        }
      }
    } catch {}
    next();
  });

  // Public Static Website - Root Level
  app.use(express.static(config.OUTPUT_PATH, { extensions: ['html'] }));

  // Website 404 Handler
  app.use((req, res) => {
    const notFoundPath = path.join(config.OUTPUT_PATH, '404.html');
    if (fs.existsSync(notFoundPath)) {
      res.status(404).sendFile(notFoundPath);
    } else {
      res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Page Not Found - Aero CMS</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; color: #f1f5f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .box { text-align: center; max-width: 480px; padding: 2.5rem; background: #111827; border: 1px solid #1f2937; border-radius: 1rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            h1 { font-size: 3.5rem; margin: 0; color: #10b981; font-family: monospace; }
            h2 { margin: 0.5rem 0 1rem; font-size: 1.25rem; font-weight: 600; }
            p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin: 0 0 1.5rem; }
            code { background: #1e293b; padding: 0.2rem 0.4rem; border-radius: 0.25rem; color: #38bdf8; font-family: monospace; }
            a { color: #0b0f19; background: #10b981; text-decoration: none; font-weight: bold; font-size: 0.85rem; padding: 0.6rem 1.2rem; border-radius: 0.5rem; display: inline-block; transition: background 0.2s; }
            a:hover { background: #059669; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>404</h1>
            <h2>Route Not Found</h2>
            <p>The path <code>${req.path}</code> does not exist or has not been generated yet.</p>
            <a href="/">Return to Home</a>
          </div>
        </body>
        </html>
      `);
    }
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

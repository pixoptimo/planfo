import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { helmetMiddleware, corsMiddleware, csrfProtection } from './middleware/security.js';
import { requestLogger } from './middleware/loggerMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './auth/middleware.js';
import { config } from './config/env.js';

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

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.path}` }
    });
  });

  // Error Handler
  app.use(errorHandler);

  return app;
}

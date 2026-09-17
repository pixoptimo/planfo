import express from 'express';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { initializeStorage } from './storage/storageInit.js';
import { SessionStore } from './storage/sessionStore.js';
import { logger } from '@cms/utils';

async function startServer(): Promise<void> {
  // 1. Initialize filesystem storage
  await initializeStorage();

  // 2. Setup periodic session cleanup (every 1 hour)
  setInterval(() => {
    SessionStore.cleanExpired().catch((err) => {
      logger.error('Session cleanup error', { error: String(err) });
    });
  }, 60 * 60 * 1000);

  // 3. Create CMS API app and listen
  const app = createApp();
  const server = app.listen(config.CMS_PORT, config.CMS_HOST, () => {
    logger.info(`⚡ CMS Backend Server running at http://${config.CMS_HOST}:${config.CMS_PORT}`);
    logger.info(`📂 Storage Root: ${config.STORAGE_PATH}`);
    logger.info(`🌐 Static Output Path: ${config.OUTPUT_PATH}`);
  });

  // 4. Create and start Static Website Server on SITE_URL port (default 3000)
  let staticServer: ReturnType<typeof express>['listen'] | null = null;
  try {
    const siteUrlObj = new URL(config.SITE_URL);
    const sitePort = parseInt(siteUrlObj.port || '3000', 10);
    
    // Only start static server if sitePort is different from CMS_PORT
    if (sitePort !== config.CMS_PORT) {
      const staticApp = express();
      staticApp.use(express.static(config.OUTPUT_PATH, { extensions: ['html'] }));
      staticServer = staticApp.listen(sitePort, config.CMS_HOST, () => {
        logger.info(`🌐 Live Static Website running at http://${config.CMS_HOST}:${sitePort}`);
      });
    }
  } catch (err) {
    logger.warn('Could not initialize static site server', { error: String(err) });
  }

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down servers...');
    server.close(() => {
      if (staticServer) {
        // @ts-expect-error type close
        staticServer.close(() => {
          logger.info('All servers closed');
          process.exit(0);
        });
      } else {
        logger.info('CMS server closed');
        process.exit(0);
      }
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  logger.error('Fatal Server Startup Error', { error: String(err) });
  process.exit(1);
});


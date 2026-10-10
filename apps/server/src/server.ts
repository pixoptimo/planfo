import express from 'express';
import type { Server } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { initializeStorage } from './storage/storageInit.js';
import { SessionStore } from './storage/sessionStore.js';
import { logger, findAvailablePort } from '@cms/utils';
import { systemInfo } from './systemInfo.js';

const activePortsFilePath = path.resolve(config.STORAGE_PATH, '..', '.active-ports.json');

async function startServer(): Promise<void> {
  // 1. Initialize filesystem storage
  await initializeStorage();

  // 2. Setup periodic session cleanup (every 1 hour)
  setInterval(() => {
    SessionStore.cleanExpired().catch((err) => {
      logger.error('Session cleanup error', { error: String(err) });
    });
  }, 60 * 60 * 1000);

  // 3. Dynamically detect and allocate available CMS API port
  const preferredCmsPort = config.CMS_PORT;
  const actualCmsPort = await findAvailablePort(preferredCmsPort, config.CMS_HOST, []);

  if (actualCmsPort !== preferredCmsPort) {
    logger.warn(
      `⚠️ CMS API port ${preferredCmsPort} is in use. Automatically switched to available port ${actualCmsPort}`
    );
  }

  // 4. Create CMS Unified Server (Website, Admin & API on 1 single host/port)
  const app = createApp();
  const server = app.listen(actualCmsPort, config.CMS_HOST, () => {
    logger.info(`⚡ Aero CMS Unified Server running at http://${config.CMS_HOST}:${actualCmsPort}`);
    logger.info(`🌐 Public Website:  http://${config.CMS_HOST}:${actualCmsPort}/`);
    logger.info(`🛠️  Admin Dashboard: http://${config.CMS_HOST}:${actualCmsPort}/admin`);
    logger.info(`🔌 REST API:        http://${config.CMS_HOST}:${actualCmsPort}/api`);
    logger.info(`📂 Storage Root:    ${config.STORAGE_PATH}`);
    logger.info(`🌐 Static Output:   ${config.OUTPUT_PATH}`);
  });

  const actualSitePort = actualCmsPort;
  const actualSiteUrl = `http://${config.CMS_HOST}:${actualCmsPort}`;

  // 5. Update shared systemInfo (Single-Port WordPress Model)
  systemInfo.cmsHost = config.CMS_HOST;
  systemInfo.cmsPort = actualCmsPort;
  systemInfo.cmsUrl = actualSiteUrl;
  systemInfo.sitePort = actualSitePort;
  systemInfo.siteUrl = actualSiteUrl;
  systemInfo.isStaticServerRunning = true;

  // 6. Write runtime active ports config for Admin/Vite and external tooling
  try {
    fs.writeFileSync(
      activePortsFilePath,
      JSON.stringify(
        {
          cmsPort: actualCmsPort,
          cmsUrl: systemInfo.cmsUrl,
          sitePort: actualSitePort,
          siteUrl: actualSiteUrl,
          adminUrl: `${systemInfo.cmsUrl}/admin`,
          updatedAt: new Date().toISOString()
        },
        null,
        2
      )
    );
  } catch (err) {
    logger.warn('Failed to write .active-ports.json', { error: String(err) });
  }

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down server...');
    try {
      if (fs.existsSync(activePortsFilePath)) {
        fs.unlinkSync(activePortsFilePath);
      }
    } catch {}

    server.close(() => {
      logger.info('Aero CMS server gracefully stopped');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  logger.error('Fatal Server Startup Error', { error: String(err) });
  process.exit(1);
});

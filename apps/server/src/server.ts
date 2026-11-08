import express from 'express';
import type { Server } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createApp, getWebsiteAliases } from './app.js';
import { config } from './config/env.js';
import { initializeStorage } from './storage/storageInit.js';
import { SessionStore } from './storage/sessionStore.js';
import { logger, findAvailablePort } from '@cms/utils';
import { systemInfo } from './systemInfo.js';

const activePortsFilePath = path.resolve(config.STORAGE_PATH, '..', '.active-ports.json');

async function startServer(): Promise<void> {
  // 1. Initialize filesystem storage
  await initializeStorage();

  // 1.5 Auto-generate static site on startup if output index.html doesn't exist
  const outputIndexPath = path.join(config.OUTPUT_PATH, 'index.html');
  if (!fs.existsSync(outputIndexPath)) {
    try {
      const { StaticSiteGenerator } = await import('@cms/generator');
      const generator = new StaticSiteGenerator({
        storagePath: config.STORAGE_PATH,
        templatesPath: config.TEMPLATES_PATH,
        outputPath: config.OUTPUT_PATH
      });
      await generator.build();
      logger.info('Auto-generated initial static website on server startup');
    } catch (genErr) {
      logger.warn('Initial static website generation deferred', { error: String(genErr) });
    }
  }

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
    console.log('\n\x1b[43m\x1b[30m ⚠️  PORT CONFLICT NOTICE \x1b[0m');
    console.log(`\x1b[33mPreferred port ${preferredCmsPort} is already in use by another application.\x1b[0m`);
    console.log(`\x1b[32mPlanfo CMS has automatically bound to: http://${config.CMS_HOST}:${actualCmsPort}\x1b[0m`);
    console.log(`\x1b[33m👉 Make sure to visit: http://${config.CMS_HOST}:${actualCmsPort}/admin (do not use :${preferredCmsPort})\x1b[0m\n`);
    logger.warn(
      `⚠️ CMS port ${preferredCmsPort} in use. Switched to ${actualCmsPort}`
    );
  }

  // 4. Create CMS Unified Server (Website, Admin & API on 1 single host/port)
  const app = createApp();
  const server = app.listen(actualCmsPort, config.CMS_HOST, () => {
    const aliases = getWebsiteAliases();
    const primaryAlias = aliases.find((a: string) => a !== 'website' && a !== 'site') || 'website';
    logger.info(`⚡ Planfo CMS Unified Server running at http://${config.CMS_HOST}:${actualCmsPort}`);
    logger.info(`🌐 Public Website:       http://${config.CMS_HOST}:${actualCmsPort}/`);
    logger.info(`🌐 Website Named Alias:  http://${config.CMS_HOST}:${actualCmsPort}/${primaryAlias}/`);
    logger.info(`🛠️  Admin Dashboard:      http://${config.CMS_HOST}:${actualCmsPort}/admin`);
    logger.info(`🔌 REST API:             http://${config.CMS_HOST}:${actualCmsPort}/api`);
    logger.info(`🔑 Admin Login:          admin / admin123`);
    logger.info(`📂 Storage Root:         ${config.STORAGE_PATH}`);
    logger.info(`🌐 Static Output:        ${config.OUTPUT_PATH}`);
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
  const portsPayload = JSON.stringify(
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
  );

  try {
    fs.writeFileSync(activePortsFilePath, portsPayload);
    const workspacePortsFile = path.resolve(config.WORKSPACE_ROOT, '.active-ports.json');
    if (workspacePortsFile !== activePortsFilePath) {
      fs.writeFileSync(workspacePortsFile, portsPayload);
    }
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
      const workspacePortsFile = path.resolve(config.WORKSPACE_ROOT, '.active-ports.json');
      if (fs.existsSync(workspacePortsFile)) {
        fs.unlinkSync(workspacePortsFile);
      }
    } catch {}

    server.close(() => {
      logger.info('Planfo CMS server gracefully stopped');
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

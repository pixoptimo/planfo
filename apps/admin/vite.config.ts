import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as fs from 'node:fs';
import * as path from 'node:path';

function getTargetCmsUrl(): string {
  try {
    const portsFile = path.resolve(__dirname, '../../.active-ports.json');
    if (fs.existsSync(portsFile)) {
      const data = JSON.parse(fs.readFileSync(portsFile, 'utf8'));
      if (data.cmsUrl) {
        return data.cmsUrl;
      }
      if (data.cmsPort) {
        return `http://localhost:${data.cmsPort}`;
      }
    }
  } catch {}

  const envPort = process.env.CMS_PORT || '4000';
  const envHost = process.env.CMS_HOST || 'localhost';
  return `http://${envHost}:${envPort}`;
}

export default defineConfig({
  base: '/admin/',
  plugins: [react() as any],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: getTargetCmsUrl(),
        changeOrigin: true
      },
      '/media': {
        target: getTargetCmsUrl(),
        changeOrigin: true
      }
    }
  }
});

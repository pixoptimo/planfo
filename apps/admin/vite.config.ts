import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as fs from 'node:fs';
import * as path from 'node:path';

function getTargetCmsUrl(): string {
  const candidateFiles = [
    process.env.PLANFO_PROJECT_DIR ? path.resolve(process.env.PLANFO_PROJECT_DIR, '.active-ports.json') : null,
    path.resolve(__dirname, '../../.active-ports.json'),
    path.resolve(process.cwd(), '../../.active-ports.json'),
    path.resolve(process.cwd(), '.active-ports.json')
  ].filter(Boolean) as string[];

  for (const portsFile of candidateFiles) {
    try {
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
  }

  const envPort = process.env.CMS_PORT || '3000';
  const envHost = process.env.CMS_HOST || 'localhost';
  return `http://${envHost}:${envPort}`;
}

function createDynamicProxy(extra?: Record<string, unknown>) {
  return {
    target: getTargetCmsUrl(),
    changeOrigin: true,
    ...extra,
    configure: (proxy: any) => {
      const origWeb = proxy.web.bind(proxy);
      proxy.web = (req: any, res: any, options: any, ...rest: any[]) => {
        const liveTarget = getTargetCmsUrl();
        return origWeb(req, res, { ...options, target: liveTarget }, ...rest);
      };
    }
  };
}

export default defineConfig({
  base: '/admin/',
  plugins: [react() as any],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': createDynamicProxy(),
      '/media': createDynamicProxy(),
      '/demos': createDynamicProxy(),
      '/admin/demos': createDynamicProxy({
        rewrite: (p: string) => p.replace(/^\/admin\/demos/, '/demos')
      })
    }
  }
});

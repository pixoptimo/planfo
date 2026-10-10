export interface SystemInfo {
  cmsHost: string;
  cmsPort: number;
  cmsUrl: string;
  sitePort: number;
  siteUrl: string;
  isStaticServerRunning: boolean;
}

export const systemInfo: SystemInfo = {
  cmsHost: 'localhost',
  cmsPort: 4000,
  cmsUrl: 'http://localhost:4000',
  sitePort: 3000,
  siteUrl: 'http://localhost:3000',
  isStaticServerRunning: false
};

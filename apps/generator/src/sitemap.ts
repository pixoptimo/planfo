import type { Page, Post, Product } from '@cms/schemas';

export interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export function generateSitemapXml(
  siteUrl: string,
  pages: Page[],
  posts: Post[],
  products: Product[]
): string {
  const normalizedSiteUrl = siteUrl.replace(/\/+$/, '');
  const entries: SitemapEntry[] = [];

  // Home
  entries.push({
    loc: `${normalizedSiteUrl}/`,
    lastmod: new Date().toISOString(),
    changefreq: 'daily',
    priority: 1.0
  });

  // Pages
  for (const page of pages) {
    if (page.status === 'published' && page.slug !== 'home') {
      entries.push({
        loc: `${normalizedSiteUrl}/${page.slug}`,
        lastmod: page.updatedAt || page.createdAt,
        changefreq: 'weekly',
        priority: 0.8
      });
    }
  }

  // Blog Index
  if (posts.length > 0) {
    entries.push({
      loc: `${normalizedSiteUrl}/blog`,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 0.8
    });
  }

  // Posts
  for (const post of posts) {
    if (post.status === 'published') {
      entries.push({
        loc: `${normalizedSiteUrl}/blog/${post.slug}`,
        lastmod: post.updatedAt || post.createdAt,
        changefreq: 'monthly',
        priority: 0.7
      });
    }
  }

  // Products Index
  if (products.length > 0) {
    entries.push({
      loc: `${normalizedSiteUrl}/products`,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 0.8
    });
  }

  // Products
  for (const product of products) {
    if (product.status === 'published') {
      entries.push({
        loc: `${normalizedSiteUrl}/products/${product.slug}`,
        lastmod: product.updatedAt || product.createdAt,
        changefreq: 'weekly',
        priority: 0.8
      });
    }
  }

  const urlsXml = entries
    .map((e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod.split('T')[0]}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
}

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
  products: Product[],
  customBlueprints: Array<{ blueprint: { slug: string }; entries: Array<{ slug: string; status: string; updatedAt?: string; createdAt?: string }> }> = [],
  isSiteWideNoIndex?: boolean
): string {
  const normalizedSiteUrl = siteUrl.replace(/\/+$/, '');
  const entries: SitemapEntry[] = [];

  if (isSiteWideNoIndex) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
  }

  // Home
  const homePage = pages.find((p) => p.slug === 'home');
  const isHomeNoIndex = Boolean(
    homePage?.noIndex ||
    homePage?.seo?.noIndex ||
    homePage?.seo?.robots?.includes('noindex')
  );
  if (!isHomeNoIndex) {
    entries.push({
      loc: `${normalizedSiteUrl}/`,
      lastmod: homePage?.updatedAt || homePage?.createdAt || new Date().toISOString(),
      changefreq: 'daily',
      priority: 1.0
    });
  }

  // Pages
  for (const page of pages) {
    const isNoIndex = Boolean(page.noIndex || page.seo?.noIndex || page.seo?.robots?.includes('noindex'));
    if (page.status === 'published' && page.slug !== 'home' && !isNoIndex) {
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

  // Custom Blueprints
  for (const { blueprint: bp, entries: bpEntries } of customBlueprints) {
    if (bp.slug === 'products' && products.length > 0) continue; // Avoid duplicate if standard products exist
    entries.push({
      loc: `${normalizedSiteUrl}/${bp.slug}`,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 0.8
    });
    for (const entry of bpEntries) {
      if (entry.status === 'published') {
        entries.push({
          loc: `${normalizedSiteUrl}/${bp.slug}/${entry.slug}`,
          lastmod: entry.updatedAt || entry.createdAt || new Date().toISOString(),
          changefreq: 'weekly',
          priority: 0.8
        });
      }
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

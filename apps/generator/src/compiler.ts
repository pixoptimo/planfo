import ejs from 'ejs';
import path from 'node:path';
import fs from 'node:fs/promises';
import { renderStructuredContent, escapeHtml, escapeAttribute } from '@cms/utils';
import type { SEO, SiteSettings, StructuredContent, Menu } from '@cms/schemas';
import type { TemplateContext } from '@cms/types';

export class TemplateCompiler {
  private templatesDir: string;
  private templateCache: Map<string, string> = new Map();

  constructor(templatesDir: string) {
    this.templatesDir = templatesDir;
  }

  private async loadTemplate(templatePath: string): Promise<string> {
    const fullPath = path.isAbsolute(templatePath)
      ? templatePath
      : path.join(this.templatesDir, templatePath);

    if (this.templateCache.has(fullPath)) {
      return this.templateCache.get(fullPath)!;
    }

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      this.templateCache.set(fullPath, content);
      return content;
    } catch (err) {
      throw new Error(`Template not found at "${fullPath}": ${String(err)}`);
    }
  }

  async templateExists(templatePath: string): Promise<boolean> {
    const fullPath = path.isAbsolute(templatePath)
      ? templatePath
      : path.join(this.templatesDir, templatePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  formatPrice(amount: number, currency = 'USD'): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  renderMetaTags(
    seo: SEO | undefined,
    site: SiteSettings,
    fallbackTitle: string,
    fallbackDesc: string,
    fallbackImage?: string,
    itemNoIndex?: boolean
  ): string {
    const title = escapeHtml(seo?.title || fallbackTitle || site.defaultSEO.title || site.siteName);
    const desc = escapeAttribute(seo?.description || fallbackDesc || site.defaultSEO.description || site.tagline);

    // Site-wide search engine indexing directive:
    // If "Discourage search engines from indexing this entire website" is enabled,
    // it MUST enforce noindex across all pages.
    const isSiteWideNoIndex = Boolean(
      (site?.defaultSEO as any)?.noIndex ||
      site?.defaultSEO?.robots?.includes('noindex')
    );

    // Individual item no-index directive:
    const isItemNoIndex = Boolean(
      itemNoIndex ||
      (seo as any)?.noIndex ||
      seo?.robots?.includes('noindex')
    );

    let robots: string;
    if (isSiteWideNoIndex) {
      robots = site?.defaultSEO?.robots?.includes('noindex')
        ? escapeAttribute(site.defaultSEO.robots)
        : 'noindex,nofollow';
    } else if (isItemNoIndex) {
      robots = seo?.robots?.includes('noindex')
        ? escapeAttribute(seo.robots)
        : 'noindex,nofollow';
    } else {
      robots = escapeAttribute(seo?.robots || site?.defaultSEO?.robots || 'index,follow');
    }

    const ogTitle = escapeAttribute(seo?.ogTitle || title);
    const ogDesc = escapeAttribute(seo?.ogDescription || desc);
    const ogImage = escapeAttribute(seo?.ogImage || fallbackImage || site.defaultSEO.ogImage || site.logo || '');
    const canonical = escapeAttribute(seo?.canonical || site.siteUrl);

    return `
    <title>${title} | ${escapeHtml(site.siteName)}</title>
    <meta name="description" content="${desc}">
    <meta name="robots" content="${robots}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${ogTitle}">
    <meta property="og:description" content="${ogDesc}">
    ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${ogTitle}">
    <meta name="twitter:description" content="${ogDesc}">
    ${ogImage ? `<meta name="twitter:image" content="${ogImage}">` : ''}
    `;
  }

  async render(
    templateRelPath: string,
    context: Partial<TemplateContext> & {
      site: SiteSettings;
      menu: Menu | null;
      headerMenu?: Menu | null;
      footerMenu?: Menu | null;
      menus?: Menu[];
    }
  ): Promise<string> {
    const templateContent = await this.loadTemplate(templateRelPath);
    const layoutContent = await this.loadTemplate('layout.html');

    const fullContext = {
      site: context.site,
      menu: context.menu,
      headerMenu: context.headerMenu || context.menu,
      footerMenu: context.footerMenu || null,
      menus: context.menus || [],
      page: context.page,
      pages: (context as any).pages || [],
      post: context.post,
      product: context.product,
      template: (context as any).template || context.product,
      entry: (context as any).entry,
      entries: (context as any).entries || [],
      blueprint: (context as any).blueprint,
      posts: context.posts,
      products: context.products,
      templates: (context as any).templates || context.products || [],
      categories: context.categories,
      category: context.category,
      tag: context.tag,
      activeSlug: context.activeSlug,
      currentYear: new Date().getFullYear(),
      mediaUrl: (url: string) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
        return url.startsWith('/') ? url : `/${url}`;
      },
      renderContent: (c: any) => renderStructuredContent(c),
      formatDate: (d: string) => this.formatDate(d),
      formatPrice: (amt: number, curr: string) => this.formatPrice(amt, curr),
      escapeHtml: (s: string) => escapeHtml(s),
      escapeAttribute: (s: string) => escapeAttribute(s),
      safeJson: (obj: any) => JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
    };

    // Render body using the specific template
    const bodyHtml = ejs.render(templateContent, fullContext, {
      views: [this.templatesDir]
    });

    let finalHtml = bodyHtml;

    // Only wrap in layout if bodyHtml is not already a standalone HTML document
    if (!bodyHtml.trim().startsWith('<!DOCTYPE html') && !bodyHtml.includes('<html')) {
      // Derive meta tags
      let fallbackTitle =
        context.page?.title ||
        context.post?.title ||
        context.product?.name ||
        (context as any).entry?.title ||
        (context as any).template?.title ||
        (context as any).template?.name ||
        context.site.siteName;
      let fallbackDesc =
        context.post?.excerpt ||
        context.product?.shortDescription ||
        (context as any).entry?.excerpt ||
        (context as any).template?.excerpt ||
        (context as any).template?.shortDescription ||
        context.site.tagline;
      let fallbackImage =
        context.page?.featuredImage ||
        context.post?.featuredImage ||
        context.product?.images?.[0] ||
        (context as any).entry?.featuredImage ||
        (context as any).template?.featuredImage ||
        (context as any).template?.images?.[0] ||
        '';
      let seoObj =
        context.page?.seo ||
        context.post?.seo ||
        context.product?.seo ||
        (context as any).entry?.seo ||
        (context as any).template?.seo ||
        context.site.defaultSEO;

      const itemNoIndex = Boolean(
        context.page?.noIndex ||
        (context.page?.seo as any)?.noIndex ||
        (context.post as any)?.noIndex ||
        (context.post?.seo as any)?.noIndex ||
        (context.product as any)?.noIndex ||
        (context.product?.seo as any)?.noIndex ||
        (context as any).entry?.noIndex ||
        ((context as any).entry?.seo as any)?.noIndex ||
        (context as any).template?.noIndex ||
        ((context as any).template?.seo as any)?.noIndex
      );

      const metaTags = this.renderMetaTags(seoObj, context.site, fallbackTitle, fallbackDesc, fallbackImage, itemNoIndex);

      // Render layout wrapper
      finalHtml = ejs.render(
        layoutContent,
        {
          ...fullContext,
          body: bodyHtml,
          metaTags
        },
        { views: [this.templatesDir] }
      );
    }

    // Self-healing URL normalizer:
    // Ensures any internal links referencing products/templates under /blog/ are automatically corrected
    let sanitizedHtml = finalHtml;
    const allItems = [...((context as any).templates || []), ...(context.products || [])];
    if (allItems.length > 0) {
      for (const item of allItems) {
        if (item && item.slug) {
          sanitizedHtml = sanitizedHtml.replaceAll(
            `/blog/${item.slug}`,
            item.url || `/templates/${item.slug}`
          );
        }
      }
    }

    return sanitizedHtml;
  }
}

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
    fallbackImage?: string
  ): string {
    const title = escapeHtml(seo?.title || fallbackTitle || site.defaultSEO.title || site.siteName);
    const desc = escapeAttribute(seo?.description || fallbackDesc || site.defaultSEO.description || site.tagline);
    const robots = escapeAttribute(seo?.robots || site.defaultSEO.robots || 'index,follow');
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
    }
  ): Promise<string> {
    const templateContent = await this.loadTemplate(templateRelPath);
    const layoutContent = await this.loadTemplate('layout.html');

    const fullContext = {
      site: context.site,
      menu: context.menu,
      page: context.page,
      pages: (context as any).pages || [],
      post: context.post,
      product: context.product,
      posts: context.posts,
      products: context.products,
      categories: context.categories,
      category: context.category,
      tag: context.tag,
      activeSlug: context.activeSlug,
      currentYear: new Date().getFullYear(),
      renderContent: (c: any) => renderStructuredContent(c),
      formatDate: (d: string) => this.formatDate(d),
      formatPrice: (amt: number, curr: string) => this.formatPrice(amt, curr),
      escapeHtml: (s: string) => escapeHtml(s),
      escapeAttribute: (s: string) => escapeAttribute(s)
    };

    // Render body using the specific template
    const bodyHtml = ejs.render(templateContent, fullContext, {
      views: [this.templatesDir]
    });

    // Derive meta tags
    let fallbackTitle = context.page?.title || context.post?.title || context.product?.name || context.site.siteName;
    let fallbackDesc = context.post?.excerpt || context.product?.shortDescription || context.site.tagline;
    let fallbackImage = context.page?.featuredImage || context.post?.featuredImage || context.product?.images?.[0] || '';
    let seoObj = context.page?.seo || context.post?.seo || context.product?.seo || context.site.defaultSEO;

    const metaTags = this.renderMetaTags(seoObj, context.site, fallbackTitle, fallbackDesc, fallbackImage);

    // Render layout wrapper
    const finalHtml = ejs.render(
      layoutContent,
      {
        ...fullContext,
        body: bodyHtml,
        metaTags
      },
      { views: [this.templatesDir] }
    );

    // Self-healing URL normalizer:
    // Ensures any internal links referencing products under /blog/ are automatically corrected to /products/
    let sanitizedHtml = finalHtml;
    if (Array.isArray(context.products) && context.products.length > 0) {
      for (const prod of context.products) {
        if (prod.slug) {
          sanitizedHtml = sanitizedHtml.replaceAll(
            `/blog/${prod.slug}`,
            `/products/${prod.slug}`
          );
        }
      }
    }

    return sanitizedHtml;
  }
}

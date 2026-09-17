import path from 'node:path';
import fs from 'node:fs/promises';
import {
  ensureDir,
  writeFileAtomic,
  copyDirRecursive,
  pathExists,
  readJson,
  listJsonFiles,
  logger
} from '@cms/utils';
import {
  PageSchema,
  PostSchema,
  ProductSchema,
  CategoriesFileSchema,
  MenuSchema,
  SiteSettingsSchema,
  type Page,
  type Post,
  type Product,
  type Category,
  type Menu,
  type SiteSettings
} from '@cms/schemas';
import type { PublishResult, PublisherType } from '@cms/types';
import { TemplateCompiler } from './compiler.js';
import { generateSitemapXml } from './sitemap.js';
import { generateRobotsTxt } from './robots.js';
import { createPublisher } from './publishers/publisherFactory.js';

export interface GeneratorOptions {
  storagePath: string;
  templatesPath: string;
  outputPath: string;
  publisherType?: PublisherType;
}

export class StaticSiteGenerator {
  private options: GeneratorOptions;
  private compiler: TemplateCompiler;

  constructor(options: GeneratorOptions) {
    this.options = options;
    this.compiler = new TemplateCompiler(options.templatesPath);
  }

  async loadSiteData(): Promise<{
    site: SiteSettings;
    menu: Menu | null;
    pages: Page[];
    posts: Post[];
    products: Product[];
    categories: Category[];
  }> {
    const contentPath = path.join(this.options.storagePath, 'content');

    // Settings
    let site: SiteSettings = SiteSettingsSchema.parse({});
    try {
      site = await readJson<SiteSettings>(
        path.join(this.options.storagePath, 'settings', 'site.json'),
        SiteSettingsSchema
      );
    } catch {
      // Use defaults
    }

    // Menu
    let menu: Menu | null = null;
    try {
      menu = await readJson<Menu>(path.join(contentPath, 'menus', 'main.json'), MenuSchema);
    } catch {
      // Null menu
    }

    // Categories
    let categories: Category[] = [];
    try {
      const catFile = await readJson<{ categories: Category[] }>(
        path.join(contentPath, 'categories', 'index.json'),
        CategoriesFileSchema
      );
      categories = catFile.categories;
    } catch {
      // Empty
    }

    // Pages (only published)
    const pageFiles = await listJsonFiles(path.join(contentPath, 'pages'));
    const pages: Page[] = [];
    for (const f of pageFiles) {
      try {
        const p = await readJson<Page>(f, PageSchema);
        if (p.status === 'published') pages.push(p);
      } catch {
        // Skip
      }
    }

    // Posts (only published)
    const postFiles = await listJsonFiles(path.join(contentPath, 'posts'));
    const posts: Post[] = [];
    for (const f of postFiles) {
      try {
        const p = await readJson<Post>(f, PostSchema);
        if (p.status === 'published') posts.push(p);
      } catch {
        // Skip
      }
    }

    // Products (only published)
    const productFiles = await listJsonFiles(path.join(contentPath, 'products'));
    const products: Product[] = [];
    for (const f of productFiles) {
      try {
        const p = await readJson<Product>(f, ProductSchema);
        if (p.status === 'published') products.push(p);
      } catch {
        // Skip
      }
    }

    return { site, menu, pages, posts, products, categories };
  }

  async build(): Promise<PublishResult> {
    const startTime = Date.now();
    const stagingDir = path.join(
      path.dirname(this.options.outputPath),
      `.staging-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    );

    await ensureDir(stagingDir);

    try {
      const { site, menu, pages, posts, products, categories } = await this.loadSiteData();
      const stats = {
        pagesGenerated: 0,
        postsGenerated: 0,
        productsGenerated: 0,
        taxonomiesGenerated: 0,
        assetsCopied: 0,
        sitemapGenerated: false,
        robotsGenerated: false
      };

      // 1. Generate Home Page
      const homePage = pages.find((p) => p.slug === 'home');
      const homeHtml = await this.compiler.render(
        homePage ? `page/${homePage.template || 'default'}.html` : 'home.html',
        {
          site,
          menu,
          page: homePage,
          posts: posts.slice(0, 3),
          products: products.slice(0, 4),
          activeSlug: 'home'
        }
      );
      await writeFileAtomic(path.join(stagingDir, 'index.html'), homeHtml);
      stats.pagesGenerated++;

      // 2. Generate Standalone Pages
      for (const page of pages) {
        if (page.slug === 'home') continue;
        const pageDir = path.join(stagingDir, page.slug);
        await ensureDir(pageDir);
        const templateFile = `page/${page.template || 'default'}.html`;
        const html = await this.compiler.render(templateFile, {
          site,
          menu,
          page,
          activeSlug: page.slug
        });
        await writeFileAtomic(path.join(pageDir, 'index.html'), html);
        stats.pagesGenerated++;
      }

      // 3. Generate Blog Index & Posts
      if (posts.length > 0) {
        const blogDir = path.join(stagingDir, 'blog');
        await ensureDir(blogDir);

        // Blog listing
        const blogIndexHtml = await this.compiler.render('post/list.html', {
          site,
          menu,
          posts,
          categories: categories.filter((c) => c.type === 'post'),
          activeSlug: 'blog'
        });
        await writeFileAtomic(path.join(blogDir, 'index.html'), blogIndexHtml);
        stats.pagesGenerated++;

        // Individual posts
        for (const post of posts) {
          const postDir = path.join(blogDir, post.slug);
          await ensureDir(postDir);
          const postHtml = await this.compiler.render(`post/${post.template || 'default'}.html`, {
            site,
            menu,
            post,
            posts: posts.filter((p) => p.id !== post.id).slice(0, 3),
            activeSlug: 'blog'
          });
          await writeFileAtomic(path.join(postDir, 'index.html'), postHtml);
          stats.postsGenerated++;
        }

        // Category archive pages
        const postCategories = categories.filter((c) => c.type === 'post');
        for (const cat of postCategories) {
          const catPosts = posts.filter((p) => p.category === cat.slug);
          const catDir = path.join(blogDir, 'category', cat.slug);
          await ensureDir(catDir);
          const catHtml = await this.compiler.render('post/list.html', {
            site,
            menu,
            posts: catPosts,
            category: cat,
            categories: postCategories,
            activeSlug: 'blog'
          });
          await writeFileAtomic(path.join(catDir, 'index.html'), catHtml);
          stats.taxonomiesGenerated++;
        }
      }

      // 4. Generate Products Catalog & Details
      if (products.length > 0) {
        const productsDir = path.join(stagingDir, 'products');
        await ensureDir(productsDir);

        // Product Catalog listing
        const catalogHtml = await this.compiler.render('product/list.html', {
          site,
          menu,
          products,
          categories: categories.filter((c) => c.type === 'product'),
          activeSlug: 'products'
        });
        await writeFileAtomic(path.join(productsDir, 'index.html'), catalogHtml);
        stats.pagesGenerated++;

        // Individual products
        for (const product of products) {
          const prodDir = path.join(productsDir, product.slug);
          await ensureDir(prodDir);
          const prodHtml = await this.compiler.render(`product/${product.template || 'default'}.html`, {
            site,
            menu,
            product,
            products: products.filter((p) => p.id !== product.id).slice(0, 4),
            activeSlug: 'products'
          });
          await writeFileAtomic(path.join(prodDir, 'index.html'), prodHtml);
          stats.productsGenerated++;
        }

        // Product Category pages
        const prodCategories = categories.filter((c) => c.type === 'product');
        for (const cat of prodCategories) {
          const catProducts = products.filter((p) => p.category === cat.slug);
          const catDir = path.join(productsDir, 'category', cat.slug);
          await ensureDir(catDir);
          const catHtml = await this.compiler.render('product/list.html', {
            site,
            menu,
            products: catProducts,
            category: cat,
            categories: prodCategories,
            activeSlug: 'products'
          });
          await writeFileAtomic(path.join(catDir, 'index.html'), catHtml);
          stats.taxonomiesGenerated++;
        }
      }

      // 5. Generate Sitemap & Robots.txt
      const sitemapContent = generateSitemapXml(site.siteUrl, pages, posts, products);
      await writeFileAtomic(path.join(stagingDir, 'sitemap.xml'), sitemapContent);
      stats.sitemapGenerated = true;

      const robotsContent = generateRobotsTxt(site.siteUrl);
      await writeFileAtomic(path.join(stagingDir, 'robots.txt'), robotsContent);
      stats.robotsGenerated = true;

      // 6. Copy Media and Assets
      const mediaSource = path.join(this.options.storagePath, 'media');
      if (await pathExists(mediaSource)) {
        await copyDirRecursive(mediaSource, path.join(stagingDir, 'media'));
        stats.assetsCopied++;
      }

      const templateAssets = path.join(this.options.templatesPath, 'assets');
      if (await pathExists(templateAssets)) {
        await copyDirRecursive(templateAssets, path.join(stagingDir, 'assets'));
        stats.assetsCopied++;
      }

      // 7. Deploy via Publisher abstraction
      const publisher = createPublisher(this.options.publisherType || 'local');
      await publisher.deploy(stagingDir, this.options.outputPath);

      const durationMs = Date.now() - startTime;
      logger.audit('Static Site Generated and Published Successfully', {
        durationMs,
        stats
      });

      return {
        success: true,
        publishedAt: new Date().toISOString(),
        durationMs,
        stats,
        outputPath: this.options.outputPath
      };
    } catch (err) {
      // Clean up staging directory on error
      try {
        if (await pathExists(stagingDir)) {
          await fs.rm(stagingDir, { recursive: true, force: true });
        }
      } catch {
        // Ignore
      }

      logger.error('Static site generation failed', { error: String(err) });
      throw err;
    }
  }

  /**
   * Preview a single item (page, post, product) using draft or modified content.
   */
  async renderPreview(
    type: 'page' | 'post' | 'product',
    item: Page | Post | Product
  ): Promise<string> {
    const { site, menu } = await this.loadSiteData();
    let templateFile = `${type}/${item.template || 'default'}.html`;

    if (type === 'page') {
      return await this.compiler.render(templateFile, {
        site,
        menu,
        page: item as Page,
        activeSlug: item.slug
      });
    } else if (type === 'post') {
      return await this.compiler.render(templateFile, {
        site,
        menu,
        post: item as Post,
        activeSlug: 'blog'
      });
    } else {
      return await this.compiler.render(templateFile, {
        site,
        menu,
        product: item as Product,
        activeSlug: 'products'
      });
    }
  }
}

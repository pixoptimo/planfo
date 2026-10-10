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
  BlueprintSchema,
  BlueprintEntrySchema,
  type Page,
  type Post,
  type Product,
  type Category,
  type Menu,
  type SiteSettings,
  type Blueprint,
  type BlueprintEntry
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
  publisherOptions?: Record<string, unknown>;
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
    customBlueprints: Array<{ blueprint: Blueprint; entries: BlueprintEntry[] }>;
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
      try {
        site = await readJson<SiteSettings>(
          path.join(this.options.storagePath, 'settings.json'),
          SiteSettingsSchema
        );
      } catch {
        // Use defaults
      }
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

    // Custom Blueprints (only published entries)
    const blueprintsDir = path.join(this.options.storagePath, 'blueprints');
    const customBlueprints: Array<{ blueprint: Blueprint; entries: BlueprintEntry[] }> = [];
    if (await pathExists(blueprintsDir)) {
      const blueprintFiles = await listJsonFiles(blueprintsDir);
      for (const bf of blueprintFiles) {
        try {
          const bp = await readJson<Blueprint>(bf, BlueprintSchema);
          if (bp.isBuiltIn) continue;

          const entriesDir = path.join(contentPath, bp.slug);
          const entries: BlueprintEntry[] = [];
          if (await pathExists(entriesDir)) {
            const entryFiles = await listJsonFiles(entriesDir);
            for (const ef of entryFiles) {
              try {
                const raw = await readJson<any>(ef);
                const normalized = {
                  id: raw.id || `ent_${Date.now()}`,
                  blueprintId: raw.blueprintId || bp.slug,
                  title: raw.title || raw.name || 'Untitled',
                  slug: raw.slug,
                  status: raw.status === 'published' ? 'published' : 'draft',
                  publishedAt: raw.publishedAt || null,
                  category: raw.category || 'general',
                  tags: Array.isArray(raw.tags) ? raw.tags : [],
                  excerpt: raw.excerpt || raw.shortDescription || '',
                  featuredImage: raw.featuredImage || (Array.isArray(raw.images) && raw.images[0]) || '',
                  data: raw.data || {
                    ...(raw.price !== undefined ? { price: raw.price } : {}),
                    ...(raw.sku ? { sku: raw.sku } : {})
                  },
                  content: raw.content || raw.description || { blocks: [] },
                  seo: raw.seo,
                  createdAt: raw.createdAt || new Date().toISOString(),
                  updatedAt: raw.updatedAt || new Date().toISOString()
                };
                const entry = BlueprintEntrySchema.parse(normalized);
                if (entry.status === 'published') entries.push(entry);
              } catch {
                // Skip
              }
            }
          }
          customBlueprints.push({ blueprint: bp, entries });
        } catch {
          // Skip
        }
      }
    }

    return { site, menu, pages, posts, products, categories, customBlueprints };
  }

  async build(): Promise<PublishResult> {
    const startTime = Date.now();
    const stagingDir = path.join(
      path.dirname(this.options.outputPath),
      `.staging-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    );

    await ensureDir(stagingDir);

    try {
      const { site, menu, pages, posts, products, categories, customBlueprints } = await this.loadSiteData();

      // Resolve effective theme directory
      const workspaceRoot = path.resolve(this.options.storagePath, '..');
      let effectiveTemplatesDir = this.options.templatesPath;

      const activeThemeId = site.activeTheme || 'planfo-default';
      const candidatePaths = [
        path.join(workspaceRoot, 'planfo', 'themes', activeThemeId),
        path.join(workspaceRoot, '.planfo', 'themes', activeThemeId),
        path.join(workspaceRoot, 'themes', activeThemeId),
        path.join(this.options.templatesPath, activeThemeId),
        path.join(workspaceRoot, 'planfo', 'themes', 'planfo-default'),
        path.join(workspaceRoot, '.planfo', 'themes', 'planfo-default'),
        path.join(workspaceRoot, 'themes', 'planfo-default'),
        path.join(workspaceRoot, 'themes', 'aero-modern'),
        this.options.templatesPath
      ];

      for (const candidate of candidatePaths) {
        if ((await pathExists(path.join(candidate, 'layout.html'))) || (await pathExists(path.join(candidate, 'index.html')))) {
          effectiveTemplatesDir = candidate;
          break;
        }
      }

      this.compiler = new TemplateCompiler(effectiveTemplatesDir);

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
      const effectiveProducts = products.length > 0
        ? products.map(p => ({ ...p, url: `/products/${p.slug}` }))
        : (customBlueprints.find(cb => cb.blueprint.slug === 'products')?.entries.map(e => ({
            ...e,
            name: e.title,
            price: e.data?.price ?? 0,
            currency: e.data?.currency ?? 'USD',
            images: e.featuredImage ? [e.featuredImage] : (Array.isArray(e.data?.images) ? e.data.images : []),
            shortDescription: e.excerpt,
            url: `/products/${e.slug}`
          })) as any || []);

      const postsWithUrls = posts.map(p => ({ ...p, url: `/blog/${p.slug}` }));

      const homePage = pages.find((p) => p.slug === 'home');
      let homeTemplate = 'index.html';
      if (homePage?.template) {
        const candidate = `page/${homePage.template}.html`;
        if (await this.compiler.templateExists(candidate)) {
          homeTemplate = candidate;
        } else if (await this.compiler.templateExists('index.html')) {
          homeTemplate = 'index.html';
        } else if (await this.compiler.templateExists('home.html')) {
          homeTemplate = 'home.html';
        } else if (await this.compiler.templateExists('page/default.html')) {
          homeTemplate = 'page/default.html';
        } else if (await this.compiler.templateExists('page.html')) {
          homeTemplate = 'page.html';
        }
      } else if (await this.compiler.templateExists('index.html')) {
        homeTemplate = 'index.html';
      } else if (await this.compiler.templateExists('home.html')) {
        homeTemplate = 'home.html';
      } else if (await this.compiler.templateExists('page/default.html')) {
        homeTemplate = 'page/default.html';
      } else if (await this.compiler.templateExists('page.html')) {
        homeTemplate = 'page.html';
      }

      const homeHtml = await this.compiler.render(
        homeTemplate,
        {
          site,
          menu,
          page: homePage,
          pages: pages.filter((p) => p.status === 'published'),
          posts: postsWithUrls.slice(0, 3),
          products: effectiveProducts.slice(0, 4),
          activeSlug: 'home'
        } as any
      );
      await writeFileAtomic(path.join(stagingDir, 'index.html'), homeHtml);
      stats.pagesGenerated++;

      // 2. Generate Standalone Pages
      for (const page of pages) {
        if (page.slug === 'home') continue;
        const pageDir = path.join(stagingDir, page.slug);
        await ensureDir(pageDir);
        let templateFile = `page/${page.template || 'default'}.html`;
        if (!(await this.compiler.templateExists(templateFile))) {
          if (await this.compiler.templateExists('page.html')) {
            templateFile = 'page.html';
          } else if (await this.compiler.templateExists('page/default.html')) {
            templateFile = 'page/default.html';
          }
        }
        const html = await this.compiler.render(templateFile, {
          site,
          menu,
          page,
          pages: pages.filter((p) => p.status === 'published'),
          activeSlug: page.slug
        } as any);
        await writeFileAtomic(path.join(pageDir, 'index.html'), html);
        stats.pagesGenerated++;
      }

      // 3. Generate Blog Index & Posts
      if (posts.length > 0) {
        const blogDir = path.join(stagingDir, 'blog');
        await ensureDir(blogDir);

        // Blog listing
        let blogTemplate = 'post/list.html';
        if (!(await this.compiler.templateExists(blogTemplate))) {
          blogTemplate = 'post/archive.html';
        }
        const blogIndexHtml = await this.compiler.render(blogTemplate, {
          site,
          menu,
          posts: postsWithUrls,
          categories: categories.filter((c) => c.type === 'post'),
          activeSlug: 'blog'
        });
        await writeFileAtomic(path.join(blogDir, 'index.html'), blogIndexHtml);
        stats.pagesGenerated++;

        // Individual posts
        for (const post of postsWithUrls) {
          const postDir = path.join(blogDir, post.slug);
          await ensureDir(postDir);
          let postTemplate = `post/${post.template || 'default'}.html`;
          if (!(await this.compiler.templateExists(postTemplate))) {
            postTemplate = 'post/default.html';
          }
          const postHtml = await this.compiler.render(postTemplate, {
            site,
            menu,
            post,
            posts: postsWithUrls.filter((p) => p.id !== post.id).slice(0, 3),
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
          let catTemplate = 'post/list.html';
          if (!(await this.compiler.templateExists(catTemplate))) {
            catTemplate = 'post/archive.html';
          }
          const catHtml = await this.compiler.render(catTemplate, {
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

      // 4. Generate Products Catalog & Details (Only if Storefront Catalog pack is enabled)
      const isCatalogPackEnabled = site.featurePacks?.catalog === true;
      if (isCatalogPackEnabled && products.length > 0) {
        const productsDir = path.join(stagingDir, 'products');
        await ensureDir(productsDir);

        // Product Catalog listing
        let catalogTemplate = 'product/list.html';
        if (!(await this.compiler.templateExists(catalogTemplate))) {
          catalogTemplate = 'product/archive.html';
        }
        const catalogHtml = await this.compiler.render(catalogTemplate, {
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
          let prodTemplate = `product/${product.template || 'default'}.html`;
          if (!(await this.compiler.templateExists(prodTemplate))) {
            prodTemplate = 'product/default.html';
          }
          const prodHtml = await this.compiler.render(prodTemplate, {
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
          let prodCatTemplate = 'product/list.html';
          if (!(await this.compiler.templateExists(prodCatTemplate))) {
            prodCatTemplate = 'product/archive.html';
          }
          const catHtml = await this.compiler.render(prodCatTemplate, {
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

      // 4.5 Generate Custom Blueprints
      for (const { blueprint: bp, entries: bpEntries } of customBlueprints) {
        const bpDir = path.join(stagingDir, bp.slug);
        await ensureDir(bpDir);

        const defaultSeo = {
          title: '',
          description: '',
          canonical: '',
          ogTitle: '',
          ogDescription: '',
          ogImage: '',
          robots: 'index,follow'
        };

        // Determine list and detail templates
        let listTemplate = `${bp.slug}/list.html`;
        let detailTemplate = `${bp.slug}/default.html`;
        if (!(await this.compiler.templateExists(listTemplate))) {
          if (bp.slug === 'products' && (await this.compiler.templateExists('product/list.html'))) {
            listTemplate = 'product/list.html';
          } else {
            listTemplate = 'post/list.html';
          }
        }
        if (!(await this.compiler.templateExists(detailTemplate))) {
          if (bp.slug === 'products' && (await this.compiler.templateExists('product/default.html'))) {
            detailTemplate = 'product/default.html';
          } else {
            detailTemplate = 'post/default.html';
          }
        }

        // Blueprint Archive / List Page
        const adaptedPosts = bpEntries.map((e) => ({
          ...e,
          name: e.title,
          sku: (e.data?.sku as string) || '',
          featured: Boolean(e.data?.featured),
          description: e.content || { blocks: [] },
          price: e.data?.price ?? 0,
          currency: e.data?.currency ?? 'USD',
          images: e.featuredImage ? [e.featuredImage] : (Array.isArray(e.data?.images) ? e.data.images : []),
          shortDescription: e.excerpt,
          url: `/${bp.slug}/${e.slug}`,
          author: 'Admin',
          template: 'default',
          status: 'published' as const,
          publishedAt: e.publishedAt || null,
          seo: e.seo || defaultSeo
        }));

        const listHtml = await this.compiler.render(listTemplate, {
          site,
          menu,
          blueprint: bp,
          entries: bpEntries,
          posts: adaptedPosts as any,
          products: adaptedPosts as any,
          activeSlug: bp.slug
        });
        await writeFileAtomic(path.join(bpDir, 'index.html'), listHtml);
        stats.pagesGenerated++;

        // Individual entries
        for (const entry of bpEntries) {
          const entryDir = path.join(bpDir, entry.slug);
          await ensureDir(entryDir);
          const adaptedEntry = {
            ...entry,
            name: entry.title,
            sku: (entry.data?.sku as string) || '',
            featured: Boolean(entry.data?.featured),
            description: entry.content || { blocks: [] },
            price: entry.data?.price ?? 0,
            currency: entry.data?.currency ?? 'USD',
            images: entry.featuredImage ? [entry.featuredImage] : (Array.isArray(entry.data?.images) ? entry.data.images : []),
            shortDescription: entry.excerpt,
            url: `/${bp.slug}/${entry.slug}`,
            author: 'Admin',
            template: 'default',
            status: 'published' as const,
            publishedAt: entry.publishedAt || null,
            seo: entry.seo || defaultSeo
          };
          const entryHtml = await this.compiler.render(detailTemplate, {
            site,
            menu,
            blueprint: bp,
            entry: adaptedEntry,
            post: adaptedEntry as any,
            product: adaptedEntry as any,
            posts: (adaptedPosts.filter((p) => p.slug !== entry.slug).slice(0, 3) as any),
            products: (adaptedPosts.filter((p) => p.slug !== entry.slug).slice(0, 4) as any),
            activeSlug: bp.slug
          });
          await writeFileAtomic(path.join(entryDir, 'index.html'), entryHtml);
          stats.pagesGenerated++;
        }
      }

      // 5. Generate Sitemap & Robots.txt
      const sitemapContent = generateSitemapXml(
        site.siteUrl,
        pages,
        posts,
        isCatalogPackEnabled ? products : [],
        customBlueprints
      );
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

      // Copy theme assets (with fallback to default templates)
      const themeAssets = path.join(effectiveTemplatesDir, 'assets');
      if (await pathExists(themeAssets)) {
        await copyDirRecursive(themeAssets, path.join(stagingDir, 'assets'));
        stats.assetsCopied++;
      } else {
        const templateAssets = path.join(this.options.templatesPath, 'assets');
        if (await pathExists(templateAssets)) {
          await copyDirRecursive(templateAssets, path.join(stagingDir, 'assets'));
          stats.assetsCopied++;
        }
      }

      // 7. Deploy via Publisher abstraction
      const deploymentTarget = (this.options.publisherType || site.deployment?.target || 'local') as PublisherType;
      const publisherOpts = this.options.publisherOptions || {
        branch: site.deployment?.gitBranch || 'gh-pages',
        repo: site.deployment?.gitRepo,
        cname: site.deployment?.cname || site.deployment?.customDomain
      };

      const publisher = createPublisher(deploymentTarget, publisherOpts);
      await publisher.deploy(stagingDir, this.options.outputPath);
      const isValid = await publisher.validate(this.options.outputPath);
      if (!isValid) {
        throw new Error(`Deployment validation failed for output: ${this.options.outputPath}`);
      }

      const durationMs = Date.now() - startTime;
      logger.audit('Static Site Generated and Published Successfully', {
        durationMs,
        stats,
        deployment: deploymentTarget
      });

      return {
        success: true,
        publishedAt: new Date().toISOString(),
        durationMs,
        stats,
        outputPath: this.options.outputPath,
        deployment: {
          target: deploymentTarget,
          branch: (publisherOpts.branch as string) || site.deployment?.gitBranch || 'gh-pages',
          cname: (publisherOpts.cname as string) || site.deployment?.cname || site.deployment?.customDomain
        }
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

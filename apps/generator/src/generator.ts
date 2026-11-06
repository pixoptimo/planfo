import path from 'node:path';
import fs from 'node:fs/promises';
import {
  ensureDir,
  writeFileAtomic,
  copyDirRecursive,
  pathExists,
  readJson,
  listJsonFiles,
  logger,
  cleanAndOptimizeStagingDirectory
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
    headerMenu: Menu | null;
    footerMenu: Menu | null;
    menus: Menu[];
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

    // Menus
    let menus: Menu[] = [];
    let menu: Menu | null = null;
    let headerMenu: Menu | null = null;
    let footerMenu: Menu | null = null;
    try {
      const menusDir = path.join(contentPath, 'menus');
      if (await pathExists(menusDir)) {
        const files = await fs.readdir(menusDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const m = await readJson<Menu>(path.join(menusDir, file), MenuSchema);
              if (m) menus.push(m);
            } catch {
              // Ignore corrupt
            }
          }
        }
      }
    } catch {
      // Ignore
    }

    if (menus.length > 0) {
      menus.sort((a, b) => {
        if (a.slug === 'main') return -1;
        if (b.slug === 'main') return 1;
        return a.name.localeCompare(b.name);
      });
      headerMenu = menus.find(m => m.locations?.includes('header') || m.location === 'header') || menus.find(m => m.slug === 'main') || menus[0] || null;
      footerMenu = menus.find(m => m.locations?.includes('footer') || m.location === 'footer') || menus.find(m => m.slug === 'footer') || null;
      menu = headerMenu;
    } else {
      try {
        menu = await readJson<Menu>(path.join(contentPath, 'menus', 'main.json'), MenuSchema);
        if (menu) {
          menus = [menu];
          headerMenu = menu;
        }
      } catch {
        // Null menu
      }
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
    const products: any[] = [];
    for (const f of productFiles) {
      try {
        const raw = await readJson<any>(f);
        if (raw.status === 'published') {
          const normalized = {
            ...raw,
            id: raw.id || `prod_${Date.now()}`,
            name: raw.name || raw.title || 'Untitled',
            title: raw.title || raw.name || 'Untitled',
            slug: raw.slug,
            sku: raw.sku || raw.data?.sku || '',
            price: raw.price !== undefined ? raw.price : (raw.data?.price ?? 0),
            currency: raw.currency || raw.data?.currency || 'USD',
            shortDescription: raw.shortDescription || raw.excerpt || raw.data?.tagline || '',
            excerpt: raw.excerpt || raw.shortDescription || raw.data?.tagline || '',
            images: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : (raw.featuredImage ? [raw.featuredImage] : []),
            featuredImage: raw.featuredImage || (Array.isArray(raw.images) && raw.images[0]) || '',
            category: raw.category || 'general',
            tags: Array.isArray(raw.tags) ? raw.tags : [],
            data: raw.data || {},
            content: raw.content || raw.description || { blocks: [] },
            description: raw.description || raw.content || { blocks: [] },
            featured: Boolean(raw.featured || raw.data?.featured),
            template: raw.template || 'default',
            seo: raw.seo || {},
            status: 'published' as const,
            publishedAt: raw.publishedAt || null
          };
          products.push(normalized);
        }
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

    return { site, menu, headerMenu, footerMenu, menus, pages, posts, products, categories, customBlueprints };
  }

  async build(): Promise<PublishResult> {
    const startTime = Date.now();
    const stagingDir = path.join(
      path.dirname(this.options.outputPath),
      `.staging-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    );

    await ensureDir(stagingDir);

    try {
      const { site, menu, headerMenu, footerMenu, menus, pages, posts, products, categories, customBlueprints } = await this.loadSiteData();

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
        robotsGenerated: false,
        cssFilesCompressed: 0,
        jsFilesCompressed: 0,
        htmlFilesCompressed: 0,
        unwantedFilesPurged: 0,
        bytesSaved: 0
      };

      // 1. Generate Home Page
      const templateOrProductBp = customBlueprints.find(
        (cb) => cb.blueprint.slug === 'templates' || cb.blueprint.slug === 'products'
      );
      const dynamicItems = templateOrProductBp
        ? templateOrProductBp.entries.map((e) => ({
            ...e,
            name: e.title,
            price: e.data?.price ?? 0,
            currency: e.data?.currency ?? 'USD',
            images: e.featuredImage ? [e.featuredImage] : (Array.isArray(e.data?.images) ? e.data.images : []),
            shortDescription: e.excerpt,
            url: `/${templateOrProductBp.blueprint.slug}/${e.slug}`
          }))
        : [];

      const effectiveProducts = products.length > 0
        ? products.map((p) => ({ ...p, url: `/products/${p.slug}` }))
        : (dynamicItems as any || []);

      const effectiveTemplates = dynamicItems;

      const postsWithUrls = posts.map((p) => ({ ...p, url: `/blog/${p.slug}` }));

      const homePage = pages.find((p) => p.slug === 'home');
      let homeTemplate = 'index.html';
      if (homePage?.template && homePage.template !== 'default') {
        const candidate = `page/${homePage.template}.html`;
        if (await this.compiler.templateExists(candidate)) {
          homeTemplate = candidate;
        } else if (await this.compiler.templateExists('index.html')) {
          homeTemplate = 'index.html';
        } else if (await this.compiler.templateExists('home.html')) {
          homeTemplate = 'home.html';
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
          products: effectiveProducts,
          templates: effectiveTemplates,
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
        const tplName = page.template || 'default';
        let templateFile = `page/${tplName}.html`;
        if (tplName !== 'default' && tplName !== 'page' && (await this.compiler.templateExists(templateFile))) {
          // Explicit custom template in page/
        } else if (tplName !== 'default' && tplName !== 'page' && (await this.compiler.templateExists(`${tplName}.html`))) {
          templateFile = `${tplName}.html`;
        } else if (await this.compiler.templateExists(`page/${page.slug}.html`)) {
          templateFile = `page/${page.slug}.html`;
        } else if (await this.compiler.templateExists(`${page.slug}.html`)) {
          templateFile = `${page.slug}.html`;
        } else if (!(await this.compiler.templateExists(templateFile))) {
          if (await this.compiler.templateExists(`${tplName}.html`)) {
            templateFile = `${tplName}.html`;
          } else if (await this.compiler.templateExists('page.html')) {
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
          if (await this.compiler.templateExists('post/archive.html')) {
            blogTemplate = 'post/archive.html';
          } else if (await this.compiler.templateExists('post.html')) {
            blogTemplate = 'post.html';
          } else if (await this.compiler.templateExists('page.html')) {
            blogTemplate = 'page.html';
          } else if (await this.compiler.templateExists('page/default.html')) {
            blogTemplate = 'page/default.html';
          }
        }
        const blogPageData: Page = {
          id: 'page_blog',
          title: 'Blog',
          slug: 'blog',
          status: 'published',
          template: 'default',
          content: { blocks: [] },
          featuredImage: '',
          noIndex: false,
          seo: { title: 'Blog', description: '', canonical: '', ogTitle: 'Blog', ogDescription: '', ogImage: '', robots: 'index,follow', noIndex: false },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          publishedAt: new Date().toISOString()
        };
        const blogIndexHtml = await this.compiler.render(blogTemplate, {
          site,
          menu,
          page: blogPageData,
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
            if (await this.compiler.templateExists('post/default.html')) {
              postTemplate = 'post/default.html';
            } else if (await this.compiler.templateExists('post.html')) {
              postTemplate = 'post.html';
            } else if (await this.compiler.templateExists('page.html')) {
              postTemplate = 'page.html';
            } else if (await this.compiler.templateExists('page/default.html')) {
              postTemplate = 'page/default.html';
            }
          }
          const postHtml = await this.compiler.render(postTemplate, {
            site,
            menu,
            page: post as unknown as Page,
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
            if (await this.compiler.templateExists('post/archive.html')) {
              catTemplate = 'post/archive.html';
            } else if (await this.compiler.templateExists('post.html')) {
              catTemplate = 'post.html';
            } else if (await this.compiler.templateExists('page.html')) {
              catTemplate = 'page.html';
            } else if (await this.compiler.templateExists('page/default.html')) {
              catTemplate = 'page/default.html';
            }
          }
          const catPageData: Page = {
            id: `page_cat_${cat.slug}`,
            title: cat.name,
            slug: cat.slug,
            status: 'published',
            template: 'default',
            content: { blocks: [] },
            featuredImage: '',
            noIndex: false,
            seo: { title: cat.name, description: '', canonical: '', ogTitle: cat.name, ogDescription: '', ogImage: '', robots: 'index,follow', noIndex: false },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString()
          };
          const catHtml = await this.compiler.render(catTemplate, {
            site,
            menu,
            page: catPageData,
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
        if (!(await this.compiler.templateExists(catalogTemplate))) {
          catalogTemplate = 'index.html';
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
          if (!(await this.compiler.templateExists(prodCatTemplate))) {
            prodCatTemplate = 'index.html';
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
          robots: 'index,follow',
          noIndex: false
        };

        // Determine list and detail templates
        let listTemplate = `${bp.slug}/list.html`;
        let detailTemplate = `${bp.slug}/default.html`;
        if (!(await this.compiler.templateExists(listTemplate))) {
          if ((bp.slug === 'templates' || bp.slug === 'products') && (await this.compiler.templateExists('template/list.html'))) {
            listTemplate = 'template/list.html';
          } else if ((bp.slug === 'templates' || bp.slug === 'products') && (await this.compiler.templateExists('product/list.html'))) {
            listTemplate = 'product/list.html';
          } else if (await this.compiler.templateExists('post/list.html')) {
            listTemplate = 'post/list.html';
          } else if (await this.compiler.templateExists('page.html')) {
            listTemplate = 'page.html';
          } else if (await this.compiler.templateExists('index.html')) {
            listTemplate = 'index.html';
          } else {
            listTemplate = '';
          }
        }
        if (!(await this.compiler.templateExists(detailTemplate))) {
          if ((bp.slug === 'templates' || bp.slug === 'products') && (await this.compiler.templateExists('template/default.html'))) {
            detailTemplate = 'template/default.html';
          } else if ((bp.slug === 'templates' || bp.slug === 'products') && (await this.compiler.templateExists('product/default.html'))) {
            detailTemplate = 'product/default.html';
          } else if (await this.compiler.templateExists('post/default.html')) {
            detailTemplate = 'post/default.html';
          } else if (await this.compiler.templateExists('page.html')) {
            detailTemplate = 'page.html';
          } else if (await this.compiler.templateExists('index.html')) {
            detailTemplate = 'index.html';
          } else {
            detailTemplate = '';
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

        const hasDedicatedListTemplate = await this.compiler.templateExists(`${bp.slug}/list.html`);
        if (listTemplate && (bpEntries.length > 0 || hasDedicatedListTemplate)) {
          const listHtml = await this.compiler.render(listTemplate, {
            site,
            menu,
            blueprint: bp,
            page: { title: bp.name, slug: bp.slug, status: 'published', content: null, seo: defaultSeo } as any,
            entries: bpEntries,
            posts: adaptedPosts as any,
            products: adaptedPosts as any,
            templates: adaptedPosts as any,
            activeSlug: bp.slug
          });
          await writeFileAtomic(path.join(bpDir, 'index.html'), listHtml);
          stats.pagesGenerated++;
        }

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
          if (detailTemplate) {
            const entryHtml = await this.compiler.render(detailTemplate, {
              site,
              menu,
              blueprint: bp,
              entry: adaptedEntry,
              page: adaptedEntry as any,
              post: adaptedEntry as any,
              product: adaptedEntry as any,
              template: adaptedEntry as any,
              posts: (adaptedPosts.filter((p) => p.slug !== entry.slug).slice(0, 3) as any),
              products: (adaptedPosts.filter((p) => p.slug !== entry.slug).slice(0, 4) as any),
              templates: (adaptedPosts.filter((p) => p.slug !== entry.slug).slice(0, 4) as any),
              activeSlug: bp.slug
            });
            await writeFileAtomic(path.join(entryDir, 'index.html'), entryHtml);
            stats.pagesGenerated++;
          }
        }
      }

      // 4.6 Generate Interactive Live Demo Simulator (if theme supports demo.html)
      if (await this.compiler.templateExists('demo.html')) {
        const demoHtml = await this.compiler.render('demo.html', {
          site,
          menu,
          templates: effectiveTemplates,
          products: effectiveProducts,
          activeSlug: 'demo',
          isRoot: true
        } as any);
        await writeFileAtomic(path.join(stagingDir, 'demo.html'), demoHtml);
        stats.pagesGenerated++;
      }

      // 4.7 Generate Standalone Legal Pages (privacy/index.html and terms/index.html) if theme provides them
      if (await this.compiler.templateExists('privacy.html')) {
        const privacyHtml = await this.compiler.render('privacy.html', {
          site,
          menu,
          templates: effectiveTemplates,
          activeSlug: 'privacy',
          isRoot: false
        } as any);
        const privacyDir = path.join(stagingDir, 'privacy');
        await ensureDir(privacyDir);
        await writeFileAtomic(path.join(privacyDir, 'index.html'), privacyHtml);
        stats.pagesGenerated++;
      }

      if (await this.compiler.templateExists('terms.html')) {
        const termsHtml = await this.compiler.render('terms.html', {
          site,
          menu,
          templates: effectiveTemplates,
          activeSlug: 'terms',
          isRoot: false
        } as any);
        const termsDir = path.join(stagingDir, 'terms');
        await ensureDir(termsDir);
        await writeFileAtomic(path.join(termsDir, 'index.html'), termsHtml);
        stats.pagesGenerated++;
      }

      // 5. Generate Sitemap & Robots.txt
      const isSiteWideNoIndex = Boolean(
        (site.defaultSEO as any)?.noIndex ||
        site.defaultSEO?.robots?.includes('noindex')
      );
      const sitemapContent = generateSitemapXml(
        site.siteUrl,
        pages,
        posts,
        isCatalogPackEnabled ? products : [],
        customBlueprints,
        isSiteWideNoIndex
      );
      await writeFileAtomic(path.join(stagingDir, 'sitemap.xml'), sitemapContent);
      stats.sitemapGenerated = true;

      const robotsContent = generateRobotsTxt(site.siteUrl, isSiteWideNoIndex);
      await writeFileAtomic(path.join(stagingDir, 'robots.txt'), robotsContent);
      stats.robotsGenerated = true;

      // 6. Copy Media and Assets
      const mediaSource = path.join(this.options.storagePath, 'media');
      const allowedMediaFilenames = new Set<string>(['manifest.json', 'favicon.ico']);

      if (await pathExists(mediaSource)) {
        const stagingMedia = path.join(stagingDir, 'media');
        await ensureDir(stagingMedia);

        // Read manifest to identify all active registered media items
        const manifestFile = path.join(mediaSource, 'manifest.json');
        if (await pathExists(manifestFile)) {
          try {
            const rawManifest = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
            if (Array.isArray(rawManifest.items)) {
              for (const item of rawManifest.items) {
                if (item && item.filename) {
                  allowedMediaFilenames.add(item.filename);
                }
              }
            }
          } catch {}
        }

        // Also protect any media filenames directly referenced in active content or settings
        const extractMediaRefs = (obj: any) => {
          if (!obj) return;
          const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
          const matches = str.matchAll(/\/media\/([a-zA-Z0-9_\-\.]+)/g);
          for (const m of matches) {
            if (m[1]) allowedMediaFilenames.add(m[1]);
          }
        };

        extractMediaRefs(site);
        extractMediaRefs(pages);
        extractMediaRefs(posts);
        extractMediaRefs(products);
        if (effectiveTemplates) extractMediaRefs(effectiveTemplates);

        // Scan mediaSource directory: prune deleted media and copy active media
        const diskMediaFiles = await fs.readdir(mediaSource);
        let copiedAny = false;

        for (const file of diskMediaFiles) {
          if (file.startsWith('.')) continue;
          const srcFile = path.join(mediaSource, file);
          const stat = await fs.stat(srcFile);
          if (stat.isDirectory()) continue;

          // If manifest has items and file is not in allowed list, it was deleted from CMS
          if (allowedMediaFilenames.size > 2 && !allowedMediaFilenames.has(file)) {
            await fs.rm(srcFile, { force: true });
            continue;
          }

          await fs.copyFile(srcFile, path.join(stagingMedia, file));
          copiedAny = true;
        }

        if (copiedAny) {
          stats.assetsCopied++;
        }
      }

      // Copy extracted interactive demo bundles
      const demosSource = path.join(this.options.storagePath, 'demos');
      if (await pathExists(demosSource)) {
        await copyDirRecursive(demosSource, path.join(stagingDir, 'demos'));
        stats.assetsCopied++;
      }
      const altDemosSource = path.resolve(this.options.storagePath, '..', 'apps/server/storage/demos');
      if (altDemosSource !== demosSource && (await pathExists(altDemosSource))) {
        await copyDirRecursive(altDemosSource, path.join(stagingDir, 'demos'));
        stats.assetsCopied++;
      }

      // Standardize demo directories to clean slug names (e.g. demos/:slug/index.html)
      if (effectiveTemplates && effectiveTemplates.length > 0) {
        const stagingDemos = path.join(stagingDir, 'demos');
        for (const item of effectiveTemplates) {
          const d = item.data || {};
          const slugDemoDir = path.join(stagingDemos, item.slug);
          if (d.demoUrl && typeof d.demoUrl === 'string') {
            const cleanRel = d.demoUrl.replace(/^demos\//, '').replace(/^\//, '');
            const subDirName = cleanRel.split('/')[0];
            if (subDirName && subDirName !== item.slug) {
              const actualSubDir = path.join(stagingDemos, subDirName);
              if (await pathExists(actualSubDir)) {
                if (!(await pathExists(slugDemoDir))) {
                  await copyDirRecursive(actualSubDir, slugDemoDir);
                }
                // Prune bulky long folder so only the clean slug demo exists
                await fs.rm(actualSubDir, { recursive: true, force: true });
              }
            }
          }
        }
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

      // If dynamic blueprint templates exist, write live templates-data.js to stagingDir
      if (effectiveTemplates && effectiveTemplates.length > 0) {
        const liveTemplatesDataFile = path.join(stagingDir, 'assets/js/templates-data.js');
        const serializedData = JSON.stringify(
          effectiveTemplates.map((item: any) => {
            const d = item.data || {};
            return {
              id: item.slug,
              title: item.title || item.name || '',
              category: d.category || 'SaaS & Dashboard',
              categorySlug: d.categorySlug || 'saas',
              badge: d.badge || (d.isFree ? 'Free' : 'PRO'),
              badgeColor: d.badgeColor || 'purple',
              tagline: d.tagline || item.excerpt || '',
              description: d.description || item.excerpt || '',
              thumbnail: item.featuredImage || d.thumbnail || ('assets/images/' + item.slug + '.jpg'),
              featuredImage: item.featuredImage || d.featuredImage || ('assets/images/' + item.slug + '.jpg'),
              demoUrl: 'demos/' + item.slug + '/index.html',
              downloadFile: 'demos/' + item.slug + '/bundle.zip',
              version: d.version || 'v1.0.0',
              releaseDate: d.releaseDate || 'Sept 2026',
              lastUpdated: d.lastUpdated || 'Oct 2026',
              license: d.license || 'MIT Commercial & Personal',
              price: d.price || 'Free',
              isFree: d.isFree ?? (d.price === 'Free'),
              rating: Number(d.rating) || 4.98,
              reviewCount: Number(d.reviewCount) || 120,
              downloads: String(d.downloads || '10,000+'),
              author: d.author || 'Pixoptimo Labs',
              techStack: Array.isArray(d.techStack) ? d.techStack : (typeof d.techStack === 'string' ? d.techStack.split(',').map((s: string)=>s.trim()).filter(Boolean) : ['HTML5 Semantic', 'Vanilla CSS3']),
              browserSupport: d.browserSupport || 'All Modern Browsers (Chrome, Safari, Firefox, Edge)',
              overview: d.overview || d.description || item.excerpt || '',
              features: Array.isArray(d.features) ? d.features : (typeof d.features === 'string' ? d.features.split('\n').map((s: string)=>s.trim()).filter(Boolean) : []),
              fileTree: (() => {
                const raw = d.fileStructure || d.fileTree;
                if (Array.isArray(raw) && raw.length > 0) return raw;
                if (typeof raw === 'string' && raw.trim().length > 0) {
                  const lines = raw.split('\n').filter((l: string) => l.trim().length > 0);
                  const root: any[] = [];
                  let currentDir: any = null;
                  lines.forEach((line: string) => {
                    const indent = line.search(/\S|$/);
                    const trimmed = line.trim();
                    const parts = trimmed.split('//');
                    const name = parts[0].trim();
                    const desc = parts[1] ? parts[1].trim() : '';
                    const isDir = name.endsWith('/');
                    const node: any = { name, type: isDir ? 'dir' : 'file', desc };
                    if (isDir) node.children = [];
                    if (indent > 0 && currentDir && currentDir.children) {
                      currentDir.children.push(node);
                    } else {
                      if (isDir) {
                        currentDir = node;
                      } else {
                        currentDir = null;
                      }
                      root.push(node);
                    }
                  });
                  if (root.length > 0) return root;
                }
                return [
                  { name: item.slug + '.html', type: 'file', desc: 'Main template markup' },
                  { name: 'assets/', type: 'dir', children: [
                    { name: 'css/style.css', type: 'file', desc: 'Custom styles and layout tokens' },
                    { name: 'js/app.js', type: 'file', desc: 'Vanilla interactions' }
                  ]},
                  { name: 'README.md', type: 'file', desc: 'Documentation & setup guidelines' }
                ];
              })(),
              quickStartCode: d.quickStartCode || '',
              cssTokens: d.cssTokens || '',
              changelog: Array.isArray(d.changelog) ? d.changelog : (typeof d.changelog === 'string' ? d.changelog.split('\n').map((l: string) => {
                const trimmed = l.trim();
                if (!trimmed) return null;
                const match = trimmed.match(/^(v?[\d.]+)\s*(?:\(([^)]+)\))?:\s*(.+)$/);
                if (match) {
                  return { version: match[1], date: match[2] || d.lastUpdated || 'Recent', note: match[3] };
                }
                return { version: d.version || 'v1.0.0', date: d.lastUpdated || 'Recent', note: trimmed };
              }).filter(Boolean) : []),
              lighthouseScore: {
                performance: Number(d.lighthousePerformance) || 100,
                accessibility: Number(d.lighthouseAccessibility) || 100,
                bestPractices: Number(d.lighthouseBestPractices) || 100,
                seo: Number(d.lighthouseSeo) || 100
              },
              fileSize: d.fileSize || '14.2 KB (Gzipped)'
            };
          }),
          null,
          2
        );
        const liveJsContent = `/**
 * Pixoptimo UI Templates - Central Template Database (Dynamic CMS Generated)
 */
window.TEMPLATES_DATA = ${serializedData};

window.getTemplateById = function(id) {
  const data = window.TEMPLATES_DATA || [];
  if (!data.length) return null;
  if (!id) return data[0];
  return data.find(function(t) { return t.id === id; }) || data[0];
};
`;
        await ensureDir(path.dirname(liveTemplatesDataFile));
        await writeFileAtomic(liveTemplatesDataFile, liveJsContent);
      }

      // Safe synchronization for sample-templates:
      // Active blueprint entries/templates -> included in generated website (stagingDir/sample-templates) and preserved in theme
      // Trashed blueprint entries -> preserved safely in storagePath/trash/sample-templates and excluded from generated website
      // Permanently deleted entries (neither in active Blueprints nor in Trash) -> removed from theme folder and excluded from generated website
      const themeSamples = path.join(effectiveTemplatesDir, 'sample-templates');
      const trashSamplesDir = path.join(this.options.storagePath, 'trash', 'sample-templates');

      // 1. Gather all active blueprint entries / templates
      const activeEntrySlugs = new Set<string>();
      const activeFileRefs = new Set<string>();

      for (const cb of customBlueprints) {
        for (const entry of cb.entries) {
          if (entry.slug) activeEntrySlugs.add(entry.slug.toLowerCase());
          if (entry.id) activeEntrySlugs.add(entry.id.toLowerCase());
          const demo = entry.data?.demoUrl;
          if (typeof demo === 'string' && demo) {
            activeFileRefs.add(path.basename(demo.split('?')[0]).toLowerCase());
          }
          const download = entry.data?.downloadFile;
          if (typeof download === 'string' && download) {
            activeFileRefs.add(path.basename(download.split('?')[0]).toLowerCase());
          }
        }
      }

      // Also scan contentPath directly to catch draft or other entries in blueprints
      const bpContentDir = path.join(this.options.storagePath, 'content');
      if (await pathExists(bpContentDir)) {
        try {
          const subdirs = await fs.readdir(bpContentDir, { withFileTypes: true });
          for (const dirent of subdirs) {
            if (dirent.isDirectory()) {
              const dirPath = path.join(bpContentDir, dirent.name);
              const files = await listJsonFiles(dirPath);
              for (const f of files) {
                try {
                  const raw = await readJson<any>(f);
                  if (raw?.slug) activeEntrySlugs.add(String(raw.slug).toLowerCase());
                  if (raw?.id) activeEntrySlugs.add(String(raw.id).toLowerCase());
                  const demo = raw?.data?.demoUrl;
                  if (typeof demo === 'string' && demo) {
                    activeFileRefs.add(path.basename(demo.split('?')[0]).toLowerCase());
                  }
                  const download = raw?.data?.downloadFile;
                  if (typeof download === 'string' && download) {
                    activeFileRefs.add(path.basename(download.split('?')[0]).toLowerCase());
                  }
                } catch {}
              }
            }
          }
        } catch {}
      }

      // 2. Gather all trashed items
      const trashedEntrySlugs = new Set<string>();
      const trashedFileRefs = new Set<string>();
      const trashDir = path.join(this.options.storagePath, 'trash');
      if (await pathExists(trashDir)) {
        try {
          const trashFiles = await listJsonFiles(trashDir);
          for (const tf of trashFiles) {
            try {
              const item = await readJson<any>(tf);
              if (item?.originalSlug) trashedEntrySlugs.add(String(item.originalSlug).toLowerCase());
              if (item?.originalId) trashedEntrySlugs.add(String(item.originalId).toLowerCase());
              if (item?.data?.slug) trashedEntrySlugs.add(String(item.data.slug).toLowerCase());
              const demo = item?.data?.data?.demoUrl || item?.data?.demoUrl;
              if (typeof demo === 'string' && demo) {
                trashedFileRefs.add(path.basename(demo.split('?')[0]).toLowerCase());
              }
              const download = item?.data?.data?.downloadFile || item?.data?.downloadFile;
              if (typeof download === 'string' && download) {
                trashedFileRefs.add(path.basename(download.split('?')[0]).toLowerCase());
              }
            } catch {}
          }
        } catch {}
      }

      const isSampleMatching = (fileName: string, slugs: Set<string>, fileRefs: Set<string>): boolean => {
        const lowerName = fileName.toLowerCase();
        if (fileRefs.has(lowerName)) return true;
        const parsed = path.parse(lowerName);
        if (slugs.has(lowerName)) return true;
        if (slugs.has(parsed.name)) return true;
        return false;
      };

      // 3. Process trash safe folder: restore any item that became active, purge permanently deleted items
      if (await pathExists(trashSamplesDir)) {
        try {
          const trashedSampleFiles = await fs.readdir(trashSamplesDir);
          for (const file of trashedSampleFiles) {
            const trashedFilePath = path.join(trashSamplesDir, file);
            if (isSampleMatching(file, activeEntrySlugs, activeFileRefs)) {
              await ensureDir(themeSamples);
              const targetPath = path.join(themeSamples, file);
              await fs.rename(trashedFilePath, targetPath);
            } else if (!isSampleMatching(file, trashedEntrySlugs, trashedFileRefs)) {
              await fs.rm(trashedFilePath, { recursive: true, force: true });
            }
          }
        } catch {}
      }

      // 4. Process theme sample-templates folder
      const hasTemplatesBlueprint =
        customBlueprints.some((cb) => cb.blueprint.slug === 'templates') ||
        (await pathExists(path.join(this.options.storagePath, 'blueprints', 'templates.json')));

      if (await pathExists(themeSamples)) {
        const sampleFiles = await fs.readdir(themeSamples);
        const stagingSamplesDir = path.join(stagingDir, 'sample-templates');
        let copiedAny = false;

        for (const file of sampleFiles) {
          const sourcePath = path.join(themeSamples, file);
          const stat = await fs.stat(sourcePath);

          if (isSampleMatching(file, activeEntrySlugs, activeFileRefs)) {
            // Active in Blueprints: Copy to stagingDir and keep in theme
            await ensureDir(stagingSamplesDir);
            const targetPath = path.join(stagingSamplesDir, file);
            if (stat.isDirectory()) {
              await copyDirRecursive(sourcePath, targetPath);
            } else {
              await fs.copyFile(sourcePath, targetPath);
            }
            copiedAny = true;
          } else if (isSampleMatching(file, trashedEntrySlugs, trashedFileRefs)) {
            // In Trash: Keep safe in trashSamplesDir, remove from theme folder, do not generate
            await ensureDir(trashSamplesDir);
            const safeTrashPath = path.join(trashSamplesDir, file);
            await fs.rename(sourcePath, safeTrashPath);
          } else if (hasTemplatesBlueprint || trashedEntrySlugs.size > 0 || activeEntrySlugs.size > 0) {
            // Permanently deleted: Remove from theme folder, do not generate
            await fs.rm(sourcePath, { recursive: true, force: true });
          } else {
            // Fallback for non-blueprint themes: copy all
            await ensureDir(stagingSamplesDir);
            const targetPath = path.join(stagingSamplesDir, file);
            if (stat.isDirectory()) {
              await copyDirRecursive(sourcePath, targetPath);
            } else {
              await fs.copyFile(sourcePath, targetPath);
            }
            copiedAny = true;
          }
        }

        if (copiedAny) {
          stats.assetsCopied++;
        }
      }

      // 6.8 Clean and Compress Staging Directory (Minify CSS, JS, HTML and prune unwanted/unreferenced files)
      const optStats = await cleanAndOptimizeStagingDirectory(stagingDir, {
        preserveMediaNames: allowedMediaFilenames,
        removeUnreferencedImages: true
      });
      stats.cssFilesCompressed = optStats.cssFiles;
      stats.jsFilesCompressed = optStats.jsFiles;
      stats.htmlFilesCompressed = optStats.htmlFiles;
      stats.bytesSaved = optStats.bytesSaved;
      stats.unwantedFilesPurged = optStats.unwantedFilesPurged;

      logger.info('Staging directory compressed and cleaned', {
        cssCompressed: optStats.cssFiles,
        jsCompressed: optStats.jsFiles,
        htmlCompressed: optStats.htmlFiles,
        bytesSaved: optStats.bytesSaved,
        purgedFiles: optStats.unwantedFilesPurged
      });

      // 7. Deploy via Publisher abstraction
      const deploymentTarget = (this.options.publisherType || site.deployment?.target || 'local') as PublisherType;
      const publisherOpts = this.options.publisherOptions || {
        branch: site.deployment?.gitBranch || 'gh-pages',
        repo: site.deployment?.gitRepo,
        cname: site.deployment?.cname || site.deployment?.customDomain
      };

      const publisher = createPublisher(deploymentTarget, publisherOpts);
      await publisher.deploy(stagingDir, this.options.outputPath);

      // Ensure target output media directory does not retain any pruned/deleted files
      const targetMediaDir = path.join(this.options.outputPath, 'media');
      if (allowedMediaFilenames.size > 2 && (await pathExists(targetMediaDir))) {
        try {
          const targetFiles = await fs.readdir(targetMediaDir);
          for (const tf of targetFiles) {
            if (!allowedMediaFilenames.has(tf) && !tf.startsWith('.')) {
              await fs.rm(path.join(targetMediaDir, tf), { force: true });
            }
          }
        } catch {}
      }

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
    const { site, menu, headerMenu, footerMenu, menus } = await this.loadSiteData();
    const tplCandidate = item.template || 'default';
    let templateFile = `${type}/${tplCandidate}.html`;
    if (!(await this.compiler.templateExists(templateFile))) {
      if (await this.compiler.templateExists(`${tplCandidate}.html`)) {
        templateFile = `${tplCandidate}.html`;
      } else if (await this.compiler.templateExists(`${type}.html`)) {
        templateFile = `${type}.html`;
      } else if (await this.compiler.templateExists(`${type}/default.html`)) {
        templateFile = `${type}/default.html`;
      }
    }

    if (type === 'page') {
      return await this.compiler.render(templateFile, {
        site,
        menu,
        headerMenu,
        footerMenu,
        menus,
        page: item as Page,
        activeSlug: item.slug
      });
    } else if (type === 'post') {
      return await this.compiler.render(templateFile, {
        site,
        menu,
        headerMenu,
        footerMenu,
        menus,
        post: item as Post,
        activeSlug: 'blog'
      });
    } else {
      return await this.compiler.render(templateFile, {
        site,
        menu,
        headerMenu,
        footerMenu,
        menus,
        product: item as Product,
        activeSlug: 'products'
      });
    }
  }
}

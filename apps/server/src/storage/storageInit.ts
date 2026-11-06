import path from 'node:path';
import { ensureDir, pathExists, writeJsonAtomic, readJson, logger } from '@cms/utils';
import { UsersFileSchema, type User, type UsersFile } from '@cms/schemas';
import { hashPassword } from '../auth/password.js';
import { config } from '../config/env.js';

export async function initializeStorage(): Promise<void> {
  // Directories to ensure
  const dirs = [
    config.STORAGE_PATH,
    path.join(config.STORAGE_PATH, 'auth'),
    config.CONTENT_PATH,
    path.join(config.CONTENT_PATH, 'pages'),
    path.join(config.CONTENT_PATH, 'posts'),
    path.join(config.CONTENT_PATH, 'products'),
    path.join(config.CONTENT_PATH, 'categories'),
    path.join(config.CONTENT_PATH, 'menus'),
    config.MEDIA_PATH,
    config.REVISION_PATH,
    path.join(config.REVISION_PATH, 'pages'),
    path.join(config.REVISION_PATH, 'posts'),
    path.join(config.REVISION_PATH, 'products'),
    config.SESSION_PATH,
    config.SETTINGS_PATH,
    config.BACKUP_PATH,
    config.TRASH_PATH,
    config.DEMOS_PATH,
    config.OUTPUT_PATH,
    config.TEMPLATES_PATH
  ];

  for (const dir of dirs) {
    await ensureDir(dir);
  }

  // Base files initialization
  const usersPath = path.join(config.STORAGE_PATH, 'auth', 'users.json');
  let usersList: User[] = [];
  if (await pathExists(usersPath)) {
    try {
      const data = await readJson<UsersFile>(usersPath, UsersFileSchema);
      usersList = data.users;
    } catch {}
  }

  const hasActiveAdmin = usersList.some((u) => u.role === 'admin' && u.active);
  if (!hasActiveAdmin) {
    const defaultPasswordHash = await hashPassword('admin123');
    const now = new Date().toISOString();
    const defaultAdmin: User = {
      id: 'usr_admin_default',
      email: 'admin@example.com',
      name: 'admin',
      passwordHash: defaultPasswordHash,
      role: 'admin',
      active: true,
      createdAt: now,
      updatedAt: now
    };
    usersList = [defaultAdmin, ...usersList.filter((u) => u.id !== 'usr_admin_default')];
    await writeJsonAtomic(usersPath, { users: usersList }, UsersFileSchema);
    logger.info('Auto-seeded default admin (admin / admin123) in storage/auth/users.json');
  }

  const categoriesPath = path.join(config.CONTENT_PATH, 'categories', 'index.json');
  if (!(await pathExists(categoriesPath))) {
    await writeJsonAtomic(categoriesPath, {
      categories: [
        {
          id: 'cat_general',
          name: 'General',
          slug: 'general',
          type: 'post',
          description: 'General articles and news',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'cat_featured_products',
          name: 'Featured Products',
          slug: 'featured-products',
          type: 'product',
          description: 'Top quality products',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    });
  }

  const menuPath = path.join(config.CONTENT_PATH, 'menus', 'main.json');
  if (!(await pathExists(menuPath))) {
    await writeJsonAtomic(menuPath, {
      id: 'menu_main',
      name: 'Main Navigation',
      slug: 'main',
      location: 'header',
      locations: ['header'],
      items: [
        { id: 'm_home', label: 'Home', url: '/', target: '_self', children: [] },
        { id: 'm_about', label: 'About', url: '/about-us', target: '_self', children: [] },
        { id: 'm_products', label: 'Products', url: '/products', target: '_self', children: [] },
        { id: 'm_blog', label: 'Blog', url: '/blog', target: '_self', children: [] },
        { id: 'm_contact', label: 'Contact', url: '/contact', target: '_self', children: [] }
      ],
      updatedAt: new Date().toISOString()
    });
  }

  const footerMenuPath = path.join(config.CONTENT_PATH, 'menus', 'footer.json');
  if (!(await pathExists(footerMenuPath))) {
    await writeJsonAtomic(footerMenuPath, {
      id: 'menu_footer',
      name: 'Footer Navigation',
      slug: 'footer',
      location: 'footer',
      locations: ['footer'],
      items: [
        { id: 'mf_home', label: 'Home', url: '/', target: '_self', children: [] },
        { id: 'mf_about', label: 'About', url: '/about-us', target: '_self', children: [] },
        { id: 'mf_products', label: 'Catalog', url: '/products', target: '_self', children: [] },
        { id: 'mf_contact', label: 'Contact', url: '/contact', target: '_self', children: [] },
        { id: 'mf_privacy', label: 'Privacy Policy', url: '/privacy.html', target: '_self', children: [] },
        { id: 'mf_terms', label: 'Terms of Service', url: '/terms.html', target: '_self', children: [] }
      ],
      updatedAt: new Date().toISOString()
    });
  }

  const settingsPath = path.join(config.SETTINGS_PATH, 'site.json');
  if (!(await pathExists(settingsPath))) {
    await writeJsonAtomic(settingsPath, {
      siteName: 'Planfo Static CMS',
      siteUrl: config.SITE_URL,
      tagline: 'Modern, high-performance static website powered by a file-based CMS.',
      logo: '',
      favicon: '',
      defaultSEO: {
        title: 'Planfo Static CMS - Blazing Fast Content Management',
        description: 'Manage rich content with zero database overhead and deploy lightning-fast static HTML.',
        canonical: config.SITE_URL,
        ogTitle: 'Planfo Static CMS',
        ogDescription: 'Manage rich content with zero database overhead.',
        ogImage: '',
        robots: 'index,follow'
      },
      socialLinks: {
        twitter: 'https://twitter.com',
        github: 'https://github.com'
      },
      analyticsId: '',
      timezone: 'UTC',
      language: 'en',
      footerText: '© 2026 Planfo. Built with TypeScript and React.',
      updatedAt: new Date().toISOString()
    });
  }

  const mediaManifestPath = path.join(config.MEDIA_PATH, 'manifest.json');
  if (!(await pathExists(mediaManifestPath))) {
    await writeJsonAtomic(mediaManifestPath, { items: [] });
  }

  logger.info('Storage directories and baseline files initialized successfully');
}

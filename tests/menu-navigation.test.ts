import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { MenuStore } from '../apps/server/src/storage/menuStore.js';
import { StaticSiteGenerator } from '../apps/generator/src/generator.js';
import { MenuSchema, MenuItemSchema, CreateMenuSchema } from '@cms/schemas';

const TEST_DIR = path.join(process.cwd(), 'tests', 'fixtures', 'menu-test');
const CONTENT_DIR = path.join(TEST_DIR, 'content');
const MENUS_DIR = path.join(CONTENT_DIR, 'menus');
const OUTPUT_DIR = path.join(TEST_DIR, 'generated');
const TEMPLATES_DIR = path.join(process.cwd(), 'themes', 'planfo-default');

describe('WordPress-style Multi-Menu Navigation & Simple Centered Footer', () => {
  beforeAll(async () => {
    await fs.mkdir(MENUS_DIR, { recursive: true });
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Seed baseline main header menu with sub-items and a noLink parent
    await fs.writeFile(
      path.join(MENUS_DIR, 'main.json'),
      JSON.stringify({
        id: 'menu_main',
        name: 'Main Header Navigation',
        slug: 'main',
        location: 'header',
        locations: ['header'],
        items: [
          {
            id: 'item_home',
            label: 'Home',
            url: '/',
            target: '_self',
            noLink: false,
            children: []
          },
          {
            id: 'item_services',
            label: 'Solutions',
            url: '#',
            noLink: true,
            children: [
              { id: 'sub_saas', label: 'Quantum SaaS', url: '/details.html?id=quantum-saas', target: '_self', noLink: false },
              { id: 'sub_fintech', label: 'Nexus Fintech', url: '/details.html?id=nexus-fintech', target: '_self', noLink: false }
            ]
          }
        ],
        updatedAt: new Date().toISOString()
      }, null, 2)
    );

    // Seed secondary footer menu
    await fs.writeFile(
      path.join(MENUS_DIR, 'footer.json'),
      JSON.stringify({
        id: 'menu_footer',
        name: 'Footer Links',
        slug: 'footer',
        location: 'footer',
        locations: ['footer'],
        items: [
          { id: 'f_about', label: 'About Us', url: '/about.html', target: '_self', noLink: false },
          { id: 'f_contact', label: 'Contact', url: '/contact.html', target: '_self', noLink: false },
          { id: 'f_privacy', label: 'Privacy Policy', url: '/privacy.html', target: '_self', noLink: false }
        ],
        updatedAt: new Date().toISOString()
      }, null, 2)
    );
  });

  afterAll(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should validate CreateMenuSchema and MenuItemSchema with noLink option', () => {
    const itemResult = MenuItemSchema.safeParse({
      id: 'test_item',
      label: 'Products Dropdown',
      noLink: true,
      children: [
        { id: 'c1', label: 'Hardware', url: '/hardware' }
      ]
    });
    expect(itemResult.success).toBe(true);
    if (itemResult.success) {
      expect(itemResult.data.noLink).toBe(true);
      expect(itemResult.data.url).toBe('');
      expect(itemResult.data.children).toHaveLength(1);
    }

    const menuResult = CreateMenuSchema.safeParse({
      name: 'Custom Marketing Menu',
      slug: 'marketing-menu',
      locations: ['header', 'footer'],
      items: []
    });
    expect(menuResult.success).toBe(true);
  });

  it('should load multiple menus and map header and footer locations in generator', async () => {
    const generator = new StaticSiteGenerator({
      storagePath: TEST_DIR,
      templatesPath: TEMPLATES_DIR,
      outputPath: OUTPUT_DIR,
      environment: 'production'
    });

    const data = await generator.loadSiteData();
    expect(data.menus.length).toBeGreaterThanOrEqual(2);
    expect(data.headerMenu).toBeDefined();
    expect(data.headerMenu?.slug).toBe('main');
    expect(data.footerMenu).toBeDefined();
    expect(data.footerMenu?.slug).toBe('footer');
  });

  it('should render noLink dropdown button in header and centered simple navigation in footer', async () => {
    const generator = new StaticSiteGenerator({
      storagePath: TEST_DIR,
      templatesPath: TEMPLATES_DIR,
      outputPath: OUTPUT_DIR,
      environment: 'production'
    });

    const html = await generator.renderPreview('page', {
      id: 'test_page',
      title: 'Navigation Test Page',
      slug: 'nav-test',
      status: 'published',
      template: 'default',
      content: { blocks: [] },
      featuredImage: '',
      seo: {
        title: 'Nav Test',
        description: 'Testing navbar & footer',
        canonical: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        robots: 'index,follow',
        noIndex: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    });

    // 1. Header has noLink dropdown parent trigger (button or text) with child links
    expect(html).toContain('class="nav-item has-dropdown"');
    expect(html).toContain('Solutions');
    expect(html).toContain('Quantum SaaS');
    expect(html).toContain('Nexus Fintech');

    // 2. Footer is simple and centered
    expect(html).toContain('footer-simple-content');
    expect(html).toContain('footer-simple-logo');
    expect(html).toContain('footer-simple-desc');
    expect(html).toContain('footer-simple-nav');
    expect(html).toContain('footer-bottom');
    expect(html).toContain('data-theme="light"');
    expect(html).toContain('Terms of Service');
  });
});

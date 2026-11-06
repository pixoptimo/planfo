import dotenv from 'dotenv';
import { initializeStorage } from '../apps/server/src/storage/storageInit.js';
import { PageStore } from '../apps/server/src/storage/pageStore.js';
import { PostStore } from '../apps/server/src/storage/postStore.js';
import { ProductStore } from '../apps/server/src/storage/productStore.js';
import { CategoryStore } from '../apps/server/src/storage/categoryStore.js';
import { UserStore } from '../apps/server/src/storage/userStore.js';
import { hashPassword } from '../apps/server/src/auth/password.js';
import type { Page, Post, Product, Category, User } from '@cms/schemas';

dotenv.config();

export async function seedDemoData(): Promise<void> {
  await initializeStorage();

  const now = new Date().toISOString();

  // Admin user
  const adminExists = await UserStore.findByEmail('admin@example.com');
  if (!adminExists) {
    const passwordHash = await hashPassword('Admin12345!');
    const admin: User = {
      id: 'usr_admin_default',
      email: 'admin@example.com',
      name: 'System Admin',
      passwordHash,
      role: 'admin',
      active: true,
      createdAt: now,
      updatedAt: now
    };
    await UserStore.saveUser(admin);
  }

  // Categories
  const categories: Category[] = [
    {
      id: 'cat_tech',
      name: 'Technology',
      slug: 'technology',
      type: 'post',
      description: 'Articles on software, architecture, and static generation',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'cat_hardware',
      name: 'Hardware & Devices',
      slug: 'hardware',
      type: 'product',
      description: 'High performance hardware accessories',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'cat_apparel',
      name: 'Merchandise',
      slug: 'merchandise',
      type: 'product',
      description: 'Official CMS merchandise and apparel',
      createdAt: now,
      updatedAt: now
    }
  ];
  for (const cat of categories) {
    await CategoryStore.save(cat);
  }

  // Pages
  const pages: Page[] = [
    {
      id: 'page_home',
      title: 'Home',
      slug: 'home',
      status: 'published',
      template: 'default',
      content: {
        blocks: [
          {
            id: 'b1',
            type: 'heading',
            level: 2,
            text: 'Welcome to the Future of File-Based Static Content Management'
          },
          {
            id: 'b2',
            type: 'paragraph',
            text: 'Planfo CMS eliminates database overhead, vulnerability surfaces, and complex infrastructure. All content is stored as clean JSON files on disk and compiled into pure static HTML/CSS.'
          },
          {
            id: 'b3',
            type: 'callout',
            variant: 'success',
            title: 'Zero Database Runtime',
            text: 'Visitors load pure pre-rendered static files at maximum edge speed without hitting an API or database.'
          }
        ]
      },
      featuredImage: '',
      noIndex: false,
      seo: {
        title: 'Home - Planfo Static CMS',
        description: 'Modern, high-performance static website powered by a file-based CMS.',
        canonical: 'http://localhost:3000/',
        ogTitle: 'Planfo Static CMS',
        ogDescription: 'Manage content effortlessly on the filesystem.',
        ogImage: '',
        robots: 'index,follow',
        noIndex: false
      },
      createdAt: now,
      updatedAt: now,
      publishedAt: now
    },
    {
      id: 'page_about',
      title: 'About Us',
      slug: 'about-us',
      status: 'published',
      template: 'default',
      content: {
        blocks: [
          {
            id: 'ab_1',
            type: 'heading',
            level: 2,
            text: 'Our Mission & Philosophy'
          },
          {
            id: 'ab_2',
            type: 'paragraph',
            text: 'We believe that static websites offer unbeatable speed, security, and hosting cost benefits. Planfo CMS bridges the gap between structured content management and purely static site generation.'
          },
          {
            id: 'ab_3',
            type: 'list',
            style: 'unordered',
            items: [
              'Zero Database dependency at runtime',
              'Atomic staging and publishing deployment',
              'Argon2id password hashing and robust RBAC',
              'Full JSON revision history and backup portability'
            ]
          }
        ]
      },
      featuredImage: '',
      noIndex: false,
      seo: {
        title: 'About Us - Planfo Static CMS',
        description: 'Learn about the philosophy and engineering behind Planfo Static CMS.',
        canonical: 'http://localhost:3000/about-us',
        ogTitle: 'About Us',
        ogDescription: 'Philosophy and engineering behind Planfo Static CMS.',
        ogImage: '',
        robots: 'index,follow',
        noIndex: false
      },
      createdAt: now,
      updatedAt: now,
      publishedAt: now
    },
    {
      id: 'page_contact',
      title: 'Contact',
      slug: 'contact',
      status: 'published',
      template: 'default',
      content: {
        blocks: [
          {
            id: 'ct_1',
            type: 'heading',
            level: 2,
            text: 'Get In Touch'
          },
          {
            id: 'ct_2',
            type: 'paragraph',
            text: 'Have questions or want to collaborate? Reach out to our team at contact@example.com or find us on GitHub.'
          },
          {
            id: 'ct_3',
            type: 'button',
            text: 'Send Us An Email',
            url: 'mailto:contact@example.com',
            variant: 'primary',
            target: '_blank'
          }
        ]
      },
      featuredImage: '',
      noIndex: false,
      seo: {
        title: 'Contact - Planfo Static CMS',
        description: 'Get in touch with our team.',
        canonical: 'http://localhost:3000/contact',
        ogTitle: 'Contact',
        ogDescription: 'Get in touch with our team.',
        ogImage: '',
        robots: 'index,follow',
        noIndex: false
      },
      createdAt: now,
      updatedAt: now,
      publishedAt: now
    }
  ];

  for (const page of pages) {
    await PageStore.save(page);
  }

  // Posts
  const posts: Post[] = [
    {
      id: 'post_1',
      title: 'Why Static CMS Architecture is Superior for 2026',
      slug: 'why-static-cms-architecture-is-superior',
      excerpt: 'Explore why file-based static publishing outperforms traditional monolithic CMS platforms in speed, security, and scalability.',
      content: {
        blocks: [
          {
            id: 'pb_1',
            type: 'heading',
            level: 2,
            text: 'The Problem with Monolithic CMSs'
          },
          {
            id: 'pb_2',
            type: 'paragraph',
            text: 'Traditional CMS platforms run a full relational database query on every HTTP request. This creates security vulnerabilities, slows down page render time, and creates operational bottlenecks.'
          },
          {
            id: 'pb_3',
            type: 'blockquote',
            text: 'The fastest database query is the one you never execute.',
            citation: 'Web Performance Guild'
          },
          {
            id: 'pb_4',
            type: 'heading',
            level: 3,
            text: 'How File-Based Storage Solves This'
          },
          {
            id: 'pb_5',
            type: 'paragraph',
            text: 'By keeping content in structured JSON files with atomic rename operations, we gain easy version control, zero database licensing fees, and instant rollback capability.'
          }
        ]
      },
      featuredImage: '',
      author: 'Planfo Team',
      category: 'technology',
      tags: ['static-site', 'typescript', 'architecture', 'performance'],
      status: 'published',
      template: 'default',
      seo: {
        title: 'Why Static CMS Architecture is Superior for 2026',
        description: 'Explore why file-based static publishing outperforms traditional monolithic CMS platforms.',
        canonical: 'http://localhost:3000/blog/why-static-cms-architecture-is-superior',
        ogTitle: 'Why Static CMS Architecture is Superior for 2026',
        ogDescription: 'Explore why file-based static publishing outperforms traditional CMS.',
        ogImage: '',
        robots: 'index,follow',
        noIndex: false
      },
      createdAt: now,
      updatedAt: now,
      publishedAt: now
    },
    {
      id: 'post_2',
      title: 'Building Resilience with Atomic File Operations',
      slug: 'building-resilience-with-atomic-file-operations',
      excerpt: 'How temporary files, atomic renames, and in-process lock managers protect your data without a SQL engine.',
      content: {
        blocks: [
          {
            id: 'at_1',
            type: 'heading',
            level: 2,
            text: 'Guaranteed Write Integrity'
          },
          {
            id: 'at_2',
            type: 'paragraph',
            text: 'Writing directly to destination files risks partial writes during power failures or server reboots. By writing to a randomized temporary file, flushing, and using OS-level atomic renames, corrupted files become impossible.'
          }
        ]
      },
      featuredImage: '',
      author: 'Security Engineer',
      category: 'technology',
      tags: ['nodejs', 'security', 'filesystem'],
      status: 'published',
      template: 'default',
      seo: {
        title: 'Building Resilience with Atomic File Operations',
        description: 'How temporary files and atomic renames protect data.',
        canonical: 'http://localhost:3000/blog/building-resilience-with-atomic-file-operations',
        ogTitle: 'Building Resilience with Atomic File Operations',
        ogDescription: 'How temporary files and atomic renames protect data.',
        ogImage: '',
        robots: 'index,follow',
        noIndex: false
      },
      createdAt: now,
      updatedAt: now,
      publishedAt: now
    }
  ];

  for (const post of posts) {
    await PostStore.save(post);
  }

  // Products
  const products: Product[] = [
    {
      id: 'prod_1',
      name: 'Ultra-Fast Developer Keyboard',
      slug: 'ultra-fast-developer-keyboard',
      sku: 'DEV-KB-001',
      price: 149.99,
      currency: 'USD',
      shortDescription: 'Custom mechanical keyboard tuned for maximum typing ergonomics and high tactile speed.',
      description: {
        blocks: [
          {
            id: 'pd_1',
            type: 'heading',
            level: 2,
            text: 'Engineered for Performance'
          },
          {
            id: 'pd_2',
            type: 'paragraph',
            text: 'Featuring hot-swappable switches, PBT double-shot keycaps, and a CNC aluminum enclosure with sound-dampening foam.'
          },
          {
            id: 'pd_3',
            type: 'table',
            headers: ['Specification', 'Detail'],
            rows: [
              ['Layout', '75% Compact'],
              ['Connectivity', 'USB-C / 2.4GHz / Bluetooth 5.2'],
              ['Battery', '4000 mAh Rechargeable'],
              ['Weight', '1.1 kg']
            ]
          }
        ]
      },
      images: [],
      category: 'hardware',
      tags: ['hardware', 'gadgets', 'workstation'],
      status: 'published',
      featured: true,
      template: 'default',
      seo: {
        title: 'Ultra-Fast Developer Keyboard | Hardware Store',
        description: 'Custom mechanical keyboard tuned for ergonomics.',
        canonical: 'http://localhost:3000/products/ultra-fast-developer-keyboard',
        ogTitle: 'Ultra-Fast Developer Keyboard',
        ogDescription: 'Custom mechanical keyboard tuned for ergonomics.',
        ogImage: '',
        robots: 'index,follow',
        noIndex: false
      },
      createdAt: now,
      updatedAt: now,
      publishedAt: now
    },
    {
      id: 'prod_2',
      name: 'Planfo CMS Limited Edition Hoodie',
      slug: 'planfo-cms-limited-edition-hoodie',
      sku: 'HOODIE-CMS-01',
      price: 59.0,
      currency: 'USD',
      shortDescription: 'Heavyweight organic cotton hoodie with embroidered static lightning icon.',
      description: {
        blocks: [
          {
            id: 'hd_1',
            type: 'heading',
            level: 2,
            text: 'Comfort Meets Quality'
          },
          {
            id: 'hd_2',
            type: 'paragraph',
            text: 'Crafted from 100% GOTS certified organic ring-spun cotton for unmatched warmth, comfort, and durability.'
          }
        ]
      },
      images: [],
      category: 'merchandise',
      tags: ['apparel', 'hoodie', 'merch'],
      status: 'published',
      featured: false,
      template: 'default',
      seo: {
        title: 'Planfo CMS Limited Edition Hoodie',
        description: 'Heavyweight organic cotton hoodie.',
        canonical: 'http://localhost:3000/products/planfo-cms-limited-edition-hoodie',
        ogTitle: 'Planfo CMS Limited Edition Hoodie',
        ogDescription: 'Heavyweight organic cotton hoodie.',
        ogImage: '',
        robots: 'index,follow',
        noIndex: false
      },
      createdAt: now,
      updatedAt: now,
      publishedAt: now
    }
  ];

  for (const prod of products) {
    await ProductStore.save(prod);
  }

  console.log('✅ Seed content loaded successfully.');
}

if (process.argv[1]?.endsWith('seed-sample-content.ts')) {
  seedDemoData().catch(console.error);
}

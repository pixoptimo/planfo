import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PlanfoProjectOptions {
  name: string;
  targetDir: string;
  theme?: string;
  siteUrl?: string;
  author?: string;
}

export function createPlanfoProject(options: PlanfoProjectOptions): { success: boolean; targetDir: string; error?: string } {
  const { name, targetDir, theme = 'planfo-default', siteUrl = 'http://localhost:3000', author = 'Planfo Publisher' } = options;
  const projectDir = path.resolve(process.cwd(), targetDir);

  try {
    if (fs.existsSync(projectDir) && fs.readdirSync(projectDir).length > 0) {
      return { success: false, targetDir: projectDir, error: `Target directory '${targetDir}' already exists and is not empty.` };
    }

    // 1. Create directory tree
    const dirs = [
      'planfo',
      'planfo/auth',
      'planfo/blueprints',
      'planfo/content/pages',
      'planfo/content/templates',
      'planfo/content/categories',
      'planfo/content/menus',
      'planfo/media',
      'planfo/themes/planfo-default',
      'generated',
      'generated/assets',
      'generated/assets/css',
      'generated/assets/js',
      'generated/assets/images',
      'generated/sample-templates'
    ];

    for (const d of dirs) {
      fs.mkdirSync(path.join(projectDir, d), { recursive: true });
    }

    // 1b. Initialize auth storage (empty users array so first-run Setup Wizard triggers on first visit to /admin)
    const initialUsers = {
      users: []
    };
    fs.writeFileSync(path.join(projectDir, 'planfo/auth/users.json'), JSON.stringify(initialUsers, null, 2), 'utf-8');

    // 2. planfo/config.json
    const configData = {
      name,
      version: '1.0.3',
      activeTheme: theme,
      siteUrl,
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(projectDir, 'planfo/config.json'), JSON.stringify(configData, null, 2), 'utf-8');

    // 3. planfo/settings.json
    const settingsData = {
      siteName: name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      siteUrl,
      description: 'Discover premium, accessible, and high-performance HTML5/CSS3 templates with zero-dependency vanilla architectures.',
      tagline: 'Curated UI Architecture • 2026 Production Standards',
      author,
      activeTheme: theme,
      featurePacks: {
        catalog: true
      },
      deployment: {
        target: 'github-pages',
        gitBranch: 'gh-pages',
        cname: '',
        gitRepo: ''
      },
      defaultSEO: {
        title: `${name} | UI Templates Showcase`,
        description: 'Explore production-grade web templates built with pristine semantic markup, container queries, and fluid typography.',
        robots: 'index,follow'
      }
    };
    fs.writeFileSync(path.join(projectDir, 'planfo/settings.json'), JSON.stringify(settingsData, null, 2), 'utf-8');

    // 4. Initial Pages
    // Home Page (Rich UI Templates Showcase Hero)
    const homePage = {
      id: 'page_home',
      title: 'Pure HTML5 & Modern CSS\nUI Templates Engineered to Wow',
      slug: 'home',
      status: 'published',
      template: 'default',
      pill: 'Curated UI Architecture • 2026 Production Standards',
      excerpt: 'Explore production-grade web templates built with pristine semantic markup, container queries, fluid typography, and zero-framework runtime overhead.',
      content: {
        blocks: [
          {
            id: 'hm_1',
            type: 'heading',
            level: 1,
            text: 'Welcome to My Website'
          },
          {
            id: 'hm_2',
            type: 'paragraph',
            text: 'Discover premium, accessible, and high-performance HTML5/CSS3 templates for SaaS, Fintech, Portfolios, and E-Commerce.'
          }
        ]
      },
      featuredImage: '',
      seo: {
        title: `Pixoptimo UI Templates — World-Class Modern Web Templates & Showcases`,
        description: `Explore production-grade web templates built with pristine semantic markup, container queries, fluid typography, and zero-framework runtime overhead.`,
        robots: 'index,follow'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(projectDir, 'planfo/content/pages/home.json'), JSON.stringify(homePage, null, 2), 'utf-8');

    // About Page
    const aboutPage = {
      id: 'page_about',
      title: 'About',
      slug: 'about',
      status: 'published',
      template: 'default',
      content: {
        blocks: [
          {
            id: 'ab_1',
            type: 'heading',
            level: 2,
            text: 'About Us'
          },
          {
            id: 'ab_2',
            type: 'paragraph',
            text: 'Planfo CMS is a database-free CMS built for static and self-hosted websites.'
          }
        ]
      },
      featuredImage: '',
      seo: {
        title: `About | ${settingsData.siteName}`,
        description: 'About our organization and mission',
        robots: 'index,follow'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(projectDir, 'planfo/content/pages/about.json'), JSON.stringify(aboutPage, null, 2), 'utf-8');

    // Contact Page
    const contactPage = {
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
            text: 'Contact Us'
          },
          {
            id: 'ct_2',
            type: 'paragraph',
            text: 'Get in touch with us at hello@example.com or through our contact form.'
          }
        ]
      },
      featuredImage: '',
      seo: {
        title: `Contact | ${settingsData.siteName}`,
        description: 'Get in touch with us',
        robots: 'index,follow'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(projectDir, 'planfo/content/pages/contact.json'), JSON.stringify(contactPage, null, 2), 'utf-8');

    // 4.5 Seed Templates Blueprint
    const defaultBlueprintSource = path.resolve(__dirname, '../../../storage/blueprints/templates.json');
    if (fs.existsSync(defaultBlueprintSource)) {
      fs.copyFileSync(defaultBlueprintSource, path.join(projectDir, 'planfo/blueprints/templates.json'));
    } else {
      const inlineTemplateBlueprint = {
        id: 'bp_templates',
        name: 'Templates',
        singularName: 'Template',
        slug: 'templates',
        icon: 'Layers',
        description: 'Showcase catalog for modern UI templates, layouts, and web components.',
        hasCategories: true,
        hasTags: true,
        hasContentEditor: true,
        isBuiltIn: false,
        fields: [
          {
            id: 'fld_tagline',
            name: 'tagline',
            label: 'Tagline / Card Subtitle',
            type: 'textarea',
            required: true,
            placeholder: 'Ultra-lean autonomous telemetry cockpit with glowing glassmorphism...',
            description: 'Short punchy summary displayed on cards and hero titles.'
          },
          {
            id: 'fld_badge',
            name: 'badge',
            label: 'Card Badge Text',
            type: 'text',
            required: false,
            placeholder: "Trending / Popular / Award Winner / Editor's Choice",
            description: 'Highlight pill shown at top of template preview card.'
          },
          {
            id: 'fld_badge_color',
            name: 'badgeColor',
            label: 'Badge Color Theme',
            type: 'select',
            required: false,
            defaultValue: 'purple',
            options: ['purple', 'emerald', 'pink', 'gold', 'blue'],
            placeholder: '',
            description: 'Color accent for badge (purple, emerald, pink, gold, blue).'
          },
          {
            id: 'fld_price',
            name: 'price',
            label: 'Price Display',
            type: 'text',
            required: false,
            defaultValue: 'Free',
            placeholder: 'Free or $49 PRO',
            description: 'Display price tag on cards and detail sidebar.'
          },
          {
            id: 'fld_is_free',
            name: 'isFree',
            label: 'Is Free Template?',
            type: 'boolean',
            required: false,
            defaultValue: true,
            placeholder: '',
            description: 'Enables free filter pill on catalog explorer.'
          },
          {
            id: 'fld_demo_url',
            name: 'demoUrl',
            label: 'Demo Preview URL',
            type: 'text',
            required: false,
            placeholder: 'sample-templates/quantum-saas.html or external URL',
            description: 'Iframe target loaded inside the interactive device simulator.'
          },
          {
            id: 'fld_download_file',
            name: 'downloadFile',
            label: 'Download File / Bundle URL',
            type: 'text',
            required: false,
            placeholder: 'sample-templates/quantum-saas.html or zip file URL',
            description: 'Direct file triggered by Download Template button.'
          },
          {
            id: 'fld_version',
            name: 'version',
            label: 'Template Version',
            type: 'text',
            required: false,
            defaultValue: 'v1.0.0',
            placeholder: 'v2.5.0',
            description: 'Semantic release version number.'
          },
          {
            id: 'fld_license',
            name: 'license',
            label: 'License Type',
            type: 'text',
            required: false,
            defaultValue: 'MIT Commercial & Personal',
            placeholder: 'MIT Commercial & Personal or Commercial License',
            description: 'License grant for buyers or users.'
          },
          {
            id: 'fld_author',
            name: 'author',
            label: 'Author / Studio',
            type: 'text',
            required: false,
            defaultValue: 'Pixoptimo Labs',
            placeholder: 'Pixoptimo Labs',
            description: 'Author or engineering team.'
          },
          {
            id: 'fld_rating',
            name: 'rating',
            label: 'Review Rating (out of 5)',
            type: 'number',
            required: false,
            defaultValue: 4.98,
            placeholder: '4.98',
            description: 'Numerical rating displayed with star icons.'
          },
          {
            id: 'fld_tech_stack',
            name: 'techStack',
            label: 'Tech Stack Chips',
            type: 'textarea',
            required: false,
            placeholder: 'HTML5 Semantic, Vanilla CSS3, Custom Properties, Zero Dependencies',
            description: 'Comma-separated list of technologies.'
          },
          {
            id: 'fld_features',
            name: 'features',
            label: 'Key Features Checklist',
            type: 'textarea',
            required: false,
            placeholder: 'Sub-20ms Time-to-Interactive on mobile\nResponsive CSS Grid layout\nCurated HSL color palette',
            description: 'Enter each feature bullet on a new line.'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(
        path.join(projectDir, 'planfo/blueprints/templates.json'),
        JSON.stringify(inlineTemplateBlueprint, null, 2),
        'utf-8'
      );
    }

    // 4.6 Seed Initial Sample Template Entries
    const sampleTemplates = [
      {
        id: 'tpl_quantum_saas',
        slug: 'quantum-saas',
        title: 'Quantum — AI Telemetry & Workflow SaaS',
        status: 'published',
        featuredImage: 'assets/images/quantum-saas.jpg',
        excerpt: 'Ultra-lean autonomous telemetry cockpit with glowing glassmorphism and real-time SVG charts.',
        data: {
          tagline: 'Ultra-lean autonomous telemetry cockpit with glowing glassmorphism and real-time SVG charts.',
          badge: 'Trending',
          badgeColor: 'purple',
          category: 'SaaS & Dashboard',
          categorySlug: 'saas',
          price: 'Free',
          isFree: true,
          demoUrl: 'sample-templates/quantum-saas.html',
          downloadFile: 'sample-templates/quantum-saas.html',
          version: 'v2.5.0',
          releaseDate: 'Sept 28, 2026',
          lastUpdated: 'Oct 08, 2026',
          license: 'MIT Commercial & Personal',
          author: 'Pixoptimo Labs',
          rating: 4.98,
          reviewCount: 342,
          downloads: '14,290',
          fileSize: '14.2 KB (Gzipped)',
          techStack: 'HTML5 Semantic, Vanilla CSS3, Custom Properties, Zero Dependencies, SVG Visualizations',
          features: 'Sub-20ms Time-to-Interactive (TTI) on mobile networks\nDynamic responsive CSS Grid metrics cockpit with live SVG telemetry waves\nCurated HSL color palette with ambient background glow effects\nFully accessible WCAG 2.1 AAA color contrast compliance\nContainer queries and fluid CSS clamp() responsive typography',
          quickStartCode: '<!-- Drop into any web server or static host -->\n<link rel="stylesheet" href="assets/css/quantum.css">\n<script src="assets/js/cockpit.js" defer></script>',
          cssTokens: ':root {\n  --bg-space: #07090e;\n  --card-surface: rgba(14, 18, 28, 0.75);\n  --border-glow: rgba(99, 102, 241, 0.25);\n  --accent-neon: #6366f1;\n  --accent-cyan: #06b6d4;\n  --text-main: #f8fafc;\n  --text-dim: #94a3b8;\n}',
          lighthousePerformance: 100,
          lighthouseAccessibility: 100,
          lighthouseBestPractices: 100,
          lighthouseSeo: 100,
          changelog: 'v2.5.0 (Oct 08, 2026): Added mobile fluid grid clamp() scaling.\nv2.0.0 (Sept 28, 2026): Initial release with SVG charts.'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      },
      {
        id: 'tpl_nexus_fintech',
        slug: 'nexus-fintech',
        title: 'Nexus — Decentralized Wealth OS & Trading Terminal',
        status: 'published',
        featuredImage: 'assets/images/nexus-fintech.jpg',
        excerpt: 'High-frequency institutional decentralized terminal with glassmorphism telemetry.',
        data: {
          tagline: 'High-frequency institutional decentralized terminal with glassmorphism telemetry.',
          badge: 'Popular',
          badgeColor: 'emerald',
          category: 'Fintech & Web3',
          categorySlug: 'fintech',
          price: '$49 PRO',
          isFree: false,
          demoUrl: 'sample-templates/nexus-fintech.html',
          downloadFile: 'sample-templates/nexus-fintech.html',
          version: 'v2.1.0',
          releaseDate: 'Aug 14, 2026',
          lastUpdated: 'Oct 04, 2026',
          license: 'Commercial License',
          author: 'Pixoptimo Labs',
          rating: 4.96,
          reviewCount: 289,
          downloads: '11,400',
          fileSize: '18.6 KB (Gzipped)',
          techStack: 'HTML5, Vanilla CSS3, Vanilla ES6, SVG Charts, Accessible Tables',
          features: 'Institutional 3-column financial workstation layout\nInteractive JavaScript token swap calculator with live exchange rate emulation\nCustom vector SVG crypto candlestick and smooth equity area charts\nDynamic horizontal ticker marquee with real-time price delta badges\nModal wallet connector interface with simulated Web3 connection state\nOptimized for high-density OLED monitors with true pitch-black contrast',
          quickStartCode: '<!-- Pure Vanilla HTML & JS - Drop into any web server -->\n<script src="assets/js/dex-calc.js" defer></script>\n<link rel="stylesheet" href="assets/css/terminal.css">',
          cssTokens: ':root {\n  --bg: #090d16;\n  --card-bg: #111726;\n  --border: rgba(16, 185, 129, 0.2);\n  --accent-green: #10b981;\n  --accent-green-glow: rgba(16, 185, 129, 0.35);\n  --text: #f1f5f9;\n  --font-heading: \'Space Grotesk\', sans-serif;\n}',
          lighthousePerformance: 99,
          lighthouseAccessibility: 100,
          lighthouseBestPractices: 100,
          lighthouseSeo: 100,
          changelog: 'v3.1.2 (Oct 04, 2026): Polished swap calculation rounding and added keyboard hotkeys.\nv3.0.0 (Aug 14, 2026): Major refactor with Space Grotesk typography and SVG candles.'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      },
      {
        id: 'tpl_avant_agency',
        slug: 'avant-agency',
        title: 'Avant — Kinetic Studio & Digital Architecture',
        status: 'published',
        featuredImage: 'assets/images/avant-agency.jpg',
        excerpt: 'Bold typographic digital flagship with kinetic hover cards, holographic gradients, and fluid layout.',
        data: {
          tagline: 'Bold typographic digital flagship with kinetic hover cards, holographic gradients, and fluid layout.',
          badge: 'Award Winner',
          badgeColor: 'pink',
          category: 'Agency & Portfolio',
          categorySlug: 'agency',
          price: 'Free',
          isFree: true,
          demoUrl: 'sample-templates/avant-agency.html',
          downloadFile: 'sample-templates/avant-agency.html',
          version: 'v1.8.0',
          releaseDate: 'Jul 22, 2026',
          lastUpdated: 'Sep 29, 2026',
          license: 'MIT Commercial & Personal',
          author: 'Pixoptimo Labs',
          rating: 4.99,
          reviewCount: 412,
          downloads: '18,900',
          fileSize: '12.8 KB (Gzipped)',
          techStack: 'HTML5, Modern CSS, CSS Custom Properties, Fluid Typography, Hardware-Accelerated Transitions',
          features: 'Avant-garde Syne typography with fluid clamp() scaling from 48px to 110px\nDynamic holographic CSS gradient reflections on card hover\nRefined micro-stagger animations for project cards\nZero JavaScript dependency footprint — 100% pure CSS motion\nFull dark mode aesthetic with obsidian ink backgrounds\nMobile-first responsive drawer menu and smooth scroll anchors',
          quickStartCode: '<!-- Plug and play into GitHub Pages, Cloudflare Pages, or Netlify -->\ngit clone https://github.com/pixoptimo/avant-studio.git\nopen avant-agency.html',
          cssTokens: ':root {\n  --bg: #050507;\n  --card-bg: rgba(255, 255, 255, 0.03);\n  --card-border: rgba(255, 255, 255, 0.12);\n  --font-display: \'Syne\', sans-serif;\n  --font-body: \'Space Grotesk\', sans-serif;\n  --accent-gradient: linear-gradient(135deg, #ff007f 0%, #7928ca 50%, #00dfd8 100%);\n}',
          lighthousePerformance: 100,
          lighthouseAccessibility: 100,
          lighthouseBestPractices: 100,
          lighthouseSeo: 100,
          changelog: 'v1.8.0 (Sep 29, 2026): Enhanced smooth cubic-bezier transitions for card elevation.\nv1.0.0 (Jul 22, 2026): Initial release.'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      },
      {
        id: 'tpl_aurelie_luxury',
        slug: 'aurelie-luxury',
        title: 'Aurélie — Haute Couture & Editorial Maison',
        status: 'published',
        featuredImage: 'assets/images/aurelie-luxury.jpg',
        excerpt: 'Serene editorial luxury storefront with warm champagne gold accents, Cormorant serif typography, and cart preview.',
        data: {
          tagline: 'Serene editorial luxury storefront with warm champagne gold accents, Cormorant serif typography, and cart preview.',
          badge: "Editor's Choice",
          badgeColor: 'gold',
          category: 'Luxury E-Commerce',
          categorySlug: 'ecommerce',
          price: '$59 PRO',
          isFree: false,
          demoUrl: 'sample-templates/aurelie-luxury.html',
          downloadFile: 'sample-templates/aurelie-luxury.html',
          version: 'v2.0.1',
          releaseDate: 'Jun 18, 2026',
          lastUpdated: 'Sep 19, 2026',
          license: 'Commercial License',
          author: 'Pixoptimo Labs',
          rating: 4.97,
          reviewCount: 195,
          downloads: '7,450',
          fileSize: '15.4 KB (Gzipped)',
          techStack: 'HTML5, Vanilla CSS3, Micro-Interactions, Responsive Lookbook, Accessible Forms',
          features: 'Editorial magazine layout with high-fashion typography hierarchy\nHarmonious warm charcoal & champagne gold color space\nInteractive shopping bag counter and checkout intent drawer\nSemantic microdata markup for luxury product catalogs\nResponsive lookbook grid with graceful aspect-ratio locking\nPure CSS hover zoom and subtle border elevation',
          quickStartCode: '<!-- Link editorial styling and fonts -->\n<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=Montserrat:wght@300;400;500&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="assets/css/maison.css">',
          cssTokens: ':root {\n  --bg: #12100e;\n  --card-bg: #1a1714;\n  --border: rgba(212, 175, 55, 0.2);\n  --gold: #d4af37;\n  --gold-light: #f3e5ab;\n  --text: #f7f4ed;\n  --font-serif: \'Cormorant Garamond\', Georgia, serif;\n}',
          lighthousePerformance: 100,
          lighthouseAccessibility: 100,
          lighthouseBestPractices: 100,
          lighthouseSeo: 100,
          changelog: 'v2.0.1 (Sep 19, 2026): Fixed mobile touch response for cart triggers.\nv2.0.0 (Jun 18, 2026): Initial commercial edition.'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      }
    ];

    for (const tpl of sampleTemplates) {
      fs.writeFileSync(
        path.join(projectDir, `planfo/content/templates/${tpl.slug}.json`),
        JSON.stringify(tpl, null, 2),
        'utf-8'
      );
    }

    // 5. Reliable Multi-Path Theme Installation
    const findThemeDir = (themeId: string): string | null => {
      const candidates = [
        path.resolve(__dirname, '../themes', themeId),
        path.resolve(__dirname, '../../themes', themeId),
        path.resolve(__dirname, '../../../themes', themeId),
        path.resolve(process.cwd(), 'themes', themeId),
        path.resolve(__dirname, 'themes', themeId)
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand) && fs.existsSync(path.join(cand, 'layout.html'))) {
          return cand;
        }
      }
      return null;
    };

    // Install planfo-default (Planfo UI Templates Showcase)
    const defaultThemeSource = findThemeDir('planfo-default');
    const targetDefaultThemeDir = path.join(projectDir, 'planfo/themes/planfo-default');
    if (defaultThemeSource) {
      copyRecursiveSync(defaultThemeSource, targetDefaultThemeDir);
    }

    // Copy theme assets & sample-templates directly into generated/
    const sourceTheme = defaultThemeSource;
    if (sourceTheme) {
      const assetsSrc = path.join(sourceTheme, 'assets');
      if (fs.existsSync(assetsSrc)) {
        copyRecursiveSync(assetsSrc, path.join(projectDir, 'generated/assets'));
      }
      const samplesSrc = path.join(sourceTheme, 'sample-templates');
      if (fs.existsSync(samplesSrc)) {
        copyRecursiveSync(samplesSrc, path.join(projectDir, 'generated/sample-templates'));
      }
      // Also copy assets/images to planfo/media for CMS media picker
      const imagesSrc = path.join(sourceTheme, 'assets/images');
      if (fs.existsSync(imagesSrc)) {
        copyRecursiveSync(imagesSrc, path.join(projectDir, 'planfo/media'));
      }
    }


    // 6. Root README.md
    const readmeContent = `# ${settingsData.siteName}

This static website was created with **Planfo CMS** (v1.0.0) — a simple, database-free website builder.

## Project Structure

\`\`\`
${name}/
├── planfo/
│   ├── config.json         # Planfo Project configuration
│   ├── settings.json       # Site title, metadata & deployment settings
│   ├── content/
│   │   └── pages/          # Human-readable JSON page storage
│   │       ├── home.json
│   │       ├── about.json
│   │       └── contact.json
│   ├── media/              # Uploaded media assets
│   └── themes/             # Replaceable design themes
│       └── planfo-default/
├── generated/              # Compiled, production-ready static HTML output
└── README.md
\`\`\`

## Getting Started

1. **Start the CMS & Dev Server**:
   \`\`\`bash
   planfo dev
   \`\`\`
   Opens the Planfo CMS dashboard at \`http://localhost:3000\`.

2. **Generate the Static Website**:
   \`\`\`bash
   planfo build
   \`\`\`
   Generates production HTML files in \`generated/\`.

3. **Preview**:
   \`\`\`bash
   planfo preview
   \`\`\`
   Or open \`generated/index.html\` directly in your browser.

4. **Publish to GitHub Pages**:
   Configure your GitHub repository in Planfo CMS Settings, then click **Publish** or run:
   \`\`\`bash
   planfo publish
   \`\`\`
   Only files in \`generated/\` are published to GitHub Pages. The \`planfo/\` directory is never published.
`;
    fs.writeFileSync(path.join(projectDir, 'README.md'), readmeContent, 'utf-8');

    // 7. .gitignore
    const gitignoreContent = `# Planfo CMS Git Ignore
node_modules/
.DS_Store
*.log
.staging*
`;
    fs.writeFileSync(path.join(projectDir, '.gitignore'), gitignoreContent, 'utf-8');

    return { success: true, targetDir: projectDir };
  } catch (err) {
    return { success: false, targetDir: projectDir, error: err instanceof Error ? err.message : String(err) };
  }
}

function copyRecursiveSync(src: string, dest: string) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

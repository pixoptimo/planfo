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
      '.planfo',
      '.planfo/content/pages',
      '.planfo/media',
      '.planfo/themes/planfo-default/assets',
      '.planfo/themes/planfo-default/page',
      'generated',
      'generated/assets',
      'generated/assets/css',
      'generated/assets/js',
      'generated/assets/images'
    ];

    for (const d of dirs) {
      fs.mkdirSync(path.join(projectDir, d), { recursive: true });
    }

    // 2. .planfo/config.json
    const configData = {
      name,
      version: '0.1.0',
      activeTheme: theme,
      siteUrl,
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(projectDir, '.planfo/config.json'), JSON.stringify(configData, null, 2), 'utf-8');

    // 3. .planfo/settings.json
    const settingsData = {
      siteName: name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      siteUrl,
      description: 'Built with Planfo CMS — Database-free static website builder.',
      author,
      activeTheme: theme,
      deployment: {
        target: 'github-pages',
        gitBranch: 'gh-pages',
        cname: '',
        gitRepo: ''
      },
      defaultSEO: {
        title: `${name} | Static Site`,
        description: 'A static website created with Planfo CMS.',
        robots: 'index,follow'
      }
    };
    fs.writeFileSync(path.join(projectDir, '.planfo/settings.json'), JSON.stringify(settingsData, null, 2), 'utf-8');

    // 4. Initial Pages
    // Home Page
    const homePage = {
      id: 'page_home',
      title: 'Home',
      slug: 'home',
      status: 'published',
      template: 'default',
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
            text: 'This website was created with Planfo CMS.'
          }
        ]
      },
      featuredImage: '',
      seo: {
        title: `Home | ${settingsData.siteName}`,
        description: `Welcome to ${settingsData.siteName}`,
        robots: 'index,follow'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(projectDir, '.planfo/content/pages/home.json'), JSON.stringify(homePage, null, 2), 'utf-8');

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
    fs.writeFileSync(path.join(projectDir, '.planfo/content/pages/about.json'), JSON.stringify(aboutPage, null, 2), 'utf-8');

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
    fs.writeFileSync(path.join(projectDir, '.planfo/content/pages/contact.json'), JSON.stringify(contactPage, null, 2), 'utf-8');

    // 5. Default Theme Files in .planfo/themes/planfo-default/
    const defaultThemeSource = path.resolve(__dirname, '../../../themes/planfo-default');
    const targetThemeDir = path.join(projectDir, '.planfo/themes/planfo-default');

    if (fs.existsSync(defaultThemeSource)) {
      copyRecursiveSync(defaultThemeSource, targetThemeDir);
    } else {
      // Create inline fallback theme files
      fs.writeFileSync(path.join(targetThemeDir, 'theme.json'), JSON.stringify({
        id: 'planfo-default',
        name: 'Planfo Default',
        version: '1.0.0',
        author: 'Planfo Team',
        description: 'Clean default theme for Planfo CMS',
        templates: ['default', 'landing']
      }, null, 2), 'utf-8');

      fs.writeFileSync(path.join(targetThemeDir, 'layout.html'), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <%- metaTags %>
  <link rel="stylesheet" href="<%= (typeof page !== 'undefined' && page && page.slug === 'home') ? '.' : '..' %>/assets/style.css">
</head>
<body>
  <header style="padding: 1.5rem; border-bottom: 1px solid #1f293d; background: #090d16; color: #fff;">
    <div style="max-width: 1000px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
      <a href="<%= (typeof page !== 'undefined' && page && page.slug === 'home') ? '.' : '..' %>/index.html" style="color: #fff; text-decoration: none; font-weight: bold; font-size: 1.2rem;">
        <%= site.siteName %>
      </a>
      <nav style="display: flex; gap: 1.5rem;">
        <a href="<%= (typeof page !== 'undefined' && page && page.slug === 'home') ? '.' : '..' %>/index.html" style="color: #9ca3af; text-decoration: none;">Home</a>
        <a href="<%= (typeof page !== 'undefined' && page && page.slug === 'home') ? '.' : '..' %>/about/index.html" style="color: #9ca3af; text-decoration: none;">About</a>
        <a href="<%= (typeof page !== 'undefined' && page && page.slug === 'home') ? '.' : '..' %>/contact/index.html" style="color: #9ca3af; text-decoration: none;">Contact</a>
      </nav>
    </div>
  </header>
  <main style="max-width: 1000px; margin: 3rem auto; padding: 0 1.5rem; min-height: 60vh;">
    <%- body %>
  </main>
  <footer style="padding: 2rem 1.5rem; border-top: 1px solid #1f293d; text-align: center; color: #6b7280; font-size: 0.85rem;">
    &copy; <%= currentYear %> <%= site.siteName %>. Built with Planfo CMS.
  </footer>
</body>
</html>`, 'utf-8');

      fs.writeFileSync(path.join(targetThemeDir, 'index.html'), `<h1><%= page ? page.title : 'Welcome' %></h1>
<%- renderContent(page ? page.content : '') %>`, 'utf-8');

      fs.writeFileSync(path.join(targetThemeDir, 'page.html'), `<h1><%= page.title %></h1>
<%- renderContent(page.content) %>`, 'utf-8');

      fs.writeFileSync(path.join(targetThemeDir, 'assets/style.css'), `body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #090d16; color: #f3f4f6; margin: 0; line-height: 1.6; } a { color: #3b82f6; }`, 'utf-8');
      fs.writeFileSync(path.join(targetThemeDir, 'assets/script.js'), `// Planfo Theme Script`, 'utf-8');
    }

    // 6. Root README.md
    const readmeContent = `# ${settingsData.siteName}

This static website was created with **Planfo CMS** (Beta v0.1) — a simple, database-free website builder.

## Project Structure

\`\`\`
${name}/
├── .planfo/
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
   Only files in \`generated/\` are published to GitHub Pages. The \`.planfo/\` directory is never published.
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

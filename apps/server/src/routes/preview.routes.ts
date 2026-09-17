import { Router, type Request, type Response } from 'express';
import { StaticSiteGenerator } from '@cms/generator';
import { PageStore } from '../storage/pageStore.js';
import { PostStore } from '../storage/postStore.js';
import { ProductStore } from '../storage/productStore.js';
import { requireAuth } from '../auth/middleware.js';
import { config } from '../config/env.js';

export const previewRouter = Router();

previewRouter.use(requireAuth);

// GET /api/preview/:type/:slug
previewRouter.get('/:type/:slug', async (req: Request, res: Response): Promise<void> => {
  const type = String(req.params.type);
  const slug = String(req.params.slug);

  if (type !== 'page' && type !== 'post' && type !== 'product') {
    res.status(400).send('Invalid preview type. Must be page, post, or product.');
    return;
  }

  let item = null;
  if (type === 'page') {
    item = await PageStore.getBySlug(slug);
  } else if (type === 'post') {
    item = await PostStore.getBySlug(slug);
  } else {
    item = await ProductStore.getBySlug(slug);
  }

  if (!item) {
    res.status(404).send(`Item not found for preview: ${type}/${slug}`);
    return;
  }

  try {
    const generator = new StaticSiteGenerator({
      storagePath: config.STORAGE_PATH,
      templatesPath: config.TEMPLATES_PATH,
      outputPath: config.OUTPUT_PATH
    });

    const renderedHtml = await generator.renderPreview(type, item);

    // Inject a small preview banner
    const banner = `
    <div style="position:fixed;top:0;left:0;right:0;background:#1e293b;color:#38bdf8;padding:8px 16px;font-family:sans-serif;font-size:13px;font-weight:600;display:flex;justify-content:space-between;align-items:center;z-index:999999;box-shadow:0 2px 8px rgba(0,0,0,0.3);border-bottom:2px solid #0284c7;">
      <span>👁️ CMS Live Preview Mode — <strong>${type.toUpperCase()}: ${item.slug}</strong> (${item.status.toUpperCase()})</span>
      <span style="font-size:11px;color:#94a3b8;">Not published to live website</span>
    </div>
    <div style="height:36px;"></div>
    `;

    const htmlWithBanner = renderedHtml.replace('<body>', `<body>\n${banner}`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlWithBanner);
  } catch (err) {
    res.status(500).send(`Preview rendering error: ${String(err)}`);
  }
});

import sanitizeHtml from 'sanitize-html';
import type { StructuredContent, ContentBlock } from '@cms/schemas';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'b', 'i', 'strong', 'em',
    'strike', 'code', 'pre', 'hr', 'br', 'ul', 'ol', 'li', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'figure', 'figcaption',
    'span', 'div'
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel', 'class', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
    th: ['colspan', 'rowspan', 'class', 'scope'],
    td: ['colspan', 'rowspan', 'class'],
    div: ['class'],
    span: ['class'],
    p: ['class'],
    blockquote: ['class', 'cite'],
    code: ['class'],
    pre: ['class'],
    table: ['class'],
    h1: ['class', 'id'],
    h2: ['class', 'id'],
    h3: ['class', 'id'],
    h4: ['class', 'id'],
    h5: ['class', 'id'],
    h6: ['class', 'id']
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') {
        attribs.rel = 'noopener noreferrer';
      }
      return { tagName, attribs };
    }
  }
};

/**
 * Sanitizes arbitrary HTML strings against XSS attacks.
 */
export function sanitize(html: string): string {
  if (!html) return '';
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

/**
 * Converts a structured content block into semantic, sanitized HTML.
 */
export function renderBlockToHtml(block: ContentBlock): string {
  switch (block.type) {
    case 'heading': {
      const level = block.level || 2;
      const text = escapeHtml(block.text);
      return `<h${level} class="cms-heading cms-heading-${level}">${text}</h${level}>`;
    }

    case 'paragraph': {
      const text = escapeHtml(block.text);
      return `<p class="cms-paragraph">${text}</p>`;
    }

    case 'blockquote': {
      const text = escapeHtml(block.text);
      const citation = block.citation ? `<cite class="cms-citation">— ${escapeHtml(block.citation)}</cite>` : '';
      return `<blockquote class="cms-blockquote"><p>${text}</p>${citation}</blockquote>`;
    }

    case 'list': {
      const tag = block.style === 'ordered' ? 'ol' : 'ul';
      const items = (block.items || [])
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('\n');
      return `<${tag} class="cms-list cms-list-${block.style}">\n${items}\n</${tag}>`;
    }

    case 'image': {
      const url = escapeAttribute(block.url);
      const alt = escapeAttribute(block.alt || '');
      const caption = block.caption ? `<figcaption class="cms-figcaption">${escapeHtml(block.caption)}</figcaption>` : '';
      const widthAttr = block.width ? ` width="${block.width}"` : '';
      const heightAttr = block.height ? ` height="${block.height}"` : '';
      return `<figure class="cms-figure"><img src="${url}" alt="${alt}" loading="lazy"${widthAttr}${heightAttr} class="cms-image" />${caption}</figure>`;
    }

    case 'button': {
      const url = escapeAttribute(block.url);
      const text = escapeHtml(block.text);
      const target = block.target === '_blank' ? ' target="_blank" rel="noopener noreferrer"' : '';
      const variantClass = `cms-btn-${block.variant || 'primary'}`;
      return `<div class="cms-button-wrap"><a href="${url}" class="cms-btn ${variantClass}"${target}>${text}</a></div>`;
    }

    case 'table': {
      const headers = (block.headers || [])
        .map((h) => `<th>${escapeHtml(h)}</th>`)
        .join('');
      const thead = headers ? `<thead><tr>${headers}</tr></thead>` : '';
      const rows = (block.rows || [])
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('\n');
      const tbody = `<tbody>${rows}</tbody>`;
      return `<div class="cms-table-responsive"><table class="cms-table">${thead}${tbody}</table></div>`;
    }

    case 'callout': {
      const variant = block.variant || 'info';
      const title = block.title ? `<strong class="cms-callout-title">${escapeHtml(block.title)}</strong>` : '';
      const text = escapeHtml(block.text);
      return `<div class="cms-callout cms-callout-${variant}">${title}<p>${text}</p></div>`;
    }

    case 'divider': {
      return '<hr class="cms-divider" />';
    }

    case 'code': {
      const lang = escapeAttribute(block.language || 'plaintext');
      const code = escapeHtml(block.code);
      return `<pre class="cms-code-block"><code class="language-${lang}">${code}</code></pre>`;
    }

    default:
      return '';
  }
}

/**
 * Converts structured content object or clean HTML string into full sanitized HTML.
 */
export function renderStructuredContent(content: StructuredContent | string | any): string {
  if (!content) {
    return '';
  }
  if (typeof content === 'string') {
    return sanitize(content);
  }
  if (typeof content === 'object' && typeof content.html === 'string') {
    return sanitize(content.html);
  }
  if (!Array.isArray(content.blocks)) {
    return '';
  }
  const rawHtml = content.blocks.map(renderBlockToHtml).join('\n\n');
  return sanitize(rawHtml);
}

/**
 * Escapes characters for HTML text content.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escapes characters for HTML attributes.
 */
export function escapeAttribute(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

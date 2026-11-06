/**
 * Pixoptimo UI Templates - Details & Documentation Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDetailsPage();
});

// Theme Management (Light Mode Only)
function initTheme() {
  document.documentElement.setAttribute('data-theme', 'light');
  try {
    localStorage.removeItem('pixoptimo_theme');
  } catch (e) {}
}

function updateThemeIcon() {
  // Light mode only
}

function initDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  let templateId = urlParams.get('id');
  if (!templateId) {
    const detailsMatch = window.location.pathname.match(/^\/([^\/]+)\/details/);
    if (detailsMatch && detailsMatch[1]) {
      templateId = detailsMatch[1];
    }
  }
  if (!templateId) {
    const m = window.location.pathname.match(/\/(?:templates|products)\/([^\/]+)/);
    if (m && m[1]) templateId = m[1];
  }
  if (!templateId) templateId = (window.TEMPLATES_DATA && window.TEMPLATES_DATA[0]?.id) || 'quantum-saas';
  const template = window.getTemplateById ? window.getTemplateById(templateId) : null;

  if (!template) return;

  // Title & Metadata
  document.title = `${template.title} — Details & Documentation | Pixoptimo`;
  const crumbTitle = document.getElementById('crumbTemplateTitle');
  if (crumbTitle) crumbTitle.textContent = template.title;

  const headerTitle = document.getElementById('detailsTitle');
  if (headerTitle) headerTitle.textContent = template.title;

  const headerSubtitle = document.getElementById('detailsSubtitle');
  if (headerSubtitle) headerSubtitle.textContent = template.tagline;

  const badgeEl = document.getElementById('detailsBadge');
  if (badgeEl) {
    badgeEl.className = `badge badge-${template.badgeColor}`;
    badgeEl.textContent = template.badge;
  }

  const versionPill = document.getElementById('detailsVersion');
  if (versionPill) versionPill.textContent = template.version;

  const updatedPill = document.getElementById('detailsUpdated');
  if (updatedPill) updatedPill.textContent = template.lastUpdated;

  const ratingPill = document.getElementById('detailsRating');
  if (ratingPill) ratingPill.textContent = `★ ${template.rating} (${template.reviewCount} reviews)`;

  const downloadsPill = document.getElementById('detailsDownloads');
  if (downloadsPill) downloadsPill.textContent = `${template.downloads} downloads`;

  // Featured Media & Primary Actions
  const featuredImg = document.getElementById('featuredImage');
  if (featuredImg) {
    featuredImg.src = template.featuredImage;
    featuredImg.alt = `${template.title} full showcase`;
  }

  const liveDemoBtn = document.getElementById('liveDemoBtn');
  if (liveDemoBtn) {
    liveDemoBtn.href = `/demos/${template.id}/index.html`;
  }

  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      fetch(template.downloadFile)
        .then(res => res.blob())
        .then(blob => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${template.id}.html`;
          link.click();
          URL.revokeObjectURL(link.href);
          window.showToast?.(`Downloading ${template.id}.html package`, '📦');
        })
        .catch(err => {
          console.error(err);
          window.open(template.downloadFile, '_blank');
        });
    });
  }

  const priceVal = document.getElementById('priceVal');
  if (priceVal) priceVal.textContent = template.price;

  // Tabs Handling
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(`tab-${target}`);
      if (panel) panel.classList.add('active');
    });
  });

  // Overview Tab: Detailed Description & Features
  const detailedDesc = document.getElementById('detailedDescription');
  if (detailedDesc) {
    if (template.overview) {
      detailedDesc.textContent = template.overview;
      detailedDesc.style.whiteSpace = 'pre-line';
    } else if (template.contentHtml) {
      detailedDesc.innerHTML = template.contentHtml;
    } else {
      detailedDesc.textContent = template.description || 'High-performance responsive template architecture.';
    }
  }

  const featuresList = document.getElementById('featuresChecklist');
  if (featuresList) {
    const feats = (template.features && template.features.length) ? template.features : [
      'Responsive layout engineered for seamless cross-device adaptability',
      'Zero-runtime overhead built strictly with vanilla semantic HTML and modern CSS',
      'W3C standards compliant and WCAG accessible markup structure'
    ];
    featuresList.innerHTML = feats.map(f => `
      <div class="checklist-item">
        <div class="checklist-icon">✓</div>
        <div class="checklist-text">${f}</div>
      </div>
    `).join('');
  }

  // Architecture Tab: File Tree
  const fileTreeContainer = document.getElementById('fileTreeContainer');
  if (fileTreeContainer) {
    function renderTree(nodes, indent = 0) {
      if (!Array.isArray(nodes)) return '';
      return nodes.map(node => {
        const isDir = node.type === 'dir';
        const indentStyle = indent > 0 ? `style="padding-left: ${indent * 1.5}rem"` : '';
        let html = `
          <div class="tree-node" ${indentStyle}>
            <span class="${isDir ? 'tree-icon-dir' : 'tree-icon-file'}">${isDir ? '📁' : '📄'}</span>
            <strong>${node.name}</strong>
            ${node.desc ? `<span class="tree-desc">// ${node.desc}</span>` : ''}
          </div>
        `;
        if (node.children) {
          html += renderTree(node.children, indent + 1);
        }
        return html;
      }).join('');
    }
    const treeData = (template.fileTree && template.fileTree.length) ? template.fileTree : [
      { name: template.id + '.html', type: 'file', desc: 'Main template markup' },
      { name: 'assets/', type: 'dir', children: [
        { name: 'css/style.css', type: 'file', desc: 'Custom styles and layout tokens' },
        { name: 'js/app.js', type: 'file', desc: 'Vanilla interactions' }
      ]},
      { name: 'README.md', type: 'file', desc: 'Documentation & setup guidelines' }
    ];
    fileTreeContainer.innerHTML = renderTree(treeData);
  }

  // Documentation Tab: Code Snippets & CSS Tokens
  const quickStartSnippet = document.getElementById('quickStartSnippet');
  if (quickStartSnippet) {
    quickStartSnippet.textContent = template.quickStartCode || `<!-- Plug and play -->\n<link rel="stylesheet" href="assets/css/${template.id}.css">\n<script src="assets/js/${template.id}.js" defer></script>`;
  }

  const cssTokensSnippet = document.getElementById('cssTokensSnippet');
  if (cssTokensSnippet) {
    cssTokensSnippet.textContent = template.cssTokens || `:root {\n  --bg: #07090e;\n  --accent: #6366f1;\n}`;
  }

  // Changelog Tab
  const changelogContainer = document.getElementById('changelogContainer');
  if (changelogContainer) {
    const logs = (template.changelog && template.changelog.length) ? template.changelog : [
      { version: template.version || 'v1.0.0', date: template.lastUpdated || 'Recent', note: 'Initial production launch and verified package release.' }
    ];
    changelogContainer.innerHTML = logs.map(item => `
      <div style="border-left: 2px solid var(--primary); padding-left: 1.5rem; margin-bottom: 1.5rem; position: relative;">
        <div style="position: absolute; left: -7px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--primary);"></div>
        <div style="display: flex; gap: 10px; align-items: baseline; margin-bottom: 4px;">
          <strong style="font-size: 1.1rem; color: #fff;">${item.version}</strong>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${item.date}</span>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.92rem; margin: 0;">${item.note}</p>
      </div>
    `).join('');
  }

  // Sidebar Specs
  const specRelease = document.getElementById('specRelease');
  if (specRelease) specRelease.textContent = template.releaseDate;

  const specLicense = document.getElementById('specLicense');
  if (specLicense) specLicense.textContent = template.license;

  const specFramework = document.getElementById('specFramework');
  if (specFramework) {
    const rawStack = template.techStack;
    const arr = Array.isArray(rawStack) ? rawStack : (typeof rawStack === 'string' ? rawStack.split(',').map(s => s.trim()).filter(Boolean) : []);
    if (arr.length > 0) {
      specFramework.innerHTML = arr.map(t => `<span class="tech-chip">${t}</span>`).join(' ');
    } else {
      specFramework.innerHTML = `<span class="tech-chip">HTML5 Semantic</span> <span class="tech-chip">Vanilla CSS3</span>`;
    }
  }

  const specBrowser = document.getElementById('specBrowser');
  if (specBrowser) {
    specBrowser.textContent = template.browserSupport || 'All Modern Browsers (Chrome, Safari, Firefox, Edge)';
  }

  const specLighthouse = document.getElementById('specLighthouse');
  if (specLighthouse && template.lighthouseScore) {
    const lh = template.lighthouseScore;
    specLighthouse.textContent = `${lh.performance || 100} / ${lh.accessibility || 100} / ${lh.bestPractices || 100} / ${lh.seo || 100}`;
  }

  const specSize = document.getElementById('specSize');
  if (specSize) specSize.textContent = template.fileSize;

  const specAuthor = document.getElementById('specAuthor');
  if (specAuthor) specAuthor.textContent = template.author;

  // Related Templates
  const relatedGrid = document.getElementById('relatedGrid');
  if (relatedGrid && window.TEMPLATES_DATA) {
    const related = window.TEMPLATES_DATA.filter(t => t.id !== template.id).slice(0, 3);
    relatedGrid.innerHTML = related.map(rel => `
      <article class="template-card">
        <div class="card-thumbnail-box">
          <img src="${rel.thumbnail}" alt="${rel.title}" class="card-thumbnail" loading="lazy">
          <div class="card-badge-top"><span class="badge badge-${rel.badgeColor}">${rel.badge}</span></div>
          <div class="card-price-top">${rel.price}</div>
        </div>
        <div class="card-content">
          <div class="card-meta-row">
            <span class="card-category">${rel.category}</span>
            <span class="card-rating">★ ${rel.rating}</span>
          </div>
          <h3 class="card-title" style="font-size: 1.1rem;"><a href="/${rel.id}/details">${rel.title}</a></h3>
          <p class="card-description">${rel.tagline}</p>
          <div class="card-actions">
            <a href="/${rel.id}/details" class="btn btn-details btn-sm">Details</a>
            <a href="/demos/${rel.id}/index.html" class="btn btn-demo btn-sm">Demo</a>
          </div>
        </div>
      </article>
    `).join('');
  }

  // Copy Code snippet buttons
  document.querySelectorAll('.copy-code-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const codeId = btn.getAttribute('data-target');
      const codeEl = document.getElementById(codeId);
      if (codeEl) {
        navigator.clipboard.writeText(codeEl.textContent).then(() => {
          const originalText = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = originalText, 2000);
          window.showToast?.('Code snippet copied to clipboard', '📋');
        });
      }
    });
  });
}

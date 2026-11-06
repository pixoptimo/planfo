/**
 * Pixoptimo UI Templates - Catalog Controller
 * World-Class UI/UX Interactions & Rendering
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCatalog();
});

// Toast Notifications
window.showToast = function(message, icon = '✨') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
};

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

// Catalog Card Rendering & Filtering
function initCatalog() {
  const grid = document.getElementById('templatesGrid');
  if (!grid || !window.TEMPLATES_DATA) return;

  let currentCategory = 'all';
  let currentSearch = '';
  let currentSort = 'featured';

  function render() {
    let filtered = window.TEMPLATES_DATA.filter(item => {
      const matchCat = currentCategory === 'all' || item.categorySlug === currentCategory;
      const matchQuery = !currentSearch || 
        item.title.toLowerCase().includes(currentSearch) ||
        item.tagline.toLowerCase().includes(currentSearch) ||
        item.techStack.some(t => t.toLowerCase().includes(currentSearch));
      return matchCat && matchQuery;
    });

    // Sorting
    if (currentSort === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (currentSort === 'downloads') {
      filtered.sort((a, b) => parseInt(b.downloads.replace(/,/g, '')) - parseInt(a.downloads.replace(/,/g, '')));
    } else if (currentSort === 'free') {
      filtered.sort((a, b) => (b.isFree ? 1 : 0) - (a.isFree ? 1 : 0));
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem;">No templates found</h3>
          <p style="color: var(--text-muted);">Try adjusting your search query or filter criteria.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(template => `
      <article class="template-card" id="card-${template.id}">
        <div class="card-thumbnail-box">
          <img src="${template.thumbnail}" alt="${template.title} preview" class="card-thumbnail" loading="lazy">
          <div class="card-badge-top">
            <span class="badge badge-${template.badgeColor}">${template.badge}</span>
          </div>
          <div class="card-price-top">
            ${template.price}
          </div>
          <div class="card-overlay-actions">
            <a href="/demos/${template.id}/index.html" class="btn btn-sm btn-demo">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Live Demo
            </a>
            <a href="/${template.id}/details" class="btn btn-sm btn-secondary">
              View Details
            </a>
          </div>
        </div>

        <div class="card-content">
          <div class="card-meta-row">
            <span class="card-category">${template.category}</span>
            <span class="card-rating">
              ★ ${template.rating} 
              <span style="color: var(--text-muted); font-size: 0.75rem;">(${template.reviewCount})</span>
            </span>
          </div>

          <h2 class="card-title">
            <a href="/${template.id}/details">${template.title}</a>
          </h2>

          <p class="card-description">${template.tagline}</p>

          <div class="card-tech-chips">
            ${template.techStack.slice(0, 3).map(tech => `<span class="tech-chip">${tech}</span>`).join('')}
            <span class="tech-chip">${template.version}</span>
          </div>

          <div class="card-actions">
            <a href="/${template.id}/details" class="btn btn-details" id="btn-details-${template.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Details
            </a>
            <a href="/demos/${template.id}/index.html" class="btn btn-demo" id="btn-demo-${template.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Demo
            </a>
          </div>
        </div>
      </article>
    `).join('');
  }

  // Filter Pills Event Listeners
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.getAttribute('data-category');
      render();
    });
  });

  // Search Input
  const searchInput = document.getElementById('templateSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      render();
    });
  }

  // Sort Selector
  const sortSelect = document.getElementById('templateSort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      render();
    });
  }

  // Initial render
  render();
}

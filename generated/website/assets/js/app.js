document.addEventListener("DOMContentLoaded",()=>{initTheme(),initCatalog()}),window.showToast=function(s,r="\u2728"){let i=document.querySelector(".toast-container");i||(i=document.createElement("div"),i.className="toast-container",document.body.appendChild(i));const a=document.createElement("div");a.className="toast",a.innerHTML=`<span>${r}</span> <span>${s}</span>`,i.appendChild(a),setTimeout(()=>{a.style.opacity="0",a.style.transform="translateY(10px)",a.style.transition="all 0.3s ease",setTimeout(()=>a.remove(),300)},3200)};function initTheme(){document.documentElement.setAttribute("data-theme","light");try{localStorage.removeItem("pixoptimo_theme")}catch{}}function updateThemeIcon(){}function initCatalog(){const s=document.getElementById("templatesGrid");if(!s||!window.TEMPLATES_DATA)return;let r="all",i="",a="featured";function o(){let t=window.TEMPLATES_DATA.filter(e=>{const n=r==="all"||e.categorySlug===r,h=!i||e.title.toLowerCase().includes(i)||e.tagline.toLowerCase().includes(i)||e.techStack.some(m=>m.toLowerCase().includes(i));return n&&h});if(a==="rating"?t.sort((e,n)=>n.rating-e.rating):a==="downloads"?t.sort((e,n)=>parseInt(n.downloads.replace(/,/g,""))-parseInt(e.downloads.replace(/,/g,""))):a==="free"&&t.sort((e,n)=>(n.isFree?1:0)-(e.isFree?1:0)),t.length===0){s.innerHTML=`
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">\u{1F50D}</div>
          <h3 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem;">No templates found</h3>
          <p style="color: var(--text-muted);">Try adjusting your search query or filter criteria.</p>
        </div>
      `;return}s.innerHTML=t.map(e=>`
      <article class="template-card" id="card-${e.id}">
        <div class="card-thumbnail-box">
          <img src="${e.thumbnail}" alt="${e.title} preview" class="card-thumbnail" loading="lazy">
          <div class="card-badge-top">
            <span class="badge badge-${e.badgeColor}">${e.badge}</span>
          </div>
          <div class="card-price-top">
            ${e.price}
          </div>
          <div class="card-overlay-actions">
            <a href="demo.html?id=${e.id}" class="btn btn-sm btn-demo">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Live Demo
            </a>
            <a href="templates/${e.id}/" class="btn btn-sm btn-secondary">
              View Details
            </a>
          </div>
        </div>

        <div class="card-content">
          <div class="card-meta-row">
            <span class="card-category">${e.category}</span>
            <span class="card-rating">
              \u2605 ${e.rating} 
              <span style="color: var(--text-muted); font-size: 0.75rem;">(${e.reviewCount})</span>
            </span>
          </div>

          <h2 class="card-title">
            <a href="templates/${e.id}/">${e.title}</a>
          </h2>

          <p class="card-description">${e.tagline}</p>

          <div class="card-tech-chips">
            ${e.techStack.slice(0,3).map(n=>`<span class="tech-chip">${n}</span>`).join("")}
            <span class="tech-chip">${e.version}</span>
          </div>

          <div class="card-actions">
            <a href="templates/${e.id}/" class="btn btn-details" id="btn-details-${e.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Details
            </a>
            <a href="demo.html?id=${e.id}" class="btn btn-demo" id="btn-demo-${e.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Demo
            </a>
          </div>
        </div>
      </article>
    `).join("")}const c=document.querySelectorAll(".filter-pill");c.forEach(t=>{t.addEventListener("click",()=>{c.forEach(e=>e.classList.remove("active")),t.classList.add("active"),r=t.getAttribute("data-category"),o()})});const d=document.getElementById("templateSearch");d&&d.addEventListener("input",t=>{i=t.target.value.toLowerCase().trim(),o()});const l=document.getElementById("templateSort");l&&l.addEventListener("change",t=>{a=t.target.value,o()}),o()}
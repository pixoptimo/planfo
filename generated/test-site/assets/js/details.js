document.addEventListener("DOMContentLoaded",()=>{initTheme(),initDetailsPage()});function initTheme(){document.documentElement.setAttribute("data-theme","light");try{localStorage.removeItem("pixoptimo_theme")}catch{}}function updateThemeIcon(){}function initDetailsPage(){let s=new URLSearchParams(window.location.search).get("id");if(!s){const t=window.location.pathname.match(/^\/([^\/]+)\/details/);t&&t[1]&&(s=t[1])}if(!s){const t=window.location.pathname.match(/\/(?:templates|products)\/([^\/]+)/);t&&t[1]&&(s=t[1])}s||(s=window.TEMPLATES_DATA&&window.TEMPLATES_DATA[0]?.id||"quantum-saas");const e=window.getTemplateById?window.getTemplateById(s):null;if(!e)return;document.title=`${e.title} \u2014 Details & Documentation | Pixoptimo`;const m=document.getElementById("crumbTemplateTitle");m&&(m.textContent=e.title);const p=document.getElementById("detailsTitle");p&&(p.textContent=e.title);const u=document.getElementById("detailsSubtitle");u&&(u.textContent=e.tagline);const l=document.getElementById("detailsBadge");l&&(l.className=`badge badge-${e.badgeColor}`,l.textContent=e.badge);const g=document.getElementById("detailsVersion");g&&(g.textContent=e.version);const f=document.getElementById("detailsUpdated");f&&(f.textContent=e.lastUpdated);const h=document.getElementById("detailsRating");h&&(h.textContent=`\u2605 ${e.rating} (${e.reviewCount} reviews)`);const y=document.getElementById("detailsDownloads");y&&(y.textContent=`${e.downloads} downloads`);const d=document.getElementById("featuredImage");d&&(d.src=e.featuredImage,d.alt=`${e.title} full showcase`);const v=document.getElementById("liveDemoBtn");v&&(v.href=`/demos/${e.id}/index.html`);const w=document.getElementById("downloadBtn");w&&w.addEventListener("click",()=>{fetch(e.downloadFile).then(t=>t.blob()).then(t=>{const n=document.createElement("a");n.href=URL.createObjectURL(t),n.download=`${e.id}.html`,n.click(),URL.revokeObjectURL(n.href),window.showToast?.(`Downloading ${e.id}.html package`,"\u{1F4E6}")}).catch(t=>{console.error(t),window.open(e.downloadFile,"_blank")})});const E=document.getElementById("priceVal");E&&(E.textContent=e.price);const b=document.querySelectorAll(".tab-btn"),R=document.querySelectorAll(".tab-panel");b.forEach(t=>{t.addEventListener("click",()=>{const n=t.getAttribute("data-tab");b.forEach(a=>a.classList.remove("active")),R.forEach(a=>a.classList.remove("active")),t.classList.add("active");const i=document.getElementById(`tab-${n}`);i&&i.classList.add("active")})});const c=document.getElementById("detailedDescription");c&&(e.overview?(c.textContent=e.overview,c.style.whiteSpace="pre-line"):e.contentHtml?c.innerHTML=e.contentHtml:c.textContent=e.description||"High-performance responsive template architecture.");const T=document.getElementById("featuresChecklist");if(T){const t=e.features&&e.features.length?e.features:["Responsive layout engineered for seamless cross-device adaptability","Zero-runtime overhead built strictly with vanilla semantic HTML and modern CSS","W3C standards compliant and WCAG accessible markup structure"];T.innerHTML=t.map(n=>`
      <div class="checklist-item">
        <div class="checklist-icon">\u2713</div>
        <div class="checklist-text">${n}</div>
      </div>
    `).join("")}const x=document.getElementById("fileTreeContainer");if(x){let t=function(i,a=0){return Array.isArray(i)?i.map(o=>{const P=o.type==="dir";let H=`
          <div class="tree-node" ${a>0?`style="padding-left: ${a*1.5}rem"`:""}>
            <span class="${P?"tree-icon-dir":"tree-icon-file"}">${P?"\u{1F4C1}":"\u{1F4C4}"}</span>
            <strong>${o.name}</strong>
            ${o.desc?`<span class="tree-desc">// ${o.desc}</span>`:""}
          </div>
        `;return o.children&&(H+=t(o.children,a+1)),H}).join(""):""};var z=t;const n=e.fileTree&&e.fileTree.length?e.fileTree:[{name:e.id+".html",type:"file",desc:"Main template markup"},{name:"assets/",type:"dir",children:[{name:"css/style.css",type:"file",desc:"Custom styles and layout tokens"},{name:"js/app.js",type:"file",desc:"Vanilla interactions"}]},{name:"README.md",type:"file",desc:"Documentation & setup guidelines"}];x.innerHTML=t(n)}const C=document.getElementById("quickStartSnippet");C&&(C.textContent=e.quickStartCode||`<!-- Plug and play -->
<link rel="stylesheet" href="assets/css/${e.id}.css">
<script src="assets/js/${e.id}.js" defer><\/script>`);const B=document.getElementById("cssTokensSnippet");B&&(B.textContent=e.cssTokens||`:root {
  --bg: #07090e;
  --accent: #6366f1;
}`);const $=document.getElementById("changelogContainer");if($){const t=e.changelog&&e.changelog.length?e.changelog:[{version:e.version||"v1.0.0",date:e.lastUpdated||"Recent",note:"Initial production launch and verified package release."}];$.innerHTML=t.map(n=>`
      <div style="border-left: 2px solid var(--primary); padding-left: 1.5rem; margin-bottom: 1.5rem; position: relative;">
        <div style="position: absolute; left: -7px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--primary);"></div>
        <div style="display: flex; gap: 10px; align-items: baseline; margin-bottom: 4px;">
          <strong style="font-size: 1.1rem; color: #fff;">${n.version}</strong>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${n.date}</span>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.92rem; margin: 0;">${n.note}</p>
      </div>
    `).join("")}const I=document.getElementById("specRelease");I&&(I.textContent=e.releaseDate);const S=document.getElementById("specLicense");S&&(S.textContent=e.license);const r=document.getElementById("specFramework");if(r){const t=e.techStack,n=Array.isArray(t)?t:typeof t=="string"?t.split(",").map(i=>i.trim()).filter(Boolean):[];n.length>0?r.innerHTML=n.map(i=>`<span class="tech-chip">${i}</span>`).join(" "):r.innerHTML='<span class="tech-chip">HTML5 Semantic</span> <span class="tech-chip">Vanilla CSS3</span>'}const L=document.getElementById("specBrowser");L&&(L.textContent=e.browserSupport||"All Modern Browsers (Chrome, Safari, Firefox, Edge)");const k=document.getElementById("specLighthouse");if(k&&e.lighthouseScore){const t=e.lighthouseScore;k.textContent=`${t.performance||100} / ${t.accessibility||100} / ${t.bestPractices||100} / ${t.seo||100}`}const A=document.getElementById("specSize");A&&(A.textContent=e.fileSize);const D=document.getElementById("specAuthor");D&&(D.textContent=e.author);const M=document.getElementById("relatedGrid");if(M&&window.TEMPLATES_DATA){const t=window.TEMPLATES_DATA.filter(n=>n.id!==e.id).slice(0,3);M.innerHTML=t.map(n=>`
      <article class="template-card">
        <div class="card-thumbnail-box">
          <img src="${n.thumbnail}" alt="${n.title}" class="card-thumbnail" loading="lazy">
          <div class="card-badge-top"><span class="badge badge-${n.badgeColor}">${n.badge}</span></div>
          <div class="card-price-top">${n.price}</div>
        </div>
        <div class="card-content">
          <div class="card-meta-row">
            <span class="card-category">${n.category}</span>
            <span class="card-rating">\u2605 ${n.rating}</span>
          </div>
          <h3 class="card-title" style="font-size: 1.1rem;"><a href="/${n.id}/details">${n.title}</a></h3>
          <p class="card-description">${n.tagline}</p>
          <div class="card-actions">
            <a href="/${n.id}/details" class="btn btn-details btn-sm">Details</a>
            <a href="/demos/${n.id}/index.html" class="btn btn-demo btn-sm">Demo</a>
          </div>
        </div>
      </article>
    `).join("")}document.querySelectorAll(".copy-code-btn").forEach(t=>{t.addEventListener("click",()=>{const n=t.getAttribute("data-target"),i=document.getElementById(n);i&&navigator.clipboard.writeText(i.textContent).then(()=>{const a=t.textContent;t.textContent="Copied!",setTimeout(()=>t.textContent=a,2e3),window.showToast?.("Code snippet copied to clipboard","\u{1F4CB}")})})})}
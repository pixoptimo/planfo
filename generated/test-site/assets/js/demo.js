document.addEventListener("DOMContentLoaded",()=>{initDemoViewer()});async function initDemoViewer(){const s=new URLSearchParams(window.location.search),r=s.get("url")||s.get("demo");let o=s.get("id");if(!o){const e=window.location.pathname.match(/\/demos\/([^\/]+)/);e&&e[1]&&(o=e[1])}!o&&!r&&(o=window.TEMPLATES_DATA&&window.TEMPLATES_DATA[0]?.id||"quantum-saas");const l=document.getElementById("demoIframe"),u=document.getElementById("deviceWrapper"),f=document.getElementById("dimensionBadge"),a=document.getElementById("downloadCurrentBtn"),h=document.getElementById("detailsLink");let d=null;if(r)d={id:o||"custom-demo",title:s.get("title")||"Interactive Demo Preview",demoUrl:r,downloadFile:r};else{let e=null;try{const t=await fetch(`/api/demos/info/${encodeURIComponent(o)}`);if(t.ok){const i=await t.json();i?.data&&(e=i.data)}}catch{}const n=window.getTemplateById?window.getTemplateById(o):null;e?d={id:o,title:e.title||n?.title||o.replace(/-/g," ").replace(/\b\w/g,t=>t.toUpperCase()),demoUrl:e.demoUrl!==void 0?e.demoUrl:n?.demoUrl||"",downloadFile:e.downloadFile||n?.downloadFile||""}:n?d=n:d={id:o,title:o.replace(/-/g," ").replace(/\b\w/g,t=>t.toUpperCase()),demoUrl:`/demos/${o}/index.html`,downloadFile:`/demos/${o}/bundle.zip`}}h&&d&&(h.href=`templates/${encodeURIComponent(d.id)}/`);let y="desktop";function v(e){if(!e||!l)return;d=e;const n=(e.demoUrl||"").trim();if(!n){l.removeAttribute("src"),l.srcdoc=`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              font-family: system-ui, -apple-system, sans-serif;
              background: #f8fafc;
              color: #475569;
              text-align: center;
              padding: 2rem;
              box-sizing: border-box;
            }
            .box {
              max-width: 440px;
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 1rem;
              padding: 2.5rem 2rem;
              box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);
            }
            h2 {
              color: #0f172a;
              font-size: 1.35rem;
              margin: 0 0 0.75rem;
              font-weight: 700;
            }
            p {
              font-size: 0.9rem;
              line-height: 1.6;
              margin: 0;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>No Demo Available</h2>
            <p>This template currently does not have a live URL or demo bundle attached in the admin panel.</p>
          </div>
        </body>
        </html>
      `,a&&(a.style.display="none"),c();return}l.removeAttribute("srcdoc");let t=n;if((t.startsWith("demos/")||t.startsWith("/demos/"))&&(t.startsWith("/")||(t="/"+t),t=t.includes("?")?`${t}&raw=true`:`${t}?raw=true`),l.src=t,a){const i=e.downloadFile||(n.endsWith(".zip")?n:"");i?(a.style.display="inline-flex",a.onclick=()=>{const B=i.endsWith(".zip")?`${e.id}.zip`:`${e.id}.html`;U(i,B)}):a.style.display="none"}c()}d&&v(d);const p=document.querySelectorAll(".device-btn");p.forEach(e=>{e.addEventListener("click",()=>{document.body.classList.contains("normal-ui-active")&&m(),p.forEach(t=>t.classList.remove("active")),e.classList.add("active");const n=e.getAttribute("data-mode");b(n)})});function b(e){y=e,u.className=`device-wrapper mode-${e}`,c()}const w=document.getElementById("expandBtn")||document.getElementById("fullscreenBtn"),g=document.getElementById("floatingCloseBtn")||document.getElementById("exitFullscreenBtn");function L(){document.body.classList.add("normal-ui-active"),document.body.classList.add("fullscreen-active")}function m(){document.body.classList.remove("normal-ui-active"),document.body.classList.remove("fullscreen-active"),c()}function E(){document.body.classList.contains("normal-ui-active")?m():L()}w&&w.addEventListener("click",E),g&&g.addEventListener("click",m),document.addEventListener("keydown",e=>{e.key==="Escape"&&m()});function c(){!f||!u||setTimeout(()=>{if(document.body.classList.contains("normal-ui-active")){f.textContent="100% Normal View";return}const e=u.getBoundingClientRect();f.textContent=`${Math.round(e.width)} \xD7 ${Math.round(e.height)} px`},350)}window.addEventListener("resize",c);function U(e,n){fetch(e).then(t=>t.blob()).then(t=>{const i=document.createElement("a");i.href=URL.createObjectURL(t),i.download=n,i.click(),URL.revokeObjectURL(i.href),window.showToast?.(`Downloaded ${n}`,"\u{1F4E5}")}).catch(t=>{console.error(t),window.open(e,"_blank")})}}
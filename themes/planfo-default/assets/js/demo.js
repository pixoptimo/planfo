/**
 * Pixoptimo UI Templates - Interactive Demo Controller
 * Live Device Frame Simulation Runner
 */

document.addEventListener('DOMContentLoaded', () => {
  initDemoViewer();
});

async function initDemoViewer() {
  const urlParams = new URLSearchParams(window.location.search);
  const directDemoUrl = urlParams.get('url') || urlParams.get('demo');
  
  // Extract templateId from URL query (?id=...) or from pathname (/demos/:slug/...)
  let templateId = urlParams.get('id');
  if (!templateId) {
    const pathMatch = window.location.pathname.match(/\/demos\/([^\/]+)/);
    if (pathMatch && pathMatch[1]) {
      templateId = pathMatch[1];
    }
  }
  if (!templateId && !directDemoUrl) {
    templateId = (window.TEMPLATES_DATA && window.TEMPLATES_DATA[0]?.id) || 'quantum-saas';
  }

  const iframe = document.getElementById('demoIframe');
  const deviceWrapper = document.getElementById('deviceWrapper');
  const dimensionBadge = document.getElementById('dimensionBadge');
  const downloadBtn = document.getElementById('downloadCurrentBtn');
  const detailsLink = document.getElementById('detailsLink');

  let currentTemplate = null;

  if (directDemoUrl) {
    currentTemplate = {
      id: templateId || 'custom-demo',
      title: urlParams.get('title') || 'Interactive Demo Preview',
      demoUrl: directDemoUrl,
      downloadFile: directDemoUrl
    };
  } else {
    // 1. Try to fetch live fresh template data from API so admin updates are immediately reflected
    let liveData = null;
    try {
      const res = await fetch(`/api/demos/info/${encodeURIComponent(templateId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          liveData = json.data;
        }
      }
    } catch {}

    const localData = window.getTemplateById ? window.getTemplateById(templateId) : null;

    if (liveData) {
      currentTemplate = {
        id: templateId,
        title: liveData.title || localData?.title || templateId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        demoUrl: liveData.demoUrl !== undefined ? liveData.demoUrl : (localData?.demoUrl || ''),
        downloadFile: liveData.downloadFile || localData?.downloadFile || ''
      };
    } else if (localData) {
      currentTemplate = localData;
    } else {
      currentTemplate = {
        id: templateId,
        title: templateId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        demoUrl: `/demos/${templateId}/index.html`,
        downloadFile: `/demos/${templateId}/bundle.zip`
      };
    }
  }

  // Set Details link pointing to templates/:slug/
  if (detailsLink && currentTemplate) {
    detailsLink.href = `templates/${encodeURIComponent(currentTemplate.id)}/`;
  }

  let currentMode = 'desktop';

  // Load Initial Template
  function loadTemplate(template) {
    if (!template || !iframe) return;
    currentTemplate = template;
    const target = (template.demoUrl || '').trim();

    if (!target) {
      // User removed the demo URL or no demo is attached
      iframe.removeAttribute('src');
      iframe.srcdoc = `
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
      `;
      if (downloadBtn) downloadBtn.style.display = 'none';
      updateDimensions();
      return;
    }

    iframe.removeAttribute('srcdoc');
    let resolvedUrl = target;
    if (resolvedUrl.startsWith('demos/') || resolvedUrl.startsWith('/demos/')) {
      if (!resolvedUrl.startsWith('/')) resolvedUrl = '/' + resolvedUrl;
      resolvedUrl = resolvedUrl.includes('?') ? `${resolvedUrl}&raw=true` : `${resolvedUrl}?raw=true`;
    }

    iframe.src = resolvedUrl;

    if (downloadBtn) {
      const downloadUrl = template.downloadFile || (target.endsWith('.zip') ? target : '');
      if (downloadUrl) {
        downloadBtn.style.display = 'inline-flex';
        downloadBtn.onclick = () => {
          const filename = downloadUrl.endsWith('.zip') ? `${template.id}.zip` : `${template.id}.html`;
          downloadFile(downloadUrl, filename);
        };
      } else {
        downloadBtn.style.display = 'none';
      }
    }
    updateDimensions();
  }

  if (currentTemplate) {
    loadTemplate(currentTemplate);
  }

  // Device Mode Switcher Buttons
  const deviceBtns = document.querySelectorAll('.device-btn');
  deviceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Exit normal view when switching device viewport
      if (document.body.classList.contains('normal-ui-active')) {
        exitNormalUI();
      }
      deviceBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const mode = btn.getAttribute('data-mode');
      setDeviceMode(mode);
    });
  });

  function setDeviceMode(mode) {
    currentMode = mode;
    deviceWrapper.className = `device-wrapper mode-${mode}`;
    updateDimensions();
  }

  // Expand to Normal UI / Return to Simulator UI logic
  const expandBtn = document.getElementById('expandBtn') || document.getElementById('fullscreenBtn');
  const floatingCloseBtn = document.getElementById('floatingCloseBtn') || document.getElementById('exitFullscreenBtn');

  function enterNormalUI() {
    document.body.classList.add('normal-ui-active');
    document.body.classList.add('fullscreen-active');
  }

  function exitNormalUI() {
    document.body.classList.remove('normal-ui-active');
    document.body.classList.remove('fullscreen-active');
    updateDimensions();
  }

  function toggleNormalUI() {
    if (document.body.classList.contains('normal-ui-active')) {
      exitNormalUI();
    } else {
      enterNormalUI();
    }
  }

  if (expandBtn) {
    expandBtn.addEventListener('click', toggleNormalUI);
  }

  if (floatingCloseBtn) {
    floatingCloseBtn.addEventListener('click', exitNormalUI);
  }

  // Keyboard Shortcut: Esc to Exit Normal UI and return to simulator
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      exitNormalUI();
    }
  });

  function updateDimensions() {
    if (!dimensionBadge || !deviceWrapper) return;
    setTimeout(() => {
      if (document.body.classList.contains('normal-ui-active')) {
        dimensionBadge.textContent = '100% Normal View';
        return;
      }
      const rect = deviceWrapper.getBoundingClientRect();
      dimensionBadge.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)} px`;
    }, 350);
  }

  window.addEventListener('resize', updateDimensions);

  function downloadFile(url, filename) {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
        window.showToast?.(`Downloaded ${filename}`, '📥');
      })
      .catch(err => {
        console.error(err);
        window.open(url, '_blank');
      });
  }
}

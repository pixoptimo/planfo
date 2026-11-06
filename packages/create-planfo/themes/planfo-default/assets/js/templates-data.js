/**
 * Pixoptimo UI Templates - Central Template Database
 * Author: Antigravity UI/UX Architecture
 */
if (!window.TEMPLATES_DATA || !window.TEMPLATES_DATA.length) {
  window.TEMPLATES_DATA = [
  {
    id: "quantum-saas",
    title: "Quantum — AI Telemetry & Workflow SaaS",
    category: "SaaS & Dashboard",
    categorySlug: "saas",
    badge: "Trending",
    badgeColor: "purple",
    tagline: "Ultra-lean autonomous telemetry cockpit with glowing glassmorphism and real-time SVG charts.",
    description: "Quantum is an avant-garde SaaS landing page and telemetry cockpit built for high-frequency cloud architectures and AI platforms. Designed with meticulous attention to visual depth, deep blacks (#07090E), vibrant indigo luminescence, and responsive metrics grids. Optimized for instantaneous rendering with 0kb external framework overhead.",
    thumbnail: "assets/images/quantum-saas.jpg",
    featuredImage: "assets/images/quantum-saas.jpg",
    demoUrl: "sample-templates/quantum-saas.html",
    downloadFile: "sample-templates/quantum-saas.html",
    version: "v2.5.0",
    releaseDate: "Sept 28, 2026",
    lastUpdated: "Oct 08, 2026",
    license: "MIT Commercial & Personal",
    price: "Free",
    isFree: true,
    rating: 4.98,
    reviewCount: 342,
    downloads: "14,290",
    author: "Pixoptimo Labs",
    techStack: ["HTML5 Semantic", "Vanilla CSS3", "Custom Properties", "Zero Dependencies", "SVG Visualizations"],
    fileSize: "14.2 KB (Gzipped)",
    lighthouseScore: { performance: 100, accessibility: 100, bestPractices: 100, seo: 100 },
    features: [
      "Sub-20ms Time-to-Interactive (TTI) on mobile networks",
      "Dynamic responsive CSS Grid metrics cockpit with live SVG telemetry waves",
      "Curated HSL color palette with ambient background glow effects",
      "Fully accessible WCAG 2.1 AAA color contrast compliance",
      "Container queries and fluid CSS clamp() responsive typography",
      "Clean semantic markup with SEO Schema.org meta readiness",
      "Lightweight standalone bundle with zero build steps required"
    ],
    fileTree: [
      { name: "quantum-saas.html", type: "file", desc: "Core single-page semantic HTML template" },
      { name: "assets/", type: "dir", children: [
        { name: "css/styles.css", type: "file", desc: "Vanilla design system & token definitions" },
        { name: "js/telemetry.js", type: "file", desc: "Live chart and micro-interaction controller" },
        { name: "fonts/", type: "dir", desc: "Self-hosted Plus Jakarta Sans font files" }
      ]},
      { name: "README.md", type: "file", desc: "Architecture, customization guide, and deployment manual" }
    ],
    quickStartCode: `<!-- 1. Include Google Fonts or self-host -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">

<!-- 2. Link styles and open directly in browser or any HTTP server -->
<link rel="stylesheet" href="assets/css/styles.css">
<!-- No npm, no node_modules, no webpack needed! -->`,
    cssTokens: `:root {
  --bg: #07090e;
  --surface: #0e121b;
  --surface-border: rgba(255, 255, 255, 0.08);
  --primary: #6366f1;
  --primary-glow: rgba(99, 102, 241, 0.35);
  --accent: #06b6d4;
  --text: #f8fafc;
  --text-muted: #94a3b8;
  --font: 'Plus Jakarta Sans', sans-serif;
}`,
    changelog: [
      { version: "v2.5.0", date: "Oct 08, 2026", note: "Upgraded SVG wave telemetry charts and added container query adaptations." },
      { version: "v2.4.0", date: "Sep 15, 2026", note: "Added dark/light auto detection and optimized critical CSS paint." },
      { version: "v1.0.0", date: "Jul 10, 2026", note: "Initial production release." }
    ]
  },
  {
    id: "nexus-fintech",
    title: "Nexus — Decentralized Wealth OS & Trading Terminal",
    category: "Fintech & Web3",
    categorySlug: "fintech",
    badge: "Popular",
    badgeColor: "green",
    tagline: "High-density multi-pane financial terminal with live DEX swap calculations, SVG candles, and crypto tickers.",
    description: "Nexus delivers an institutional-grade financial dashboard and decentralized exchange interface. Engineered with high information density, neon emerald data signals, instant arithmetic swap calculators, and responsive column rebalancing for ultra-wide displays and mobile handsets alike.",
    thumbnail: "assets/images/nexus-fintech.jpg",
    featuredImage: "assets/images/nexus-fintech.jpg",
    demoUrl: "sample-templates/nexus-fintech.html",
    downloadFile: "sample-templates/nexus-fintech.html",
    version: "v3.1.2",
    releaseDate: "Aug 14, 2026",
    lastUpdated: "Oct 04, 2026",
    license: "Commercial License",
    price: "$49 PRO",
    isFree: false,
    rating: 4.96,
    reviewCount: 289,
    downloads: "9,640",
    author: "Pixoptimo Labs",
    techStack: ["HTML5", "Vanilla CSS3", "Vanilla ES6", "SVG Charts", "Accessible Tables"],
    fileSize: "18.6 KB (Gzipped)",
    lighthouseScore: { performance: 99, accessibility: 100, bestPractices: 100, seo: 100 },
    features: [
      "Institutional 3-column financial workstation layout",
      "Interactive JavaScript token swap calculator with live exchange rate emulation",
      "Custom vector SVG crypto candlestick and smooth equity area charts",
      "Dynamic horizontal ticker marquee with real-time price delta badges",
      "Modal wallet connector interface with simulated Web3 connection state",
      "Optimized for high-density OLED monitors with true pitch-black contrast"
    ],
    fileTree: [
      { name: "nexus-fintech.html", type: "file", desc: "Complete responsive terminal markup" },
      { name: "assets/", type: "dir", children: [
        { name: "css/terminal.css", type: "file", desc: "Data grid layout & ticker styles" },
        { name: "js/dex-calc.js", type: "file", desc: "Token price calculator & mock stream" }
      ]},
      { name: "README.md", type: "file", desc: "Setup guide & financial charting integration notes" }
    ],
    quickStartCode: `<!-- Pure Vanilla HTML & JS - Drop into any web server -->
<script src="assets/js/dex-calc.js" defer></script>
<link rel="stylesheet" href="assets/css/terminal.css">`,
    cssTokens: `:root {
  --bg: #090d16;
  --card-bg: #111726;
  --border: rgba(16, 185, 129, 0.2);
  --accent-green: #10b981;
  --accent-green-glow: rgba(16, 185, 129, 0.35);
  --text: #f1f5f9;
  --font-heading: 'Space Grotesk', sans-serif;
}`,
    changelog: [
      { version: "v3.1.2", date: "Oct 04, 2026", note: "Polished swap calculation rounding and added keyboard hotkeys." },
      { version: "v3.0.0", date: "Aug 14, 2026", note: "Major refactor with Space Grotesk typography and SVG candles." }
    ]
  },
  {
    id: "avant-agency",
    title: "Avant — Kinetic Studio & Digital Architecture",
    category: "Agency & Portfolio",
    categorySlug: "agency",
    badge: "Award Winner",
    badgeColor: "pink",
    tagline: "Bold typographic digital flagship with kinetic hover cards, holographic gradients, and fluid layout.",
    description: "Avant is an award-winning creative studio portfolio engineered for agencies, architects, and high-fashion digital creators. Featuring dramatic Syne display typography, iridescent holographic ambient reflections, micro-interactions, and a minimalist showcase grid that puts project art front and center.",
    thumbnail: "assets/images/avant-agency.jpg",
    featuredImage: "assets/images/avant-agency.jpg",
    demoUrl: "sample-templates/avant-agency.html",
    downloadFile: "sample-templates/avant-agency.html",
    version: "v1.8.0",
    releaseDate: "Jul 22, 2026",
    lastUpdated: "Sep 29, 2026",
    license: "MIT Commercial & Personal",
    price: "Free",
    isFree: true,
    rating: 4.99,
    reviewCount: 412,
    downloads: "18,900",
    author: "Pixoptimo Labs",
    techStack: ["HTML5", "Modern CSS", "CSS Custom Properties", "Fluid Typography", "Hardware-Accelerated Transitions"],
    fileSize: "12.8 KB (Gzipped)",
    lighthouseScore: { performance: 100, accessibility: 100, bestPractices: 100, seo: 100 },
    features: [
      "Avant-garde Syne typography with fluid clamp() scaling from 48px to 110px",
      "Dynamic holographic CSS gradient reflections on card hover",
      "Refined micro-stagger animations for project cards",
      "Zero JavaScript dependency footprint — 100% pure CSS motion",
      "Full dark mode aesthetic with obsidian ink backgrounds",
      "Mobile-first responsive drawer menu and smooth scroll anchors"
    ],
    fileTree: [
      { name: "avant-agency.html", type: "file", desc: "Studio agency homepage template" },
      { name: "assets/", type: "dir", children: [
        { name: "css/avant.css", type: "file", desc: "Typographic scale & kinetic animations" }
      ]},
      { name: "README.md", type: "file", desc: "Project setup & branding replacement guide" }
    ],
    quickStartCode: `<!-- Plug and play into GitHub Pages, Cloudflare Pages, or Netlify -->
git clone https://github.com/pixoptimo/avant-studio.git
open avant-agency.html`,
    cssTokens: `:root {
  --bg: #050507;
  --card-bg: rgba(255, 255, 255, 0.03);
  --card-border: rgba(255, 255, 255, 0.12);
  --font-display: 'Syne', sans-serif;
  --font-body: 'Space Grotesk', sans-serif;
  --accent-gradient: linear-gradient(135deg, #ff007f 0%, #7928ca 50%, #00dfd8 100%);
}`,
    changelog: [
      { version: "v1.8.0", date: "Sep 29, 2026", note: "Enhanced smooth cubic-bezier transitions for card elevation." },
      { version: "v1.0.0", date: "Jul 22, 2026", note: "Initial release." }
    ]
  },
  {
    id: "aurelie-luxury",
    title: "Aurélie — Haute Couture & Editorial Maison",
    category: "Luxury E-Commerce",
    categorySlug: "ecommerce",
    badge: "Editor's Choice",
    badgeColor: "gold",
    tagline: "Serene editorial luxury storefront with warm champagne gold accents, Cormorant serif typography, and cart preview.",
    description: "Aurélie brings the refined elegance of European high-fashion maisons into a modern web storefront. Built with warm obsidian tones (#12100E), subtle burnished gold borders, Cormorant Garamond editorial headers, and interactive bag interactions.",
    thumbnail: "assets/images/aurelie-luxury.jpg",
    featuredImage: "assets/images/aurelie-luxury.jpg",
    demoUrl: "sample-templates/aurelie-luxury.html",
    downloadFile: "sample-templates/aurelie-luxury.html",
    version: "v2.0.1",
    releaseDate: "Jun 18, 2026",
    lastUpdated: "Sep 19, 2026",
    license: "Commercial License",
    price: "$59 PRO",
    isFree: false,
    rating: 4.97,
    reviewCount: 195,
    downloads: "7,450",
    author: "Pixoptimo Labs",
    techStack: ["HTML5", "Vanilla CSS3", "Micro-Interactions", "Responsive Lookbook", "Accessible Forms"],
    fileSize: "15.4 KB (Gzipped)",
    lighthouseScore: { performance: 100, accessibility: 100, bestPractices: 100, seo: 100 },
    features: [
      "Editorial magazine layout with high-fashion typography hierarchy",
      "Harmonious warm charcoal & champagne gold color space",
      "Interactive shopping bag counter and checkout intent drawer",
      "Semantic microdata markup for luxury product catalogs",
      "Responsive lookbook grid with graceful aspect-ratio locking",
      "Pure CSS hover zoom and subtle border elevation"
    ],
    fileTree: [
      { name: "aurelie-luxury.html", type: "file", desc: "Main editorial lookbook and catalog" },
      { name: "assets/", type: "dir", children: [
        { name: "css/maison.css", type: "file", desc: "Luxury styling and serif typography rules" }
      ]},
      { name: "README.md", type: "file", desc: "E-commerce integration & Shopify/WooCommerce theme adaptation notes" }
    ],
    quickStartCode: `<!-- Link editorial styling and fonts -->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=Montserrat:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/maison.css">`,
    cssTokens: `:root {
  --bg: #12100e;
  --card-bg: #1a1714;
  --border: rgba(212, 175, 55, 0.2);
  --gold: #d4af37;
  --gold-light: #f3e5ab;
  --text: #f7f4ed;
  --font-serif: 'Cormorant Garamond', Georgia, serif;
}`,
    changelog: [
      { version: "v2.0.1", date: "Sep 19, 2026", note: "Fixed mobile touch response for cart triggers." },
      { version: "v2.0.0", date: "Jun 18, 2026", note: "Initial commercial edition." }
    ]
  }
];
}

// Helper methods
window.getTemplateById = function(id) {
  const data = window.TEMPLATES_DATA || [];
  if (!data.length) return null;
  if (!id) return data[0];
  return data.find(t => t.id === id) || data[0];
};

import type { ContentBlock } from '@cms/schemas';

export interface TemplatePreset {
  name: string;
  description: string;
  blocks: ContentBlock[];
}

export const TEMPLATE_PRESETS: Record<string, TemplatePreset> = {
  about: {
    name: 'About Page',
    description: 'Header, mission paragraph, 4-column metrics/pillars grid, and core principles grid',
    blocks: [
      {
        id: 'about_h1',
        type: 'heading',
        level: 2,
        text: 'Empowering Creators with Blazing Static Architecture'
      },
      {
        id: 'about_p1',
        type: 'paragraph',
        text: 'We are an ambitious team dedicated to engineering high-performance digital infrastructure, scalable static architectures, and timeless web design. Our platform is built from the ground up for speed, security, and developer velocity.'
      },
      {
        id: 'about_grid_metrics',
        type: 'grid',
        columns: 4,
        items: [
          {
            id: 'm1',
            icon: '⚡',
            badge: 'Speed',
            title: '100% Static',
            text: 'Zero database bottlenecks, sub-second TTFB, and instant pre-rendered pages.',
            buttonText: 'Architecture',
            buttonUrl: '#tech'
          },
          {
            id: 'm2',
            icon: '🛡️',
            badge: 'Security',
            title: 'Zero-Trust Safety',
            text: 'Immutable flat-file builds protected against SQL injections and runtime exploits.',
            buttonText: 'Security',
            buttonUrl: '#security'
          },
          {
            id: 'm3',
            icon: '🌐',
            badge: 'Global',
            title: 'Edge CDN Ready',
            text: 'Pre-rendered HTML distributed instantly across worldwide edge point-of-presence nodes.',
            buttonText: 'Network',
            buttonUrl: '#network'
          },
          {
            id: 'm4',
            icon: '💡',
            badge: 'Velocity',
            title: 'Developer Focused',
            text: 'Clean TypeScript core, robust blueprints, and intuitive visual editing workflows.',
            buttonText: 'Workflow',
            buttonUrl: '#workflow'
          }
        ]
      },
      {
        id: 'about_h2',
        type: 'heading',
        level: 3,
        text: 'Our Core Design & Engineering Principles'
      },
      {
        id: 'about_grid_principles',
        type: 'grid',
        columns: 3,
        items: [
          {
            id: 'p1',
            icon: '🎯',
            badge: 'Quality',
            title: 'Semantic Excellence',
            text: 'Every element is crafted with semantic HTML5, accessible contrast standards, and responsive CSS.',
            buttonText: '',
            buttonUrl: ''
          },
          {
            id: 'p2',
            icon: '🌱',
            badge: 'Efficiency',
            title: 'Minimal Footprint',
            text: 'Ultra-lean asset delivery without unnecessary client-side runtime overhead.',
            buttonText: '',
            buttonUrl: ''
          },
          {
            id: 'p3',
            icon: '🤝',
            badge: 'Modularity',
            title: 'Flexible Grids',
            text: 'Visual multi-column grids allow fluid, customizable layouts without touching backend code.',
            buttonText: '',
            buttonUrl: ''
          }
        ]
      },
      {
        id: 'about_callout',
        type: 'callout',
        variant: 'info',
        title: 'Join Our Community',
        text: 'Have ideas, feedback, or want to contribute custom themes? Connect with our developer network anytime.'
      }
    ]
  },

  contact: {
    name: 'Contact Page',
    description: 'Direct support channels grid, FAQ grid, and official inquiry details',
    blocks: [
      {
        id: 'contact_h1',
        type: 'heading',
        level: 2,
        text: 'Get In Touch With Our Team'
      },
      {
        id: 'contact_p1',
        type: 'paragraph',
        text: 'Have questions regarding templates, custom integration, or architecture? Reach out to our specialized teams directly below.'
      },
      {
        id: 'contact_channels_grid',
        type: 'grid',
        columns: 3,
        items: [
          {
            id: 'c1',
            icon: '💬',
            badge: 'Direct',
            title: 'Sales & Inquiries',
            text: 'Inquire about bespoke templates, enterprise licensing, or volume migrations.',
            buttonText: 'Email Sales',
            buttonUrl: 'mailto:sales@example.com'
          },
          {
            id: 'c2',
            icon: '🛠️',
            badge: 'Engineering',
            title: 'Technical Support',
            text: 'Get guidance on blueprint configurations, theme compilation, and static deployments.',
            buttonText: 'Contact Support',
            buttonUrl: 'mailto:support@example.com'
          },
          {
            id: 'c3',
            icon: '💼',
            badge: 'Partnership',
            title: 'Partners & Agencies',
            text: 'Collaborate on official theme releases, media inquiries, or agency affiliations.',
            buttonText: 'Partner With Us',
            buttonUrl: 'mailto:partners@example.com'
          }
        ]
      },
      {
        id: 'contact_faq_h',
        type: 'heading',
        level: 3,
        text: 'Frequently Asked Questions'
      },
      {
        id: 'contact_faq_grid',
        type: 'grid',
        columns: 2,
        items: [
          {
            id: 'faq1',
            icon: '⏱️',
            badge: 'SLA',
            title: 'What is your response time?',
            text: 'Our engineering and support team responds to all verified inquiries within 24 business hours.',
            buttonText: '',
            buttonUrl: ''
          },
          {
            id: 'faq2',
            icon: '🎨',
            badge: 'Customization',
            title: 'Can templates be tailored to our brand?',
            text: 'Yes! Every template uses CSS variables, modular grid cards, and clean templates that adapt effortlessly.',
            buttonText: '',
            buttonUrl: ''
          }
        ]
      },
      {
        id: 'contact_callout',
        type: 'callout',
        variant: 'success',
        title: 'Global Office Hours',
        text: 'Our distributed operations team operates Monday through Friday, 09:00 - 18:00 UTC.'
      }
    ]
  },

  landing: {
    name: 'Landing Page',
    description: 'Hero presentation, 3-column feature highlights grid, and call to action',
    blocks: [
      {
        id: 'landing_h1',
        type: 'heading',
        level: 1,
        text: 'Next-Generation Static Content Platform'
      },
      {
        id: 'landing_p1',
        type: 'paragraph',
        text: 'Build, curate, and distribute blazingly fast websites with zero database dependencies, unmatched visual polish, and automated deployment pipelines.'
      },
      {
        id: 'landing_features_grid',
        type: 'grid',
        columns: 3,
        items: [
          {
            id: 'lf1',
            icon: '⚡',
            badge: 'Ultra Fast',
            title: 'Sub-Second Loads',
            text: 'Pre-rendered static HTML serves in milliseconds with zero server computation lag.',
            buttonText: 'Explore Speed',
            buttonUrl: '#features'
          },
          {
            id: 'lf2',
            icon: '🎨',
            badge: 'Dynamic Grids',
            title: 'Visual Grid System',
            text: 'Organize cards, metrics, and multi-column showcases right in the rich visual editor.',
            buttonText: 'See Capabilities',
            buttonUrl: '#editor'
          },
          {
            id: 'lf3',
            icon: '🔒',
            badge: 'Hardened',
            title: 'Bank-Grade Safety',
            text: 'No runtime database, no server vulnerabilities, and completely tamper-proof flat files.',
            buttonText: 'Learn Security',
            buttonUrl: '#security'
          }
        ]
      },
      {
        id: 'landing_btn',
        type: 'button',
        text: 'Get Started Now',
        url: '#get-started',
        variant: 'primary',
        target: '_self'
      }
    ]
  },

  privacy: {
    name: 'Privacy Policy',
    description: 'Compliance overview, data protection grid cards, and policy details',
    blocks: [
      {
        id: 'privacy_h1',
        type: 'heading',
        level: 2,
        text: 'Privacy Policy & Data Protection'
      },
      {
        id: 'privacy_p1',
        type: 'paragraph',
        text: 'Your privacy is paramount. This policy outlines how we handle data, ensure security, and protect your digital assets.'
      },
      {
        id: 'privacy_grid',
        type: 'grid',
        columns: 3,
        items: [
          {
            id: 'priv1',
            icon: '🔒',
            badge: 'Ownership',
            title: '100% Data Ownership',
            text: 'You retain complete ownership over all your content, images, and exported static files.',
            buttonText: '',
            buttonUrl: ''
          },
          {
            id: 'priv2',
            icon: '👁️',
            badge: 'Zero Tracking',
            title: 'No Creepy Trackers',
            text: 'We do not sell personal information or monitor your visitors across third-party networks.',
            buttonText: '',
            buttonUrl: ''
          },
          {
            id: 'priv3',
            icon: '📜',
            badge: 'Compliance',
            title: 'GDPR & Privacy Ready',
            text: 'Engineered from the ground up to respect global data sovereignty and privacy rights.',
            buttonText: '',
            buttonUrl: ''
          }
        ]
      }
    ]
  },

  default: {
    name: 'Standard Page',
    description: 'Header, introduction paragraph, and 3-column highlights grid',
    blocks: [
      {
        id: 'def_h1',
        type: 'heading',
        level: 2,
        text: 'Page Title'
      },
      {
        id: 'def_p1',
        type: 'paragraph',
        text: 'Welcome to this page. You can customize this layout effortlessly with headings, paragraphs, and multi-column grid cards.'
      },
      {
        id: 'def_grid',
        type: 'grid',
        columns: 3,
        items: [
          {
            id: 'dg1',
            icon: '✨',
            badge: 'Highlight',
            title: 'Core Feature',
            text: 'Explain your first key product or content highlight in this multi-column card.',
            buttonText: 'Learn More',
            buttonUrl: '#'
          },
          {
            id: 'dg2',
            icon: '🚀',
            badge: 'Benefit',
            title: 'Second Feature',
            text: 'Highlight another key capability, benefit, or value proposition here.',
            buttonText: 'Learn More',
            buttonUrl: '#'
          },
          {
            id: 'dg3',
            icon: '🎯',
            badge: 'Value',
            title: 'Third Feature',
            text: 'Provide key insights or next steps for your readers and customers.',
            buttonText: 'Learn More',
            buttonUrl: '#'
          }
        ]
      }
    ]
  }
};

/**
 * Helper to get a preset for a template key.
 * Tries direct match, lowercase without extension, or falls back to default.
 */
export function getTemplatePreset(templateName: string): TemplatePreset | null {
  if (!templateName) return null;
  const clean = templateName.toLowerCase().replace(/\.html$/, '').trim();
  return TEMPLATE_PRESETS[clean] || null;
}

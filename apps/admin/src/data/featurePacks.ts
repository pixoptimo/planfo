export interface FeaturePackField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'image' | 'select' | 'url' | 'email' | 'content';
  required: boolean;
  options: string[];
  placeholder: string;
  description: string;
}

export interface FeaturePackDefinition {
  id: string;
  name: string;
  category: 'Commerce' | 'Marketing' | 'Corporate' | 'Social Proof' | 'Events' | 'Support';
  badge: string;
  description: string;
  icon: string;
  suggestedSlug: string;
  capabilities: string[];
  fields: FeaturePackField[];
}

export const FEATURE_PACKS: FeaturePackDefinition[] = [
  {
    id: 'catalog',
    name: 'Storefront Catalog Pack',
    category: 'Commerce',
    badge: 'Storefront',
    description: 'Complete product catalog with multiple currencies, SKU tracking, multi-image galleries, and order inquiry actions.',
    icon: 'Package',
    suggestedSlug: 'products',
    capabilities: [
      'Multi-currency pricing',
      'SKU & inventory reference',
      'Product category taxonomies',
      'Multi-photo product gallery',
      'Order inquiry call-to-actions'
    ],
    fields: [
      { id: 'fld_price', name: 'price', label: 'Price', type: 'number', required: true, options: [], placeholder: '49.99', description: 'Product price' },
      { id: 'fld_currency', name: 'currency', label: 'Currency', type: 'select', required: true, options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'AED'], placeholder: 'USD', description: 'Billing currency' },
      { id: 'fld_sku', name: 'sku', label: 'SKU / Inventory Code', type: 'text', required: false, options: [], placeholder: 'PROD-001', description: 'Stock keeping unit' },
      { id: 'fld_gallery', name: 'images', label: 'Gallery Photo', type: 'image', required: false, options: [], placeholder: '', description: 'Main product image' }
    ]
  },
  {
    id: 'portfolio',
    name: 'Portfolio & Case Studies Pack',
    category: 'Marketing',
    badge: 'Showcase',
    description: 'Showcase high-impact client success stories, visual project galleries, technologies used, and quantifiable outcome metrics.',
    icon: 'Briefcase',
    suggestedSlug: 'case-studies',
    capabilities: [
      'Client & organization attribution',
      'Measurable impact metrics',
      'Year & timeline tagging',
      'Project preview galleries',
      'Full rich case study writeups'
    ],
    fields: [
      { id: 'fld_client', name: 'client_name', label: 'Client / Brand', type: 'text', required: true, options: [], placeholder: 'e.g. Acme Corp', description: '' },
      { id: 'fld_project_url', name: 'project_url', label: 'Live Project URL', type: 'url', required: false, options: [], placeholder: 'https://client-site.com', description: '' },
      { id: 'fld_year', name: 'completion_year', label: 'Completion Year', type: 'number', required: false, options: [], placeholder: '2026', description: '' },
      { id: 'fld_metric', name: 'impact_metric', label: 'Key Result / Impact Metric', type: 'text', required: false, options: [], placeholder: '+240% Speed Increase', description: '' },
      { id: 'fld_screenshot', name: 'hero_screenshot', label: 'Project Screenshot', type: 'image', required: false, options: [], placeholder: '', description: '' }
    ]
  },
  {
    id: 'team',
    name: 'Team & Leadership Directory Pack',
    category: 'Corporate',
    badge: 'Directory',
    description: 'Manage staff profiles, department groupings, leadership bios, direct email contacts, and social media handles.',
    icon: 'Users',
    suggestedSlug: 'team-members',
    capabilities: [
      'Role & title hierarchy',
      'Department categorization',
      'Direct social & email links',
      'Headshot & avatar management',
      'Executive biographies'
    ],
    fields: [
      { id: 'fld_job_title', name: 'job_title', label: 'Job Title / Position', type: 'text', required: true, options: [], placeholder: 'e.g. Head of Engineering', description: '' },
      { id: 'fld_department', name: 'department', label: 'Department', type: 'select', required: false, options: ['Executive', 'Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations'], placeholder: '', description: '' },
      { id: 'fld_email', name: 'direct_email', label: 'Direct Email', type: 'email', required: false, options: [], placeholder: 'name@company.com', description: '' },
      { id: 'fld_linkedin', name: 'linkedin_profile', label: 'LinkedIn URL', type: 'url', required: false, options: [], placeholder: 'https://linkedin.com/in/...', description: '' },
      { id: 'fld_avatar', name: 'avatar', label: 'Profile Photo', type: 'image', required: false, options: [], placeholder: '', description: '' }
    ]
  },
  {
    id: 'testimonials',
    name: 'Client Testimonials & Reviews Pack',
    category: 'Social Proof',
    badge: 'Social Proof',
    description: 'Highlight customer praise, verified review ratings, client avatars, and company affiliations across landing pages.',
    icon: 'MessageSquare',
    suggestedSlug: 'testimonials',
    capabilities: [
      '1 to 5 star rating system',
      'Author designation & role',
      'Company logo & branding',
      'Avatar headshot support',
      'High-conversion quotation blocks'
    ],
    fields: [
      { id: 'fld_author_role', name: 'author_role', label: 'Author Title / Position', type: 'text', required: true, options: [], placeholder: 'e.g. Founder & CEO', description: '' },
      { id: 'fld_company', name: 'company', label: 'Company / Organization', type: 'text', required: false, options: [], placeholder: 'e.g. Stripe', description: '' },
      { id: 'fld_rating', name: 'rating', label: 'Star Rating (1-5)', type: 'number', required: false, options: [], placeholder: '5', description: '' },
      { id: 'fld_avatar', name: 'author_avatar', label: 'Author Photo', type: 'image', required: false, options: [], placeholder: '', description: '' }
    ]
  },
  {
    id: 'events',
    name: 'Events & Conferences Pack',
    category: 'Events',
    badge: 'Events',
    description: 'Organize in-person summits, live webinars, speaker schedules, ticket booking URLs, and calendar integration.',
    icon: 'Calendar',
    suggestedSlug: 'events',
    capabilities: [
      'Start & end date pickers',
      'Physical venue or virtual links',
      'External ticket registration',
      'Session schedules & tracks',
      'Audience calendar integration'
    ],
    fields: [
      { id: 'fld_event_date', name: 'start_date', label: 'Start Date & Time', type: 'date', required: true, options: [], placeholder: '', description: '' },
      { id: 'fld_end_date', name: 'end_date', label: 'End Date', type: 'date', required: false, options: [], placeholder: '', description: '' },
      { id: 'fld_venue', name: 'venue', label: 'Venue or Meeting URL', type: 'text', required: true, options: [], placeholder: 'e.g. Moscone Center, SF or Zoom Link', description: '' },
      { id: 'fld_tickets', name: 'registration_url', label: 'Tickets / Registration URL', type: 'url', required: false, options: [], placeholder: 'https://eventbrite.com/...', description: '' },
      { id: 'fld_banner', name: 'event_banner', label: 'Event Poster / Banner', type: 'image', required: false, options: [], placeholder: '', description: '' }
    ]
  },
  {
    id: 'faqs',
    name: 'FAQ & Help Center Pack',
    category: 'Support',
    badge: 'Knowledge',
    description: 'Deliver structured questions and answers grouped by topic, ideal for customer onboarding, documentation, and SEO rich snippets.',
    icon: 'HelpCircle',
    suggestedSlug: 'faqs',
    capabilities: [
      'Category-based question grouping',
      'Accordion-ready rendering',
      'SEO FAQ schema markup ready',
      'Instant search and filter',
      'Related articles cross-linking'
    ],
    fields: [
      { id: 'fld_question', name: 'question', label: 'Question Headline', type: 'text', required: true, options: [], placeholder: 'e.g. How does static site deployment work?', description: '' },
      { id: 'fld_target_audience', name: 'target_audience', label: 'Target Audience', type: 'text', required: false, options: [], placeholder: 'e.g. Beginners, Developers, Enterprise', description: '' },
      { id: 'fld_short_answer', name: 'short_answer', label: 'Quick Summary Answer', type: 'textarea', required: false, options: [], placeholder: 'A concise 1-2 sentence answer...', description: '' }
    ]
  }
];

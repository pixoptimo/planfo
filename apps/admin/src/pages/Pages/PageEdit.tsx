import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Page, RevisionMeta, ContentBlock, SEO, GridItem } from '@cms/schemas';
import { api } from '../../api/client.js';
import { MediaPickerModal } from '../../components/Media/MediaPickerModal.js';
import { slugify } from '../../utils/slugify.js';
import { useAuth } from '../../context/AuthContext.js';
import { PlanfoLogo } from '../../components/UI/PlanfoLogo.js';
import { getTemplatePreset, TEMPLATE_PRESETS } from '../../data/templatePresets.js';
import { getMediaUrl } from '../../utils/media.js';

// Default SEO template ensuring all string fields are present
const DEFAULT_SEO = {
  title: '',
  description: '',
  canonical: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  robots: 'index,follow',
  noIndex: false
};

// Default block factory for newly inserted blocks
const createDefaultBlock = (type: string): ContentBlock => {
  const id = `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case 'heading':
      return { id, type: 'heading', level: 2, text: 'New Section Heading' };
    case 'paragraph':
      return {
        id,
        type: 'paragraph',
        text: 'Enter your editorial narrative here. Standardize typographic cadence and fluid line-height for optimal reading comfort.'
      };
    case 'blockquote':
      return {
        id,
        type: 'blockquote',
        text: '“Great systems don’t constrain creativity; they liberate designers and engineers from repeatedly solving solved problems.”',
        citation: '— Planfo Design Manifesto • The Next Decade of Editorial Craft'
      };
    case 'image':
      return {
        id,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        alt: 'Company Headquarters & Modernist Design Studio',
        caption: 'Fig 1.1: Company Headquarters & Modernist Design Studio'
      };
    case 'list':
      return {
        id,
        type: 'list',
        style: 'unordered',
        items: [
          'Modular Blocks: compose multi-layered layouts with plug-and-play editorial components.',
          'Dynamic Routing: instant path remapping and sub-millisecond edge pre-rendering.',
          'SEO & OpenGraph: engineered metadata schema generation validated on every keystroke.'
        ]
      };
    case 'table':
      return {
        id,
        type: 'table',
        headers: ['Component Layer', 'Legacy Pattern', 'Editorial Studio Standard'],
        rows: [
          ['Page Canvas', 'Fixed 960px Fluid Container', 'Adaptive 720px / 390px Clamped Measure'],
          ['Content Architecture', 'Single WYSIWYG Textarea', 'Atomic Modular Blocks with Type-Safe Schemas'],
          ['Edge Delivery', 'Dynamic SSR Roundtrip', '< 10ms Zero-Database Static Edge']
        ]
      };
    case 'button':
      return {
        id,
        type: 'button',
        text: 'Join Our Syndicate / Contact Us',
        url: '#',
        variant: 'primary',
        target: '_self'
      };
    case 'code':
      return {
        id,
        type: 'code',
        language: 'typescript',
        code: `// Editorial Studio Page Routing Configuration\nexport const pageRoute = {\n  slug: '/about-us-company',\n  template: 'default',\n  edgeCacheTTL: 86400,\n  preRendered: true\n};`
      };
    case 'callout':
      return {
        id,
        type: 'callout',
        variant: 'info',
        title: 'Editorial Guidance',
        text: 'Ensure all vertical margins lock strictly to modular line-height multiples for harmonious cadence.'
      };
    case 'divider':
      return {
        id,
        type: 'divider'
      };
    case 'grid':
      return {
        id,
        type: 'grid',
        columns: 3,
        items: [
          {
            id: `item_1_${Date.now()}`,
            icon: '01',
            badge: '#secondary',
            title: 'Modular Blocks',
            text: 'Compose multi-layered layouts with plug-and-play editorial components.',
            buttonText: '',
            buttonUrl: ''
          },
          {
            id: `item_2_${Date.now()}`,
            icon: '02',
            badge: '#secondary-container',
            title: 'Dynamic Routing',
            text: 'Instant path remapping and sub-millisecond edge pre-rendering.',
            buttonText: '',
            buttonUrl: ''
          },
          {
            id: `item_3_${Date.now()}`,
            icon: '03',
            badge: '#primary',
            title: 'SEO & OpenGraph',
            text: 'Engineered metadata schema generation validated on every keystroke.',
            buttonText: '',
            buttonUrl: ''
          }
        ]
      };
    default:
      return { id, type: 'paragraph', text: 'New content block' };
  }
};

// Initial default blocks matching the user's reference HTML
const getInitialDefaultBlocks = (): ContentBlock[] => [
  {
    id: 'block_intro_p',
    type: 'paragraph',
    text: "At Planfo, we believe publishing interfaces shouldn't require compromise between boundless creative expression and rigorous systemic architecture. Rather than treating layouts as arbitrary combinations of static canvas elements, our paradigm binds layout primitives, typographic cadence, and autonomous editorial toolchains into a singular fluid craft."
  },
  {
    id: 'block_hero_img',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    alt: 'Company Headquarters & Modernist Design Studio',
    caption: 'Fig 1.1: Company Headquarters & Modernist Design Studio'
  },
  {
    id: 'block_middle_p',
    type: 'paragraph',
    text: 'When editorial organizations unify around responsive atomic blocks, cross-functional velocity accelerates naturally. Newsrooms, corporate communications, and high-growth venture publications can ship intricate story packages without engineering backlogs or fragile custom code.'
  },
  {
    id: 'block_quote',
    type: 'blockquote',
    text: '“Great pages don’t constrain storytelling; they empower content teams to ship with architectural dignity and zero engineering bottlenecks.”',
    citation: '— Planfo Design Manifesto • The Next Decade of Editorial Craft'
  },
  {
    id: 'block_pillars_grid',
    type: 'grid',
    columns: 3,
    items: [
      {
        id: 'pillar_1',
        icon: '01',
        badge: '#secondary',
        title: 'Modular Blocks',
        text: 'Compose multi-layered layouts with plug-and-play editorial components.',
        buttonText: '',
        buttonUrl: ''
      },
      {
        id: 'pillar_2',
        icon: '02',
        badge: '#secondary-container',
        title: 'Dynamic Routing',
        text: 'Instant path remapping and sub-millisecond edge pre-rendering.',
        buttonText: '',
        buttonUrl: ''
      },
      {
        id: 'pillar_3',
        icon: '03',
        badge: '#primary',
        title: 'SEO & OpenGraph',
        text: 'Engineered metadata schema generation validated on every keystroke.',
        buttonText: '',
        buttonUrl: ''
      }
    ]
  },
  {
    id: 'block_conclusion_p',
    type: 'paragraph',
    text: 'Our mandate as builders is to furnish an uncompromising standard for digital longevity. Pages created inside Planfo are ready for the modern web: semantic, lightning fast, and typographically sublime.'
  },
  {
    id: 'block_cta_syndicate',
    type: 'button',
    text: 'Join Our Syndicate / Contact Us',
    url: '#',
    variant: 'primary',
    target: '_self'
  }
];

export const PageEdit: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const isNew = !slug || slug === 'new';
  const navigate = useNavigate();
  const { user, can } = useAuth();

  // Core Page State
  const [page, setPage] = useState<Partial<Page>>({
    title: isNew ? 'About Planfo & The Next Decade of Digital Publishing' : '',
    slug: isNew ? 'about-us-company' : '',
    status: 'draft',
    template: 'default',
    content: { blocks: isNew ? getInitialDefaultBlocks() : [] },
    featuredImage:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    noIndex: false,
    seo: {
      title: isNew ? 'About Planfo & The Next Decade of Digital Publishing' : '',
      description: isNew
        ? 'Systemic page structures, modular layouts, and headless publishing workflows for editorial and product teams.'
        : '',
      canonical: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      robots: 'index,follow',
      noIndex: false
    }
  });

  const [subtitle, setSubtitle] = useState(
    'Systemic page structures, modular layouts, and headless publishing workflows for editorial and product teams.'
  );

  // Inspector & Viewport State
  const [activeTab, setActiveTab] = useState<'settings' | 'seo'>('settings');
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [canvasWidth, setCanvasWidth] = useState(720);
  const [selectedPreset, setSelectedPreset] = useState<string>('default');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<string[]>([
    'default',
    'landing',
    'about',
    'contact',
    'privacy'
  ]);

  // Editing & Block State
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(0);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  // History & Autosave
  const [history, setHistory] = useState<ContentBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [saveStatus, setSaveStatus] = useState<string>('Auto-synced 1m ago');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showPublishDropdown, setShowPublishDropdown] = useState(false);

  // Modals & Drawers
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'hero' | number>('hero');
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState<RevisionMeta[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const manuscriptRef = useRef<HTMLDivElement>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Safe accessor for content blocks
  const blocks: ContentBlock[] =
    page.content && typeof page.content === 'object' && 'blocks' in page.content && Array.isArray((page.content as any).blocks)
      ? (page.content as any).blocks
      : [];

  // Push new history state
  const pushHistory = useCallback(
    (newBlocks: ContentBlock[]) => {
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(JSON.parse(JSON.stringify(newBlocks)));
      if (nextHistory.length > 30) nextHistory.shift();
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      setSaveStatus('Unsaved changes');
    },
    [history, historyIndex]
  );

  const updateBlocks = useCallback(
    (newBlocks: ContentBlock[]) => {
      setPage((prev) => ({
        ...prev,
        content: { blocks: newBlocks }
      }));
      pushHistory(newBlocks);
    },
    [pushHistory]
  );

  // Fetch available templates
  useEffect(() => {
    api.get<{ templates: string[]; activeTheme: string }>('/api/themes/templates')
      .then((data) => {
        if (data?.templates && Array.isArray(data.templates) && data.templates.length > 0) {
          setAvailableTemplates(data.templates);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Page on Edit
  useEffect(() => {
    if (!isNew && slug) {
      setLoading(true);
      api.get<Page>(`/api/pages/${slug}`)
        .then((data) => {
          setPage(data);
          let loadedBlocks: ContentBlock[] = [];
          if (data.content && typeof data.content === 'object' && 'blocks' in data.content && Array.isArray(data.content.blocks)) {
            loadedBlocks = data.content.blocks;
          } else if (typeof data.content === 'string') {
            loadedBlocks = [
              { id: 'b1', type: 'paragraph', text: data.content }
            ];
          } else if (data.content && typeof data.content === 'object' && 'html' in data.content) {
            loadedBlocks = [
              { id: 'b1', type: 'paragraph', text: String((data.content as any).html) }
            ];
          }
          if (loadedBlocks.length === 0) {
            loadedBlocks = getInitialDefaultBlocks();
          }
          setPage((prev) => ({
            ...prev,
            content: { blocks: loadedBlocks }
          }));
          if (data.seo?.description) {
            setSubtitle(data.seo.description);
          }
          setHistory([JSON.parse(JSON.stringify(loadedBlocks))]);
          setHistoryIndex(0);
          setSaveStatus('Auto-synced just now');
        })
        .catch((err) => {
          triggerToast(err instanceof Error ? err.message : 'Failed to load page');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      const initial = getInitialDefaultBlocks();
      setHistory([JSON.parse(JSON.stringify(initial))]);
      setHistoryIndex(0);
    }
  }, [slug, isNew]);

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const targetBlocks = JSON.parse(JSON.stringify(history[targetIndex]));
      setPage((prev) => ({
        ...prev,
        content: { blocks: targetBlocks }
      }));
      setHistoryIndex(targetIndex);
      triggerToast('Undo');
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const targetBlocks = JSON.parse(JSON.stringify(history[targetIndex]));
      setPage((prev) => ({
        ...prev,
        content: { blocks: targetBlocks }
      }));
      setHistoryIndex(targetIndex);
      triggerToast('Redo');
    }
  }, [history, historyIndex]);

  // Insert Block into canvas
  const handleInsertBlock = (type: string) => {
    const newBlock = createDefaultBlock(type);
    const insertAt = activeBlockIndex + 1 <= blocks.length ? activeBlockIndex + 1 : blocks.length;
    const nextBlocks = [...blocks.slice(0, insertAt), newBlock, ...blocks.slice(insertAt)];
    updateBlocks(nextBlocks);
    setActiveBlockIndex(insertAt);
    setEditingBlockId(newBlock.id);
    triggerToast(`Inserted ${type.toUpperCase()} block`);
  };

  // Block manipulation helpers
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...blocks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    updateBlocks(updated);
    setActiveBlockIndex(targetIndex);
  };

  const handleDuplicateBlock = (index: number) => {
    const blockToClone = blocks[index];
    const cloned = {
      ...JSON.parse(JSON.stringify(blockToClone)),
      id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    };
    const updated = [...blocks.slice(0, index + 1), cloned, ...blocks.slice(index + 1)];
    updateBlocks(updated);
    setActiveBlockIndex(index + 1);
    triggerToast('Block duplicated');
  };

  const handleDeleteBlock = (index: number) => {
    if (blocks.length <= 1) {
      triggerToast('Page must have at least one block');
      return;
    }
    const updated = blocks.filter((_, i) => i !== index);
    updateBlocks(updated);
    setActiveBlockIndex(Math.max(0, index - 1));
    triggerToast('Block removed');
  };

  const handleUpdateBlockData = (index: number, partialData: Partial<ContentBlock>) => {
    const updated = blocks.map((b, i) => (i === index ? ({ ...b, ...partialData } as ContentBlock) : b));
    updateBlocks(updated);
  };

  // Load Preset Sections
  const handleLoadPreset = (presetKey: string) => {
    const preset = getTemplatePreset(presetKey) || TEMPLATE_PRESETS[presetKey];
    if (preset && preset.blocks) {
      const clonedBlocks = JSON.parse(JSON.stringify(preset.blocks));
      updateBlocks(clonedBlocks);
      setSelectedPreset(presetKey);
      setShowPresetDropdown(false);
      triggerToast(`Loaded preset sections: ${preset.name}`);
    }
  };

  // Debounced Autosave for existing pages
  useEffect(() => {
    if (isNew || !slug || !page.title?.trim()) return;
    if (saveStatus !== 'Unsaved changes') return;

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);

    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus('Auto-saving...');
        const currentSeo = page.seo || DEFAULT_SEO;
        const payload: Partial<Page> = {
          ...page,
          slug: page.slug?.trim() || slugify(page.title || ''),
          content: { blocks },
          seo: {
            ...DEFAULT_SEO,
            ...currentSeo,
            description: subtitle,
            title: currentSeo.title || page.title || ''
          }
        };
        await api.put(`/api/pages/${slug}`, payload);
        setSaveStatus('Auto-synced just now');
      } catch {
        setSaveStatus('Unsaved changes');
      }
    }, 3000);

    return () => {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [page, blocks, subtitle, slug, isNew, saveStatus]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      if (isCmd && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave(false);
      } else if (isCmd && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (isCmd && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if (isCmd && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Save / Publish
  const handleSave = async (publish = false) => {
    if (!page.title?.trim()) {
      triggerToast('Page title is required');
      return;
    }

    setSaving(true);
    const targetStatus = publish ? 'published' : page.status || 'draft';
    const computedSlug = page.slug?.trim() ? slugify(page.slug) : slugify(page.title || 'untitled-page');
    const currentSeo = page.seo || DEFAULT_SEO;

    const payload: Partial<Page> = {
      ...page,
      slug: computedSlug,
      status: targetStatus,
      content: { blocks },
      seo: {
        ...DEFAULT_SEO,
        ...currentSeo,
        title: page.seo?.title || page.title || '',
        description: subtitle
      }
    };

    try {
      if (isNew) {
        const created = await api.post<Page>('/api/pages', payload);
        triggerToast('Page created successfully!');
        navigate(`/pages/${created.slug}`, { replace: true });
      } else {
        const updated = await api.put<Page>(`/api/pages/${slug}`, payload);
        setPage(updated);
        setSaveStatus('Auto-synced just now');
        triggerToast(publish ? 'Page published successfully!' : 'Page settings saved!');
      }
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
      setShowPublishDropdown(false);
    }
  };

  // Revisions
  const handleLoadRevisions = async () => {
    if (isNew || !slug) return;
    setLoadingRevisions(true);
    try {
      const data = await api.get<RevisionMeta[]>(`/api/pages/${slug}/revisions`);
      setRevisions(data);
      setShowRevisions(true);
    } catch {
      triggerToast('Failed to load revision history');
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleRestoreRevision = async (revId: string) => {
    if (!slug) return;
    if (!confirm('Are you sure you want to restore this revision?')) return;
    try {
      const restored = await api.post<Page>(`/api/pages/${slug}/revisions/${revId}/restore`);
      setPage(restored);
      if (restored.content && typeof restored.content === 'object' && 'blocks' in restored.content) {
        updateBlocks(restored.content.blocks);
      }
      setShowRevisions(false);
      triggerToast('Revision restored successfully');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  // Calculate Document Statistics
  const calculateStats = () => {
    const textContent = blocks
      .map((b) => {
        if ('text' in b) return b.text;
        if ('items' in b && Array.isArray(b.items)) {
          return b.items.map((i) => (typeof i === 'string' ? i : i.title + ' ' + i.text)).join(' ');
        }
        return '';
      })
      .join(' ');
    const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    return { wordCount, readingTime, blockCount: blocks.length, charCount: textContent.length };
  };

  const stats = calculateStats();
  const activeBlock = blocks[activeBlockIndex] || blocks[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-on-surface">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-label-md text-label-md text-on-surface-variant animate-pulse">
          Opening Editorial Studio Canvas...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased flex flex-col relative select-text">
      {/* Toast Feedback */}
      {showToast && toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-inverse-surface text-inverse-on-surface shadow-2xl flex items-center gap-2 text-sm font-label-md animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[18px] text-primary-fixed">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 64px Left Icon Rail */}
      <aside className="fixed left-0 top-0 h-full w-16 bg-surface-container-lowest z-50 flex flex-col items-center justify-between py-space-md border-r border-surface-container-high shadow-xs">
        <div className="flex flex-col items-center gap-space-lg w-full">
          <Link
            to="/"
            title="Planfo CMS Home"
            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-surface-container transition-transform hover:scale-105"
          >
            <PlanfoLogo variant="icon" className="w-7 h-7" />
          </Link>
          <nav className="flex flex-col items-center gap-space-sm w-full px-space-xs">
            <Link
              to="/"
              title="Overview"
              className="flex items-center justify-center w-10 h-10 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </Link>
            <Link
              to="/components-and-tokens"
              title="Components & Tokens"
              className="flex items-center justify-center w-10 h-10 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">widgets</span>
            </Link>
            <Link
              to="/posts"
              title="Articles Library"
              className="flex items-center justify-center w-10 h-10 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
            </Link>
            <Link
              to="/pages"
              title="Pages"
              className="flex items-center justify-center w-10 h-10 transition-colors bg-primary-container/20 text-primary font-bold rounded-lg shadow-xs"
            >
              <span className="material-symbols-outlined text-[20px]">article</span>
            </Link>
            <Link
              to="/media"
              title="Media Assets"
              className="flex items-center justify-center w-10 h-10 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">photo_library</span>
            </Link>
            <Link
              to="/blueprints"
              title="Blueprints"
              className="flex items-center justify-center w-10 h-10 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">schema</span>
            </Link>
          </nav>
        </div>
        <div className="flex flex-col items-center gap-space-sm w-full px-space-xs">
          <Link
            to="/settings"
            title="System Settings"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </Link>
          <div
            title={`Signed in as ${user?.name || user?.email || 'Admin'}`}
            className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs ring-2 ring-primary/20 shadow-xs cursor-pointer"
          >
            {(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}
          </div>
        </div>
      </aside>

      {/* Fixed Top Navigation Header */}
      <header className="fixed top-0 left-16 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/60">
        <div className="h-16 w-full px-space-lg flex items-center justify-between gap-space-md">
          {/* Left: Branding & Breadcrumbs */}
          <div className="flex items-center gap-space-md min-w-0">
            <PlanfoLogo variant="full" className="h-5 w-auto" />
            <span className="text-outline-variant font-body-sm text-body-sm select-none">/</span>
            <div className="flex items-center gap-space-xs min-w-0 text-on-surface-variant">
              <Link
                to="/pages"
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface cursor-pointer truncate transition-colors"
              >
                Pages
              </Link>
              <span className="text-outline-variant select-none font-body-sm text-body-sm">/</span>
              <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
                {page.title || 'Untitled Page'}
              </span>
            </div>
            <span className="px-space-xs py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-medium flex items-center gap-1.5 whitespace-nowrap">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  saveStatus.includes('Unsaved') ? 'bg-tertiary animate-pulse' : 'bg-primary animate-pulse'
                }`}
              ></span>
              {saveStatus}
            </span>
          </div>

          {/* Right: Controls, Preview & Publish */}
          <div className="flex items-center gap-space-md">
            {/* Viewport switcher */}
            <div className="flex items-center p-1 bg-surface-container-low rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className={`flex items-center justify-center p-1.5 rounded transition-all ${
                  viewMode === 'desktop'
                    ? 'bg-surface-container-lowest text-on-surface shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
                title="Desktop view"
              >
                <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`flex items-center justify-center p-1.5 rounded transition-all ${
                  viewMode === 'mobile'
                    ? 'bg-surface-container-lowest text-on-surface shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
                title="Mobile view"
              >
                <span className="material-symbols-outlined text-[18px]">smartphone</span>
              </button>
            </div>

            {/* Undo / Redo */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-30 disabled:pointer-events-none"
                title="Undo (Cmd+Z)"
              >
                <span className="material-symbols-outlined text-[18px]">undo</span>
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-30 disabled:pointer-events-none"
                title="Redo (Cmd+Y)"
              >
                <span className="material-symbols-outlined text-[18px]">redo</span>
              </button>
            </div>

            {/* Preview Button */}
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              Preview
            </button>

            {/* Split Publish Button */}
            <div className="relative inline-flex rounded-lg bg-primary text-on-primary shadow-sm">
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="px-space-md py-1.5 font-label-md text-label-md text-on-primary font-medium hover:bg-primary-container transition-colors rounded-l-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">send</span>
                )}
                <span>{page.status === 'published' ? 'Update Page' : 'Publish Page'}</span>
              </button>
              <div className="w-px bg-primary-container self-stretch"></div>
              <button
                type="button"
                onClick={() => setShowPublishDropdown((prev) => !prev)}
                className="px-space-xs py-1.5 hover:bg-primary-container transition-colors rounded-r-lg flex items-center justify-center"
                title="More publishing options"
              >
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>

              {/* Dropdown menu */}
              {showPublishDropdown && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-container-high py-2 z-50 animate-in fade-in slide-in-from-top-1 text-on-surface">
                  <button
                    type="button"
                    onClick={() => handleSave(false)}
                    className="w-full px-4 py-2 text-left font-label-md text-label-md hover:bg-surface-container flex items-center gap-2.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">draft</span>
                    <span>Save as Draft</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    className="w-full px-4 py-2 text-left font-label-md text-label-md hover:bg-surface-container flex items-center gap-2.5 transition-colors text-primary font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">public</span>
                    <span>Publish Immediately</span>
                  </button>
                  {!isNew && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPublishDropdown(false);
                        handleLoadRevisions();
                      }}
                      className="w-full px-4 py-2 text-left font-label-md text-label-md hover:bg-surface-container flex items-center gap-2.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">history</span>
                      <span>Revision History</span>
                    </button>
                  )}
                  <div className="my-1 border-t border-surface-container-high" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowPublishDropdown(false);
                      if (confirm('Are you sure you want to discard unsaved edits?')) {
                        navigate('/pages');
                      }
                    }}
                    className="w-full px-4 py-2 text-left font-label-md text-label-md text-error hover:bg-error/10 flex items-center gap-2.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    <span>Exit Editor</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shadow-xs">
              {(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container below fixed header */}
      <main className="w-full pl-16 pt-16 bg-surface min-h-screen flex flex-col">
        {/* Sub-bar: Document Meta & View Switcher */}
        <section className="w-full bg-surface-container-lowest shadow-[0_1px_3px_rgba(19,27,46,0.03)] px-space-lg py-2.5 flex items-center justify-between gap-space-md border-b border-surface-container-high/40">
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Interactive Canvas
            </div>

            {/* Preset Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresetDropdown((prev) => !prev)}
                className="flex items-center gap-1.5 text-on-surface font-body-sm text-body-sm hover:bg-surface-container px-2 py-1 rounded transition-colors"
              >
                <span className="text-on-surface-variant">Preset:</span>
                <span className="font-label-md text-label-md font-semibold capitalize">
                  {selectedPreset === 'default' ? 'Standard Page' : `${selectedPreset} Page`}
                </span>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
              </button>

              {showPresetDropdown && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-high py-2 z-50">
                  <div className="px-3 py-1 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Select Layout Preset
                  </div>
                  {Object.keys(TEMPLATE_PRESETS).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleLoadPreset(key)}
                      className="w-full px-3 py-2 text-left hover:bg-surface-container flex flex-col transition-colors"
                    >
                      <span className="font-label-md text-label-md font-semibold text-on-surface capitalize">
                        {TEMPLATE_PRESETS[key].name}
                      </span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant line-clamp-1">
                        {TEMPLATE_PRESETS[key].description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-surface-container-high"></div>

            <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[16px] text-primary">cloud_done</span>
              <span>{saveStatus}</span>
            </div>
          </div>

          {/* View Mode Switcher on Sub-bar */}
          <div className="flex items-center gap-space-md">
            <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all font-label-sm text-label-sm ${
                  viewMode === 'desktop'
                    ? 'bg-surface-container-lowest text-on-surface shadow-[0_1px_3px_rgba(19,27,46,0.06)] font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
                <span>Desktop ({canvasWidth}px)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all font-label-sm text-label-sm ${
                  viewMode === 'mobile'
                    ? 'bg-surface-container-lowest text-on-surface shadow-[0_1px_3px_rgba(19,27,46,0.06)] font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">smartphone</span>
                <span>Mobile (390px)</span>
              </button>
            </div>

            <div className="h-4 w-px bg-surface-container-high"></div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-30"
                title="Undo (Cmd+Z)"
              >
                <span className="material-symbols-outlined text-[18px]">undo</span>
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-30"
                title="Redo (Cmd+Y)"
              >
                <span className="material-symbols-outlined text-[18px]">redo</span>
              </button>
              <button
                type="button"
                onClick={() => setShowStatsModal(true)}
                className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                title="Document Statistics"
              >
                <span className="material-symbols-outlined text-[18px]">insights</span>
              </button>
            </div>
          </div>
        </section>

        {/* Studio Stage & Split Layout */}
        <div className="flex-1 flex min-h-[calc(100vh-108px)] relative overflow-hidden">
          {/* Left Floating Palette: Block Composer */}
          {isPaletteOpen && (
            <aside className="hidden xl:block fixed left-20 top-28 z-30 w-72 bg-surface-container-lowest rounded-xl p-space-md shadow-[0_10px_30px_-8px_rgba(19,27,46,0.08)] border border-surface-container-high/60 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 mb-3 bg-surface-container-low px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">add_circle</span>
                  <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-semibold">
                    Insert Blocks
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-code text-code">
                    ⌘ + K
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPaletteOpen(false)}
                    className="text-on-surface-variant hover:text-on-surface p-0.5 rounded"
                    title="Minimize block palette"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm px-1">
                Click or drag elements directly onto the page canvas.
              </p>

              {/* 2-Column Grid of Block Inserters */}
              <div className="grid grid-cols-2 gap-2 mb-space-md">
                <button
                  type="button"
                  onClick={() => handleInsertBlock('heading')}
                  className="flex flex-col items-start gap-1 p-2.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[20px] text-primary group-hover:text-on-primary">
                      title
                    </span>
                    <span className="font-code text-code opacity-60">H1/H2</span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface group-hover:text-on-primary">
                    Headings
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertBlock('paragraph')}
                  className="flex flex-col items-start gap-1 p-2.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[20px] text-primary group-hover:text-on-primary">
                      text_fields
                    </span>
                    <span className="font-code text-code opacity-60">P</span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface group-hover:text-on-primary">
                    Paragraph
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertBlock('image')}
                  className="flex flex-col items-start gap-1 p-2.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary transition-all text-left group relative"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[20px] text-primary group-hover:text-on-primary">
                      image
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface group-hover:text-on-primary">
                    Media Frame
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertBlock('blockquote')}
                  className={`flex flex-col items-start gap-1 p-2.5 rounded-lg transition-all text-left group ${
                    activeBlock?.type === 'blockquote'
                      ? 'bg-primary-fixed text-on-primary-fixed shadow-sm'
                      : 'bg-surface-container-low hover:bg-primary hover:text-on-primary'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        activeBlock?.type === 'blockquote' ? 'text-primary' : 'text-primary group-hover:text-on-primary'
                      }`}
                    >
                      format_quote
                    </span>
                    {activeBlock?.type === 'blockquote' && (
                      <span className="font-label-sm text-label-sm bg-primary text-on-primary px-1 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold">Pull Quote</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertBlock('button')}
                  className="flex flex-col items-start gap-1 p-2.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[20px] text-primary group-hover:text-on-primary">
                      call_to_action
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface group-hover:text-on-primary">
                    CTA Button
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertBlock('grid')}
                  className="flex flex-col items-start gap-1 p-2.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[20px] text-primary group-hover:text-on-primary">
                      grid_view
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface group-hover:text-on-primary">
                    Grid Cards
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertBlock('callout')}
                  className="flex flex-col items-start gap-1 p-2.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[20px] text-primary group-hover:text-on-primary">
                      lightbulb
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface group-hover:text-on-primary">
                    Callout Note
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertBlock('divider')}
                  className="flex flex-col items-start gap-1 p-2.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[20px] text-primary group-hover:text-on-primary">
                      horizontal_rule
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface group-hover:text-on-primary">
                    Hairline Divider
                  </span>
                </button>
              </div>

              {/* Status footer pill */}
              <div className="relative bg-surface-container p-2.5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
                  <span className="font-label-sm text-label-sm text-on-surface font-medium capitalize truncate">
                    Cursor: {activeBlock ? activeBlock.type.replace('_', ' ') : 'Overview'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest text-primary font-code text-code shadow-xs">
                  Ln {activeBlockIndex + 1}
                </span>
              </div>
            </aside>
          )}

          {/* Floating Re-open Block Inserter button if palette closed */}
          {!isPaletteOpen && (
            <button
              type="button"
              onClick={() => setIsPaletteOpen(true)}
              className="hidden xl:flex fixed left-20 top-28 z-30 p-2.5 rounded-xl bg-surface-container-lowest shadow-lg border border-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-all items-center gap-1.5"
              title="Open Block Composer (Cmd+K)"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span className="font-label-sm text-label-sm font-semibold">Blocks</span>
            </button>
          )}

          {/* Center Stage: The Editorial Sheet Canvas */}
          <section className="flex-1 flex flex-col items-center justify-start py-space-xl px-4 lg:px-8 overflow-y-auto">
            <div
              id="manuscriptPaper"
              ref={manuscriptRef}
              style={{
                maxWidth: viewMode === 'mobile' ? '390px' : `${canvasWidth}px`
              }}
              className="w-full bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(19,27,46,0.04),0_12px_36px_-6px_rgba(19,27,46,0.06)] px-8 sm:px-14 py-12 transition-all duration-300 relative group/canvas border border-surface-container-high/40"
            >
              {/* Top-right floating indicator */}
              <div className="absolute -top-3 right-8 flex items-center gap-1 bg-inverse-surface text-inverse-on-surface px-2.5 py-1 rounded-full shadow-lg text-[12px] opacity-0 group-hover/canvas:opacity-100 transition-opacity select-none">
                <span className="material-symbols-outlined text-[14px]">edit_note</span>
                <span className="font-label-sm text-label-sm">Live Page Editing</span>
              </div>

              {/* Eyebrow Header */}
              <header className="mb-space-lg">
                <div className="flex items-center justify-between gap-space-sm mb-space-md">
                  <span className="font-label-sm text-label-sm tracking-widest uppercase text-primary font-bold">
                    PAGES & ARCHITECTURE
                  </span>
                  <span className="font-code text-code text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                    PAGE ID #{page.slug ? page.slug.toUpperCase().slice(0, 8) : 'PG-NEW'}
                  </span>
                </div>

                {/* Inline Editable Title */}
                <input
                  type="text"
                  value={page.title || ''}
                  placeholder="Enter Page Headline..."
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setPage((prev) => ({
                      ...prev,
                      title: newTitle,
                      slug: isNew ? slugify(newTitle) : prev.slug
                    }));
                    setSaveStatus('Unsaved changes');
                  }}
                  className="w-full font-serif font-headline-lg text-3xl sm:text-4xl text-on-surface tracking-tight bg-transparent border-b border-transparent hover:border-surface-container-high focus:border-primary focus:outline-none transition-colors mb-space-md py-1"
                />

                {/* Inline Editable Excerpt / Subtitle */}
                <textarea
                  rows={2}
                  value={subtitle}
                  placeholder="Enter page introduction and architectural premise..."
                  onChange={(e) => {
                    setSubtitle(e.target.value);
                    setSaveStatus('Unsaved changes');
                  }}
                  className="w-full font-serif italic text-lg sm:text-xl text-on-surface-variant bg-transparent border-b border-transparent hover:border-surface-container-high focus:border-primary focus:outline-none leading-relaxed transition-colors mb-space-lg resize-none py-1"
                />

                {/* Metadata Byline strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 py-space-sm bg-surface-container-low px-4 rounded-lg text-body-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-surface-container-lowest font-code text-code text-primary font-medium border border-outline-variant/30">
                      Slug: /{page.slug || 'untitled-page'}
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="text-on-surface-variant">
                      Template: {page.template ? page.template.charAt(0).toUpperCase() + page.template.slice(1) : 'Default (Standard)'}
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span
                      className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold ${
                        page.noIndex
                          ? 'bg-surface-container text-on-surface-variant'
                          : 'bg-primary-fixed text-on-primary-fixed'
                      }`}
                    >
                      SEO: {page.noIndex ? 'No-Index' : 'Indexed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <span>
                      {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {stats.readingTime} min read
                    </span>
                  </div>
                </div>
              </header>

              <div className="w-full h-px bg-surface-container-high mb-space-lg"></div>

              {/* Rendered Content Blocks */}
              <article className="space-y-space-lg text-on-surface">
                {blocks.map((block, index) => {
                  const isFirst = index === 0;
                  const isActive = activeBlockIndex === index;

                  return (
                    <div
                      key={block.id || `b_${index}`}
                      onClick={() => setActiveBlockIndex(index)}
                      className={`relative group/block rounded-xl transition-all ${
                        isActive
                          ? 'ring-2 ring-primary/40 bg-surface-container-low/30 p-2 -m-2'
                          : 'hover:ring-1 hover:ring-surface-container-high hover:bg-surface-container-low/10 p-2 -m-2'
                      }`}
                    >
                      {/* Floating Block Hover Actions Toolbar */}
                      <div className="absolute right-2 -top-3.5 z-20 hidden group-hover/block:flex items-center gap-1 bg-surface-container-lowest px-2 py-1 rounded-full shadow-md border border-surface-container-high text-xs">
                        <span className="font-label-sm text-label-sm text-primary font-bold px-1.5 uppercase">
                          {block.type}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveBlock(index, 'up');
                          }}
                          disabled={index === 0}
                          title="Move Up"
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveBlock(index, 'down');
                          }}
                          disabled={index === blocks.length - 1}
                          title="Move Down"
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateBlock(index);
                          }}
                          title="Duplicate Block"
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBlock(index);
                          }}
                          title="Delete Block"
                          className="p-1 rounded hover:bg-error/10 text-error"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>

                      {/* Block Type Renderers */}
                      {block.type === 'paragraph' && (
                        <div className="relative">
                          {isFirst ? (
                            <div className="relative">
                              <textarea
                                rows={4}
                                value={block.text}
                                onChange={(e) => handleUpdateBlockData(index, { text: e.target.value })}
                                className="w-full font-body-lg text-body-lg leading-relaxed bg-transparent border border-transparent hover:border-surface-container-high focus:border-primary focus:bg-surface-container-lowest rounded p-1 focus:outline-none transition-colors resize-none"
                              />
                            </div>
                          ) : (
                            <textarea
                              rows={3}
                              value={block.text}
                              onChange={(e) => handleUpdateBlockData(index, { text: e.target.value })}
                              className="w-full font-body-lg text-body-lg leading-relaxed bg-transparent border border-transparent hover:border-surface-container-high focus:border-primary focus:bg-surface-container-lowest rounded p-1 focus:outline-none transition-colors resize-none"
                            />
                          )}
                        </div>
                      )}

                      {block.type === 'heading' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={block.text}
                            onChange={(e) => handleUpdateBlockData(index, { text: e.target.value })}
                            className={`w-full font-serif font-bold text-on-surface bg-transparent border border-transparent hover:border-surface-container-high focus:border-primary focus:bg-surface-container-lowest rounded px-1.5 py-1 focus:outline-none transition-colors ${
                              block.level === 1
                                ? 'text-2xl sm:text-3xl'
                                : block.level === 2
                                ? 'text-xl sm:text-2xl'
                                : 'text-lg sm:text-xl'
                            }`}
                          />
                          <select
                            value={block.level}
                            onChange={(e) =>
                              handleUpdateBlockData(index, {
                                level: parseInt(e.target.value, 10) as any
                              })
                            }
                            className="text-xs bg-surface-container-low px-2 py-1 rounded text-on-surface-variant border-0"
                          >
                            <option value={1}>H1</option>
                            <option value={2}>H2</option>
                            <option value={3}>H3</option>
                            <option value={4}>H4</option>
                          </select>
                        </div>
                      )}

                      {block.type === 'image' && (
                        <div className="w-full rounded-xl overflow-hidden bg-surface-container relative shadow-sm my-space-md">
                          <img
                            src={getMediaUrl(block.url)}
                            alt={block.alt || 'Page illustration'}
                            className="w-full h-72 object-cover"
                          />
                          <div className="p-3 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <input
                              type="text"
                              value={block.caption || ''}
                              placeholder="Enter image caption..."
                              onChange={(e) => handleUpdateBlockData(index, { caption: e.target.value })}
                              className="bg-transparent font-body-sm text-body-sm text-on-surface-variant flex-1 border-b border-transparent focus:border-primary focus:outline-none"
                            />
                            <div className="flex items-center gap-2">
                              <span className="font-code text-code text-on-surface-variant whitespace-nowrap">
                                1200 × 800 px
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setMediaTarget(index);
                                  setShowMediaPicker(true);
                                }}
                                className="px-2 py-1 bg-surface-container-lowest hover:bg-surface-container rounded text-xs text-primary font-semibold transition"
                              >
                                Replace
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {block.type === 'blockquote' && (
                        <blockquote className="my-space-xl pl-6 py-2 bg-gradient-to-r from-primary-fixed/30 to-transparent rounded-r-xl relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full"></div>
                          <textarea
                            rows={2}
                            value={block.text}
                            onChange={(e) => handleUpdateBlockData(index, { text: e.target.value })}
                            className="w-full font-headline-md text-headline-md italic text-on-surface leading-snug font-serif bg-transparent border-0 focus:outline-none resize-none"
                          />
                          <footer className="mt-space-sm font-label-md text-label-md text-on-surface-variant not-italic flex items-center gap-2">
                            <input
                              type="text"
                              value={block.citation || ''}
                              placeholder="Citation or source..."
                              onChange={(e) => handleUpdateBlockData(index, { citation: e.target.value })}
                              className="w-full bg-transparent border-b border-transparent focus:border-primary focus:outline-none text-primary font-medium"
                            />
                          </footer>
                        </blockquote>
                      )}

                      {block.type === 'grid' && (
                        <div className="p-space-lg rounded-xl bg-surface-container-low shadow-[0_1px_4px_rgba(19,27,46,0.02)] space-y-space-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
                              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-bold">
                                Page Architecture Pillars
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-code text-code">
                              {block.items?.length || 0} Core Directives
                            </span>
                          </div>

                          <div
                            className={`grid grid-cols-1 ${
                              block.columns === 4
                                ? 'md:grid-cols-4'
                                : block.columns === 2
                                ? 'md:grid-cols-2'
                                : 'md:grid-cols-3'
                            } gap-space-sm pt-2`}
                          >
                            {(block.items || []).map((item, itemIdx) => (
                              <div
                                key={item.id || itemIdx}
                                className="bg-surface-container-lowest p-3.5 rounded-lg flex flex-col justify-between shadow-xs border border-surface-container-high/40"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-code text-code text-primary font-bold">
                                      {item.icon || `0${itemIdx + 1}`}
                                    </span>
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        itemIdx === 0
                                          ? 'bg-secondary'
                                          : itemIdx === 1
                                          ? 'bg-secondary-container'
                                          : 'bg-primary'
                                      }`}
                                    ></span>
                                  </div>
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => {
                                      const nextItems = [...(block.items || [])];
                                      nextItems[itemIdx] = { ...item, title: e.target.value };
                                      handleUpdateBlockData(index, { items: nextItems });
                                    }}
                                    className="w-full font-label-md text-label-md text-on-surface mb-1 font-semibold bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                                  />
                                  <textarea
                                    rows={2}
                                    value={item.text}
                                    onChange={(e) => {
                                      const nextItems = [...(block.items || [])];
                                      nextItems[itemIdx] = { ...item, text: e.target.value };
                                      handleUpdateBlockData(index, { items: nextItems });
                                    }}
                                    className="w-full font-body-sm text-body-sm text-on-surface-variant bg-transparent border-0 focus:outline-none resize-none leading-snug"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {block.type === 'callout' && (
                        <div
                          className={`p-4 rounded-xl flex items-start gap-3 ${
                            block.variant === 'warning'
                              ? 'bg-tertiary-fixed/30 border border-tertiary/20 text-on-tertiary-fixed-variant'
                              : block.variant === 'success'
                              ? 'bg-primary-fixed/30 border border-primary/20 text-on-primary-fixed-variant'
                              : 'bg-surface-container border border-surface-container-high text-on-surface'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px] text-primary flex-shrink-0 mt-0.5">
                            lightbulb
                          </span>
                          <div className="flex-1 min-w-0">
                            {block.title && (
                              <input
                                type="text"
                                value={block.title}
                                onChange={(e) => handleUpdateBlockData(index, { title: e.target.value })}
                                className="w-full font-label-md text-label-md font-bold mb-1 bg-transparent border-0 focus:outline-none"
                              />
                            )}
                            <textarea
                              rows={2}
                              value={block.text}
                              onChange={(e) => handleUpdateBlockData(index, { text: e.target.value })}
                              className="w-full font-body-sm text-body-sm bg-transparent border-0 focus:outline-none resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'button' && (
                        <div className="mt-space-xl p-space-lg rounded-xl bg-gradient-to-br from-primary-fixed to-surface-container text-on-primary-fixed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
                          <div>
                            <h4 className="font-headline-sm text-headline-sm text-on-primary-fixed font-serif">
                              Join Our Syndicate & Connect
                            </h4>
                            <p className="font-body-sm text-body-sm text-on-primary-fixed-variant">
                              Get in touch with our publishing architects or schedule a live platform briefing.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={block.text}
                              onChange={(e) => handleUpdateBlockData(index, { text: e.target.value })}
                              className="px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all text-center"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'divider' && (
                        <div className="py-4">
                          <hr className="border-t border-surface-container-high" />
                        </div>
                      )}

                      {block.type === 'code' && (
                        <div className="rounded-xl overflow-hidden bg-inverse-surface text-inverse-on-surface p-4 font-code text-xs">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container-highest/20 text-on-surface-variant">
                            <span className="uppercase">{block.language || 'typescript'}</span>
                            <span>Code Snippet</span>
                          </div>
                          <textarea
                            rows={4}
                            value={block.code}
                            onChange={(e) => handleUpdateBlockData(index, { code: e.target.value })}
                            className="w-full bg-transparent font-code text-xs text-inverse-on-surface border-0 focus:outline-none resize-none"
                          />
                        </div>
                      )}

                      {block.type === 'list' && (
                        <ul className="list-disc pl-6 space-y-2 font-body-md text-body-md text-on-surface">
                          {(block.items || []).map((item, itemIdx) => (
                            <li key={itemIdx}>
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  const updatedItems = [...block.items];
                                  updatedItems[itemIdx] = e.target.value;
                                  handleUpdateBlockData(index, { items: updatedItems });
                                }}
                                className="w-full bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                              />
                            </li>
                          ))}
                        </ul>
                      )}

                      {block.type === 'table' && (
                        <div className="overflow-x-auto my-4 rounded-lg border border-surface-container-high">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-surface-container-low font-label-sm">
                              <tr>
                                {(block.headers || []).map((head, hIdx) => (
                                  <th key={hIdx} className="p-2.5 border-b border-surface-container-high">
                                    <input
                                      type="text"
                                      value={head}
                                      onChange={(e) => {
                                        const nextHeaders = [...block.headers];
                                        nextHeaders[hIdx] = e.target.value;
                                        handleUpdateBlockData(index, { headers: nextHeaders });
                                      }}
                                      className="bg-transparent font-bold border-0 focus:outline-none w-full"
                                    />
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(block.rows || []).map((row, rIdx) => (
                                <tr key={rIdx} className="border-b border-surface-container-high/40">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2.5">
                                      <input
                                        type="text"
                                        value={cell}
                                        onChange={(e) => {
                                          const nextRows = [...block.rows];
                                          nextRows[rIdx][cIdx] = e.target.value;
                                          handleUpdateBlockData(index, { rows: nextRows });
                                        }}
                                        className="bg-transparent border-0 focus:outline-none w-full"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </article>

              {/* Page Footer */}
              <footer className="mt-space-xl pt-space-lg border-t-0 flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface">
                    #Company
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface">
                    #Architecture
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface">
                    #Publishing
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">favorite</span>
                    <span className="font-code text-code">312</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        triggerToast('Page link copied to clipboard');
                      }
                    }}
                    className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span>
                    <span className="font-code text-code">Share</span>
                  </button>
                </div>
              </footer>
            </div>
          </section>

          {/* Right Inspector Rail (Collapsible Design / Settings Panel) */}
          <aside className="w-80 h-[calc(100vh-108px)] sticky top-0 bg-surface-container-lowest shadow-[-1px_0_4px_rgba(19,27,46,0.03)] flex flex-col z-20 border-l border-surface-container-high/60">
            {/* Inspector Segmented Tabs */}
            <div className="p-space-md pb-2 bg-surface-container-lowest">
              <div className="flex items-center p-1 bg-surface-container-low rounded-lg w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 py-1.5 text-center font-label-md text-label-md rounded-md transition-all font-semibold ${
                    activeTab === 'settings'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Page Settings
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('seo')}
                  className={`flex-1 py-1.5 text-center font-label-md text-label-md rounded-md transition-all font-semibold ${
                    activeTab === 'seo'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  SEO & Social
                </button>
              </div>
            </div>

            {/* Scrollable Inspector Body */}
            <div className="flex-1 overflow-y-auto px-space-md py-space-sm space-y-space-lg">
              {/* Search Tokens Filter */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-on-surface-variant">
                  search
                </span>
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search settings & tokens..."
                  className="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {activeTab === 'settings' && (
                <>
                  {/* Section: Layout & Template */}
                  <div className="space-y-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-semibold">
                        Layout & Template
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                        dashboard_customize
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <div>
                        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                          Page Template
                        </label>
                        <select
                          value={page.template || 'default'}
                          onChange={(e) => {
                            setPage((prev) => ({ ...prev, template: e.target.value }));
                            setSaveStatus('Unsaved changes');
                          }}
                          className="w-full p-2 bg-surface-container-low rounded-lg text-on-surface font-body-sm focus:outline-none focus:ring-1 focus:ring-primary border-0"
                        >
                          {availableTemplates.map((tmpl) => (
                            <option key={tmpl} value={tmpl}>
                              {tmpl.charAt(0).toUpperCase() + tmpl.slice(1)} (Standard)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                          Preset Layout
                        </label>
                        <div className="flex items-center justify-between w-full p-2 bg-surface-container-low rounded-lg text-on-surface font-body-sm gap-2">
                          <span className="font-medium truncate capitalize">
                            {selectedPreset === 'default' ? 'Standard Page' : `${selectedPreset} Page`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleLoadPreset(selectedPreset)}
                            className="px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-colors whitespace-nowrap"
                          >
                            Load Preset Sections
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: Hero & Media */}
                  <div className="space-y-space-sm pt-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-semibold">
                        Hero & Media
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">image</span>
                    </div>
                    <div className="p-2.5 bg-surface-container-low rounded-lg space-y-2">
                      <div className="flex items-center gap-3">
                        {page.featuredImage ? (
                          <img
                            src={getMediaUrl(page.featuredImage)}
                            alt="Hero Thumbnail"
                            className="w-16 h-10 object-cover rounded shadow-xs"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-surface-container rounded flex items-center justify-center text-on-surface-variant">
                            <span className="material-symbols-outlined text-[18px]">image</span>
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-label-sm text-label-sm font-medium text-on-surface truncate">
                            {page.featuredImage
                              ? page.featuredImage.split('/').pop()?.slice(0, 20) || 'Featured Image'
                              : 'No hero selected'}
                          </span>
                          <span className="font-code text-code text-on-surface-variant">1920 × 1080 px</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMediaTarget('hero');
                            setShowMediaPicker(true);
                          }}
                          className="flex-1 py-1.5 rounded bg-surface-container-lowest text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-container transition-colors border border-outline-variant/30"
                        >
                          Change Hero Image
                        </button>
                        {page.featuredImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setPage((prev) => ({ ...prev, featuredImage: '' }));
                              setSaveStatus('Unsaved changes');
                            }}
                            className="p-1.5 rounded text-error hover:bg-error/10"
                            title="Remove Hero"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section: Canvas & Spacing */}
                  <div className="space-y-space-sm pt-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-semibold">
                        Canvas & Spacing
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                        aspect_ratio
                      </span>
                    </div>
                    <div className="space-y-3 pt-1">
                      <div>
                        <div className="flex items-center justify-between text-on-surface mb-1">
                          <span className="font-body-sm text-body-sm text-on-surface-variant">Max Column Width</span>
                          <span className="font-code text-code font-semibold text-primary">{canvasWidth} px</span>
                        </div>
                        <input
                          type="range"
                          min={540}
                          max={860}
                          value={canvasWidth}
                          onChange={(e) => setCanvasWidth(parseInt(e.target.value, 10))}
                          className="w-full accent-primary h-1 bg-surface-container-high rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between font-code text-code text-on-surface-variant text-[10px] mt-1">
                          <span>540px</span>
                          <span>Optimized Reading (720px)</span>
                          <span>860px</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-surface-container-low p-2 rounded-lg">
                        <span className="font-body-sm text-body-sm text-on-surface">Vertical Padding</span>
                        <span className="font-code text-code text-on-surface">48px (3rem)</span>
                      </div>
                    </div>
                  </div>

                  {/* Section: SEO & Search Indexing (Quick card) */}
                  <div className="space-y-space-sm pt-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-semibold">
                        SEO & Search Indexing
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                        travel_explore
                      </span>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block font-label-sm text-label-sm font-semibold text-on-surface">
                            Search Indexing
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                            {page.noIndex ? 'Page hidden from engines' : 'Index this page on search engines'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPage((prev) => ({ ...prev, noIndex: !prev.noIndex }));
                            setSaveStatus('Unsaved changes');
                          }}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                            page.noIndex ? 'bg-surface-container-high' : 'bg-primary'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                        </button>
                      </div>

                      <div>
                        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                          URL Slug
                        </label>
                        <input
                          type="text"
                          value={page.slug || ''}
                          onChange={(e) => {
                            setPage((prev) => ({ ...prev, slug: slugify(e.target.value) }));
                            setSaveStatus('Unsaved changes');
                          }}
                          className="w-full px-2.5 py-1.5 bg-surface-container-lowest rounded border border-outline-variant/30 font-code text-code text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-label-sm text-label-sm text-on-surface-variant">Meta Title</label>
                          <span className="font-code text-[11px] text-primary">
                            {(page.seo?.title || page.title || '').length} / 60
                          </span>
                        </div>
                        <input
                          type="text"
                          value={page.seo?.title || page.title || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPage((prev) => ({
                              ...prev,
                              seo: { ...DEFAULT_SEO, ...(prev.seo || {}), title: val }
                            }));
                            setSaveStatus('Unsaved changes');
                          }}
                          className="w-full px-2.5 py-1.5 bg-surface-container-lowest rounded border border-outline-variant/30 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Google Snippet Preview */}
                      <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant/30 space-y-1">
                        <span className="block text-[10px] font-code text-primary uppercase">
                          Google Snippet Preview
                        </span>
                        <span className="block font-body-sm text-body-sm font-semibold text-secondary hover:underline cursor-pointer truncate">
                          {page.seo?.title || page.title || 'Untitled Page'}
                        </span>
                        <span className="block text-[11px] text-on-surface-variant leading-snug line-clamp-2">
                          {subtitle || 'Systemic page structures and headless publishing workflows.'}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-space-md">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                      Search Engine Indexing
                    </label>
                    <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                      <span className="font-body-sm text-body-sm text-on-surface">
                        {page.noIndex ? 'No-Index (Hidden from Google)' : 'Allow Indexing (Recommended)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPage((prev) => ({ ...prev, noIndex: !prev.noIndex }));
                          setSaveStatus('Unsaved changes');
                        }}
                        className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                          page.noIndex ? 'bg-surface-container-high' : 'bg-primary'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            page.noIndex ? 'translate-x-0' : 'translate-x-4'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-label-sm text-label-sm text-on-surface-variant">SEO Meta Title</label>
                      <span className="font-code text-[11px] text-primary">
                        {(page.seo?.title || page.title || '').length} / 60
                      </span>
                    </div>
                    <input
                      type="text"
                      value={page.seo?.title || page.title || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPage((prev) => ({
                          ...prev,
                          seo: { ...DEFAULT_SEO, ...(prev.seo || {}), title: val }
                        }));
                        setSaveStatus('Unsaved changes');
                      }}
                      className="w-full px-2.5 py-1.5 bg-surface-container-lowest rounded border border-outline-variant/30 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-label-sm text-label-sm text-on-surface-variant">Meta Description</label>
                      <span className="font-code text-[11px] text-primary">
                        {(page.seo?.description || subtitle).length} / 160
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={page.seo?.description || subtitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubtitle(val);
                        setPage((prev) => ({
                          ...prev,
                          seo: { ...DEFAULT_SEO, ...(prev.seo || {}), description: val }
                        }));
                        setSaveStatus('Unsaved changes');
                      }}
                      className="w-full px-2.5 py-1.5 bg-surface-container-lowest rounded border border-outline-variant/30 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                      Canonical URL (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="https://example.com/about"
                      value={page.seo?.canonical || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPage((prev) => ({
                          ...prev,
                          seo: { ...DEFAULT_SEO, ...(prev.seo || {}), canonical: val }
                        }));
                        setSaveStatus('Unsaved changes');
                      }}
                      className="w-full px-2.5 py-1.5 bg-surface-container-lowest rounded border border-outline-variant/30 font-code text-code text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* OpenGraph Social Card Preview */}
                  <div className="p-3 bg-surface-container-low rounded-lg space-y-2">
                    <span className="font-label-sm text-label-sm font-semibold uppercase text-on-surface block">
                      OpenGraph Social Card Preview
                    </span>
                    <div className="rounded-lg overflow-hidden border border-outline-variant/30 bg-surface-container-lowest">
                      {page.featuredImage && (
                        <img
                          src={getMediaUrl(page.featuredImage)}
                          alt="Social Preview"
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-3">
                        <span className="text-xs font-semibold text-on-surface block truncate">
                          {page.seo?.title || page.title || 'Page Title'}
                        </span>
                        <span className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">
                          {subtitle}
                        </span>
                        <span className="text-[10px] text-primary font-code mt-1 block">
                          planfo.io/{page.slug || 'untitled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Inspector Footer Actions */}
            <div className="p-space-md bg-surface-container-lowest shadow-[0_-1px_4px_rgba(19,27,46,0.02)] flex items-center justify-between border-t border-surface-container-high/60">
              <button
                type="button"
                onClick={() => {
                  setCanvasWidth(720);
                  setViewMode('desktop');
                  triggerToast('Canvas defaults reset');
                }}
                className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="px-3 py-1.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold shadow-xs hover:bg-primary-container transition-all disabled:opacity-50"
              >
                Save Page Settings
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url, alt) => {
          if (mediaTarget === 'hero') {
            setPage((prev) => ({
              ...prev,
              featuredImage: url
            }));
            triggerToast('Hero image updated');
          } else if (typeof mediaTarget === 'number') {
            handleUpdateBlockData(mediaTarget, { url, alt: alt || '' });
            triggerToast('Image block updated');
          }
          setShowMediaPicker(false);
          setSaveStatus('Unsaved changes');
        }}
      />

      {/* Responsive Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-surface-container-high">
            {/* Modal Header */}
            <div className="h-14 px-6 bg-surface-container-low flex items-center justify-between border-b border-surface-container-high">
              <div className="flex items-center gap-3">
                <span className="font-label-md text-label-md font-bold text-on-surface">Page Device Preview</span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-xs font-code text-primary">
                  /{page.slug || 'preview'}
                </span>
              </div>
              <div className="flex items-center p-1 bg-surface-container rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    previewDevice === 'desktop' ? 'bg-surface-container-lowest shadow-xs' : 'text-on-surface-variant'
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('tablet')}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    previewDevice === 'tablet' ? 'bg-surface-container-lowest shadow-xs' : 'text-on-surface-variant'
                  }`}
                >
                  Tablet
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    previewDevice === 'mobile' ? 'bg-surface-container-lowest shadow-xs' : 'text-on-surface-variant'
                  }`}
                >
                  Mobile
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Preview Frame */}
            <div className="flex-1 overflow-y-auto bg-surface p-8 flex items-start justify-center">
              <div
                style={{
                  width: previewDevice === 'mobile' ? '390px' : previewDevice === 'tablet' ? '768px' : '100%',
                  maxWidth: previewDevice === 'desktop' ? '860px' : undefined
                }}
                className="bg-surface-container-lowest p-8 rounded-xl shadow-lg border border-surface-container-high transition-all"
              >
                <h1 className="font-serif text-3xl font-bold mb-3">{page.title}</h1>
                <p className="font-serif italic text-lg text-on-surface-variant mb-6">{subtitle}</p>
                {page.featuredImage && (
                  <img
                    src={getMediaUrl(page.featuredImage)}
                    alt="Hero"
                    className="w-full h-64 object-cover rounded-xl mb-6"
                  />
                )}
                <div className="space-y-4 font-body-md text-on-surface">
                  {blocks.map((b) => (
                    <div key={b.id}>
                      {b.type === 'paragraph' && <p className="leading-relaxed">{b.text}</p>}
                      {b.type === 'heading' && (
                        <h2 className="font-serif font-bold text-xl mt-4 mb-2">{b.text}</h2>
                      )}
                      {b.type === 'blockquote' && (
                        <blockquote className="pl-4 border-l-4 border-primary italic my-4">
                          “{b.text}”
                          {b.citation && <footer className="text-xs text-primary mt-1">— {b.citation}</footer>}
                        </blockquote>
                      )}
                      {b.type === 'image' && (
                        <img src={getMediaUrl(b.url)} alt={b.alt} className="w-full rounded-lg my-4" />
                      )}
                      {b.type === 'divider' && <hr className="my-6" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Statistics Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl p-6 border border-surface-container-high space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">insights</span>
                <span className="font-label-md text-label-md font-bold">Document Statistics</span>
              </div>
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="p-1 rounded hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-surface-container-low rounded-lg text-center">
                <span className="text-xs font-medium text-on-surface-variant block">Word Count</span>
                <span className="text-2xl font-bold font-code text-primary">{stats.wordCount}</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-lg text-center">
                <span className="text-xs font-medium text-on-surface-variant block">Reading Time</span>
                <span className="text-2xl font-bold font-code text-primary">{stats.readingTime} min</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-lg text-center">
                <span className="text-xs font-medium text-on-surface-variant block">Total Blocks</span>
                <span className="text-2xl font-bold font-code text-on-surface">{stats.blockCount}</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-lg text-center">
                <span className="text-xs font-medium text-on-surface-variant block">Characters</span>
                <span className="text-2xl font-bold font-code text-on-surface">{stats.charCount}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowStatsModal(false)}
              className="w-full py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-semibold hover:bg-primary-container transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Revision History Drawer */}
      {showRevisions && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md h-full shadow-2xl p-6 flex flex-col border-l border-surface-container-high">
            <div className="flex items-center justify-between pb-4 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                <h3 className="font-label-md text-label-md font-bold text-on-surface">Revision History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRevisions(false)}
                className="p-1 rounded hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {loadingRevisions ? (
                <div className="text-center py-8 text-on-surface-variant text-sm">Loading revisions...</div>
              ) : revisions.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant text-sm">No revisions found for this page.</div>
              ) : (
                revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between border border-surface-container-high/40"
                  >
                    <div>
                      <span className="font-code text-xs text-primary font-semibold block">
                        Version {rev.version || rev.id.slice(0, 8)}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {new Date(rev.createdAt).toLocaleString()} • {rev.authorEmail || 'Author'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreRevision(rev.id)}
                      className="px-2.5 py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

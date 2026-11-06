import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Product, Category, RevisionMeta, ContentBlock } from '@cms/schemas';
import { api } from '../../api/client.js';
import { MediaPickerModal } from '../../components/Media/MediaPickerModal.js';
import { StatusBadge } from '../../components/UI/StatusBadge.js';
import { CategorySelector } from '../../components/Taxonomy/CategorySelector.js';
import { SEOFields } from '../../components/SEO/SEOFields.js';
import { slugify } from '../../utils/slugify.js';
import { useAuth } from '../../context/AuthContext.js';
import { PlanfoLogo } from '../../components/UI/PlanfoLogo.js';

// Default block templates for Product Specifications & Content
const createDefaultBlock = (type: string): ContentBlock => {
  const id = `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case 'heading':
      return { id, type: 'heading', level: 2, text: 'Product Specifications' };
    case 'paragraph':
      return {
        id,
        type: 'paragraph',
        text: 'Engineered with aerospace-grade anodized aluminum and acoustic tuning foam. Built to withstand continuous daily studio production workflows.'
      };
    case 'table':
      return {
        id,
        type: 'table',
        headers: ['Specification', 'Value / Metric', 'Tolerance'],
        rows: [
          ['Frequency Response', '10Hz – 40kHz', '±0.5 dB'],
          ['Driver Diameter', '50mm Neodymium', 'Matched Pair'],
          ['Battery Endurance', '36 Hours ANC On', 'Fast USB-C']
        ]
      };
    case 'callout':
      return {
        id,
        type: 'callout',
        variant: 'info',
        title: 'Warranty & Care Directive',
        text: 'Every unit includes a 3-year limited hardware warranty and complimentary studio calibration support.'
      };
    case 'image':
      return {
        id,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
        alt: 'Product detail view showing premium materials',
        caption: 'Studio-grade hardware finish and acoustic dampening enclosure.'
      };
    case 'button':
      return {
        id,
        type: 'button',
        text: 'Download Technical Whitepaper',
        url: '#',
        variant: 'primary',
        target: '_blank'
      };
    case 'divider':
      return {
        id,
        type: 'divider'
      };
    default:
      return { id, type: 'paragraph', text: 'New product specification note' };
  }
};

export const ProductEdit: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const isNew = !slug || slug === 'new';
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!isNew);

  // Core Product Data
  const [product, setProduct] = useState<Partial<Product>>({
    name: isNew ? 'Autonomous Studio Soundstage Pro' : '',
    slug: isNew ? 'autonomous-studio-soundstage-pro' : '',
    sku: isNew ? 'PROD-STU-001' : '',
    price: isNew ? 349.00 : 0,
    currency: 'USD',
    shortDescription: isNew
      ? 'Reference-grade closed-back studio monitors with active ambient decoupling and zero-latency wireless connectivity.'
      : '',
    description: { blocks: [] },
    images: isNew
      ? ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80']
      : [],
    category: 'general',
    tags: ['Hardware', 'Audio', 'Studio'],
    status: 'draft',
    featured: true,
    template: 'default',
    seo: {
      title: '',
      description: '',
      canonical: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      robots: 'index,follow',
      noIndex: false
    }
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showPublishDropdown, setShowPublishDropdown] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Viewport & Studio Tabs
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [canvasWidth, setCanvasWidth] = useState(720);
  const [activeTab, setActiveTab] = useState<'specs' | 'seo'>('specs');

  // Revisions Modal
  const [revisions, setRevisions] = useState<RevisionMeta[]>([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  // Undo / Redo History Stack
  const historyRef = useRef<Partial<Product>[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const pushHistory = (state: Partial<Product>) => {
    const nextIndex = historyIndexRef.current + 1;
    historyRef.current = historyRef.current.slice(0, nextIndex);
    historyRef.current.push(JSON.parse(JSON.stringify(state)));
    historyIndexRef.current = nextIndex;
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prev = historyRef.current[historyIndexRef.current];
      if (prev) setProduct(JSON.parse(JSON.stringify(prev)));
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const next = historyRef.current[historyIndexRef.current];
      if (next) setProduct(JSON.parse(JSON.stringify(next)));
    }
  };

  useEffect(() => {
    loadCategories();
    if (!isNew && slug) {
      loadProduct(slug);
    } else {
      // Seed default block if new
      setProduct((prev) => ({
        ...prev,
        description: {
          blocks: [
            createDefaultBlock('heading'),
            createDefaultBlock('paragraph'),
            createDefaultBlock('table'),
            createDefaultBlock('callout')
          ]
        }
      }));
    }
  }, [slug, isNew]);

  const loadCategories = async () => {
    try {
      const data = await api.get<Category[]>('/api/categories?type=product');
      setCategories(data);
    } catch {
      // ignore
    }
  };

  const loadProduct = async (prodSlug: string) => {
    setLoading(true);
    try {
      const data = await api.get<Product>(`/api/products/${prodSlug}`);
      setProduct(data);
      pushHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish = false) => {
    if (!product.name?.trim()) {
      setError('Product name is required');
      return;
    }

    setSaving(true);
    setError(null);

    const targetStatus = publish ? 'published' : product.status || 'draft';
    const payload = {
      ...product,
      price: Number(product.price || 0),
      status: targetStatus
    };

    try {
      if (isNew) {
        const created = await api.post<Product>('/api/products', payload);
        setToastMessage(`Product "${created.name}" created successfully!`);
        setShowToast(true);
        setTimeout(() => {
          navigate(`/products/${created.slug}`, { replace: true });
        }, 600);
      } else {
        const updated = await api.put<Product>(`/api/products/${slug}`, payload);
        setProduct(updated);
        pushHistory(updated);
        setToastMessage('Product updated and synced live!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
      setShowPublishDropdown(false);
    }
  };

  const loadRevisions = async () => {
    if (isNew || !slug) return;
    setLoadingRevisions(true);
    try {
      const data = await api.get<RevisionMeta[]>(`/api/revisions/product/${slug}`);
      setRevisions(data);
    } catch {
      // ignore
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleRestoreRevision = async (revId: string) => {
    if (!slug) return;
    if (!confirm('Restore this revision snapshot? Unsaved changes will be replaced.')) return;
    try {
      const restored = await api.post<Product>(`/api/revisions/product/${slug}/${revId}/restore`);
      setProduct(restored);
      pushHistory(restored);
      setShowRevisions(false);
      setToastMessage('Snapshot restored successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  // Block management for product specifications & narrative
  const addBlock = (type: string) => {
    const newBlock = createDefaultBlock(type);
    setProduct((prev) => {
      const currentBlocks = prev.description?.blocks || [];
      const updated = {
        ...prev,
        description: {
          blocks: [...currentBlocks, newBlock]
        }
      };
      pushHistory(updated);
      return updated;
    });
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setProduct((prev) => {
      const currentBlocks = prev.description?.blocks || [];
      const updatedBlocks = currentBlocks.map((b) => (b.id === id ? ({ ...b, ...updates } as ContentBlock) : b));
      return {
        ...prev,
        description: { blocks: updatedBlocks }
      };
    });
  };

  const removeBlock = (id: string) => {
    setProduct((prev) => {
      const currentBlocks = prev.description?.blocks || [];
      const updated = {
        ...prev,
        description: { blocks: currentBlocks.filter((b) => b.id !== id) }
      };
      pushHistory(updated);
      return updated;
    });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    setProduct((prev) => {
      const currentBlocks = [...(prev.description?.blocks || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentBlocks.length) return prev;
      const [moved] = currentBlocks.splice(index, 1);
      currentBlocks.splice(targetIndex, 0, moved);
      const updated = {
        ...prev,
        description: { blocks: currentBlocks }
      };
      pushHistory(updated);
      return updated;
    });
  };

  const removeImage = (urlToRemove: string) => {
    setProduct((prev) => {
      const updated = {
        ...prev,
        images: (prev.images || []).filter((u) => u !== urlToRemove)
      };
      pushHistory(updated);
      return updated;
    });
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().replace(/^#/, '');
    if (!trimmed) return;
    if (!product.tags?.includes(trimmed)) {
      setProduct((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), trimmed]
      }));
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setProduct((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tagToRemove)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-3 text-on-surface-variant font-body-sm">
        <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>Loading Product Studio...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased flex flex-col">
      {/* Top Studio Stage Bar */}
      <header className="h-14 bg-surface-container-lowest border-b border-surface-container-high/40 px-5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        {/* Left: Brand / breadcrumb / auto-synced */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            title="Planfo CMS Home"
            className="hidden sm:flex items-center justify-center p-1 rounded-lg hover:bg-surface-container transition-transform hover:scale-105 shrink-0"
          >
            <PlanfoLogo variant="icon" className="h-6 w-auto" />
          </Link>

          <Link
            to="/products"
            className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
            title="Back to Products"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>

          <div className="flex items-center gap-2 text-body-sm min-w-0">
            <Link to="/products" className="text-on-surface-variant hover:text-primary transition-colors truncate">
              Products
            </Link>
            <span className="text-outline-variant select-none">/</span>
            <span className="font-title-sm text-title-sm font-semibold text-on-surface truncate max-w-[200px] sm:max-w-[320px]">
              {product.name || 'New Product'}
            </span>
            <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container font-code text-[11px] text-primary font-medium shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Auto-synced
            </span>
          </div>
        </div>

        {/* Center: Viewport & Undo/Redo */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center bg-surface-container rounded-lg p-0.5 border border-surface-container-high/40">
            <button
              type="button"
              onClick={() => {
                setViewportMode('desktop');
                setCanvasWidth(720);
              }}
              className={`px-3 py-1 rounded-md text-label-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewportMode === 'desktop'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">desktop_windows</span>
              <span>Desktop [720px]</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewportMode('mobile');
                setCanvasWidth(380);
              }}
              className={`px-3 py-1 rounded-md text-label-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewportMode === 'mobile'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">smartphone</span>
              <span>Mobile [380px]</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-on-surface-variant border-l border-surface-container-high/40 pl-3">
            <button
              type="button"
              onClick={handleUndo}
              className="p-1.5 hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
              title="Undo"
            >
              <span className="material-symbols-outlined text-[18px]">undo</span>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              className="p-1.5 hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
              title="Redo"
            >
              <span className="material-symbols-outlined text-[18px]">redo</span>
            </button>
          </div>
        </div>

        {/* Right: Live Preview, Publish & User */}
        <div className="flex items-center gap-3">
          {!isNew && (
            <a
              href={`/api/preview/product/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border border-surface-container-high/60 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span className="hidden sm:inline">Preview</span>
            </a>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {saving ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[16px]">publish</span>
              )}
              <span>{product.status === 'published' ? 'Update Product' : 'Publish Product'}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPublishDropdown(!showPublishDropdown);
                }}
                className="material-symbols-outlined text-[14px] ml-0.5 hover:bg-black/20 rounded p-0.5"
              >
                expand_more
              </span>
            </button>

            {showPublishDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest border border-surface-container-high/60 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="w-full px-4 py-2 text-left font-label-sm text-label-sm text-on-surface hover:bg-surface-container flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Save as Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProduct((prev) => ({ ...prev, status: 'archived' }));
                    handleSave(false);
                  }}
                  className="w-full px-4 py-2 text-left font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">archive</span>
                  <span>Set as Archived</span>
                </button>
              </div>
            )}
          </div>

          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-surface-container-highest flex items-center justify-center font-label-xs font-bold text-primary shrink-0 select-none">
            {user?.name?.[0] || 'A'}
          </div>
        </div>
      </header>

      {/* Main Studio Body: Left Block Composer, Center Canvas, Right Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Floating Block Composer Palette */}
        <aside className="hidden xl:flex w-64 bg-surface-container-lowest/80 backdrop-blur-md border-r border-surface-container-high/40 p-4 flex-col gap-4 overflow-y-auto shrink-0 z-10">
          <div className="flex items-center justify-between">
            <span className="font-label-xs text-label-xs uppercase font-bold tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[16px]">dashboard_customize</span>
              <span>Insert Specs</span>
            </span>
            <span className="font-code text-[11px] text-on-surface-variant/70">Click to add</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => addBlock('heading')}
              className="p-2.5 bg-surface-container-low hover:bg-surface-container border border-surface-container-high/40 rounded-xl text-left flex flex-col gap-1 transition-all group"
            >
              <div className="flex items-center justify-between text-primary">
                <span className="material-symbols-outlined text-[18px]">title</span>
                <span className="font-code text-[10px] text-on-surface-variant group-hover:text-primary">H2</span>
              </div>
              <span className="font-label-xs text-label-xs font-semibold text-on-surface">Specs Heading</span>
            </button>

            <button
              type="button"
              onClick={() => addBlock('paragraph')}
              className="p-2.5 bg-surface-container-low hover:bg-surface-container border border-surface-container-high/40 rounded-xl text-left flex flex-col gap-1 transition-all group"
            >
              <div className="flex items-center justify-between text-primary">
                <span className="material-symbols-outlined text-[18px]">format_paragraph</span>
                <span className="font-code text-[10px] text-on-surface-variant group-hover:text-primary">P</span>
              </div>
              <span className="font-label-xs text-label-xs font-semibold text-on-surface">Details Text</span>
            </button>

            <button
              type="button"
              onClick={() => addBlock('table')}
              className="p-2.5 bg-surface-container-low hover:bg-surface-container border border-surface-container-high/40 rounded-xl text-left flex flex-col gap-1 transition-all group"
            >
              <div className="flex items-center justify-between text-primary">
                <span className="material-symbols-outlined text-[18px]">table_chart</span>
                <span className="font-code text-[10px] text-on-surface-variant group-hover:text-primary">TBL</span>
              </div>
              <span className="font-label-xs text-label-xs font-semibold text-on-surface">Metrics Table</span>
            </button>

            <button
              type="button"
              onClick={() => addBlock('callout')}
              className="p-2.5 bg-surface-container-low hover:bg-surface-container border border-surface-container-high/40 rounded-xl text-left flex flex-col gap-1 transition-all group"
            >
              <div className="flex items-center justify-between text-primary">
                <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                <span className="font-code text-[10px] text-on-surface-variant group-hover:text-primary">NOTE</span>
              </div>
              <span className="font-label-xs text-label-xs font-semibold text-on-surface">Key Highlight</span>
            </button>

            <button
              type="button"
              onClick={() => addBlock('image')}
              className="p-2.5 bg-surface-container-low hover:bg-surface-container border border-surface-container-high/40 rounded-xl text-left flex flex-col gap-1 transition-all group"
            >
              <div className="flex items-center justify-between text-primary">
                <span className="material-symbols-outlined text-[18px]">image</span>
                <span className="font-code text-[10px] text-on-surface-variant group-hover:text-primary">IMG</span>
              </div>
              <span className="font-label-xs text-label-xs font-semibold text-on-surface">Media Frame</span>
            </button>

            <button
              type="button"
              onClick={() => addBlock('button')}
              className="p-2.5 bg-surface-container-low hover:bg-surface-container border border-surface-container-high/40 rounded-xl text-left flex flex-col gap-1 transition-all group"
            >
              <div className="flex items-center justify-between text-primary">
                <span className="material-symbols-outlined text-[18px]">smart_button</span>
                <span className="font-code text-[10px] text-on-surface-variant group-hover:text-primary">CTA</span>
              </div>
              <span className="font-label-xs text-label-xs font-semibold text-on-surface">Action Button</span>
            </button>
          </div>

          <div className="mt-2 pt-3 border-t border-surface-container-high/40">
            <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container-high/30 space-y-2">
              <div className="flex items-center gap-2 text-primary font-label-xs font-semibold">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Editorial Standard</span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Structured blocks provide clean static JSON export for instant edge-rendering across headless storefronts.
              </p>
            </div>
          </div>
        </aside>

        {/* Center Editorial Manuscript Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-surface">
          <div
            style={{ width: `${canvasWidth}px` }}
            className="w-full transition-all duration-300 bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl shadow-xl min-h-[850px] p-6 sm:p-12 flex flex-col space-y-8"
          >
            {/* Top Product Identifier Tag & Status */}
            <div className="flex items-center justify-between border-b border-surface-container-high/30 pb-4">
              <div className="flex items-center gap-2">
                <span className="font-code text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                  SKU: {product.sku || 'NOT SET'}
                </span>
                <span className="text-outline-variant">•</span>
                <span className="font-body-sm text-[11px] text-on-surface-variant capitalize">
                  Category: {product.category || 'General'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {product.featured && (
                  <span className="inline-flex items-center gap-1 font-label-xs text-label-xs font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    <span>Featured</span>
                  </span>
                )}
                <StatusBadge status={product.status || 'draft'} />
              </div>
            </div>

            {/* Product Headline (Newsreader Serif) */}
            <div className="space-y-2">
              <input
                type="text"
                value={product.name || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setProduct((prev) => {
                    const next = { ...prev, name: val };
                    if (!slugManuallyEdited || !prev.slug) {
                      next.slug = slugify(val);
                    }
                    return next;
                  });
                }}
                placeholder="Product Title..."
                className="w-full bg-transparent border-0 font-headline-lg text-3xl sm:text-4xl font-serif text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-0 p-0 leading-tight"
              />

              {/* Price & Currency Display Banner */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-xl font-headline-sm font-serif font-bold text-lg">
                  <span>{product.currency === 'EUR' ? '€' : product.currency === 'GBP' ? '£' : product.currency === 'INR' ? '₹' : '$'}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={product.price ?? 0}
                    onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) || 0 })}
                    className="w-24 bg-transparent border-0 font-code font-bold text-primary focus:outline-none focus:ring-0 p-0 text-base"
                  />
                  <span className="font-code text-xs font-normal text-primary/70">{product.currency || 'USD'}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-code bg-surface-container px-2.5 py-1 rounded-lg border border-surface-container-high/40">
                  <span className="text-on-surface-variant/60">/products/</span>
                  <input
                    type="text"
                    value={product.slug || ''}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setProduct({ ...product, slug: e.target.value });
                    }}
                    placeholder="product-slug"
                    className="bg-transparent border-0 text-on-surface font-code text-xs focus:outline-none focus:ring-0 p-0 w-36 sm:w-48"
                  />
                </div>
              </div>
            </div>

            {/* Short Description Lead Paragraph */}
            <div>
              <textarea
                rows={2}
                value={product.shortDescription || ''}
                onChange={(e) => setProduct({ ...product, shortDescription: e.target.value })}
                placeholder="Editorial overview / excerpt displayed on cards and search snippets..."
                className="w-full bg-transparent border-0 font-body-lg text-body-lg text-on-surface-variant placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-0 p-0 resize-none leading-relaxed italic"
              />
            </div>

            {/* Product Gallery Showcase */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-label-xs text-label-xs uppercase tracking-wider font-bold text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">photo_library</span>
                  <span>Visual Showcase ({product.images?.length || 0})</span>
                </span>

                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="font-label-xs text-label-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                  <span>Add Gallery Media</span>
                </button>
              </div>

              {product.images && product.images.length > 0 ? (
                <div className="space-y-2">
                  {/* Hero primary image */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-surface-container border border-surface-container-high/40 shadow-xs group">
                    <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(product.images![0])}
                      className="absolute top-3 right-3 bg-black/70 hover:bg-error text-white p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove hero image"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    <div className="absolute bottom-2.5 left-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[11px] font-code text-white">
                      Primary Showcase Hero
                    </div>
                  </div>

                  {/* Thumbnail gallery */}
                  {product.images.length > 1 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                      {product.images.slice(1).map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-xl overflow-hidden bg-surface-container border border-surface-container-high/40 group shadow-2xs"
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(img)}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-error text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="w-full aspect-video rounded-2xl border-2 border-dashed border-surface-container-high/80 hover:border-primary/50 bg-surface-container-low hover:bg-surface-container transition-all flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:text-primary p-6"
                >
                  <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                  <span className="font-label-sm text-label-sm font-semibold">Attach Product Showcase Image</span>
                  <span className="text-[11px] text-on-surface-variant/70">Click to select from Media Library</span>
                </button>
              )}
            </div>

            {/* Structured Specifications & Narrative Canvas */}
            <div className="pt-6 border-t border-surface-container-high/40 space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-label-xs text-label-xs uppercase tracking-wider font-bold text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">segment</span>
                  <span>Specifications & Narrative Canvas</span>
                </span>
                <span className="font-code text-[11px] text-on-surface-variant/70">
                  {product.description?.blocks?.length || 0} Blocks
                </span>
              </div>

              {/* Render Structured Blocks */}
              <div className="space-y-4">
                {(product.description?.blocks || []).map((block, index) => (
                  <div
                    key={block.id}
                    className="relative group bg-surface-container-lowest border border-surface-container-high/40 hover:border-primary/40 rounded-xl p-4 transition-all shadow-2xs"
                  >
                    {/* Block Action Controls */}
                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-xs px-2 py-1 rounded-lg border border-surface-container-high/60 shadow-xs transition-opacity z-10">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                        title="Move Up"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 'down')}
                        disabled={index === (product.description?.blocks?.length || 0) - 1}
                        className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                        title="Move Down"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="p-1 text-error hover:bg-error-container/20 rounded"
                        title="Delete Block"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>

                    {/* Block Content Renderers */}
                    {block.type === 'heading' && (
                      <div>
                        <input
                          type="text"
                          value={block.text || ''}
                          onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                          placeholder="Heading text..."
                          className="w-full bg-transparent border-0 font-headline-md text-headline-md font-serif text-on-surface focus:outline-none p-0"
                        />
                      </div>
                    )}

                    {block.type === 'paragraph' && (
                      <div>
                        <textarea
                          rows={3}
                          value={block.text || ''}
                          onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                          placeholder="Narrative specification..."
                          className="w-full bg-transparent border-0 font-body-md text-body-md text-on-surface focus:outline-none p-0 resize-none leading-relaxed"
                        />
                      </div>
                    )}

                    {block.type === 'table' && (
                      <div className="overflow-x-auto space-y-2">
                        <table className="w-full text-left font-body-sm text-xs">
                          <thead className="bg-surface-container-low text-on-surface-variant border-b border-surface-container-high/40">
                            <tr>
                              {(block.headers || []).map((h, i) => (
                                <th key={i} className="px-3 py-2 font-semibold">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-container-high/30">
                            {(block.rows || []).map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="px-3 py-2 text-on-surface">
                                    <input
                                      type="text"
                                      value={cell}
                                      onChange={(e) => {
                                        const newRows = [...(block.rows || [])];
                                        newRows[rIdx][cIdx] = e.target.value;
                                        updateBlock(block.id, { rows: newRows });
                                      }}
                                      className="w-full bg-transparent border-0 focus:outline-none p-0 text-xs font-code"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {block.type === 'callout' && (
                      <div className="p-3 bg-surface-container-low rounded-xl border border-primary/20 space-y-1">
                        <div className="flex items-center gap-2 text-primary font-label-sm font-semibold">
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                          <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                            placeholder="Callout title..."
                            className="bg-transparent border-0 font-semibold focus:outline-none p-0 w-full text-primary"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={block.text || ''}
                          onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                          placeholder="Callout narrative..."
                          className="w-full bg-transparent border-0 font-body-sm text-body-sm text-on-surface-variant focus:outline-none p-0 resize-none"
                        />
                      </div>
                    )}

                    {block.type === 'image' && (
                      <div className="space-y-2">
                        {block.url ? (
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-container">
                            <img src={block.url} alt={block.alt || ''} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="p-6 text-center text-on-surface-variant bg-surface-container rounded-xl text-xs">
                            No image selected
                          </div>
                        )}
                        <input
                          type="text"
                          value={block.caption || ''}
                          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                          placeholder="Image caption / specification note..."
                          className="w-full bg-transparent border-0 font-body-sm text-xs text-on-surface-variant italic focus:outline-none p-0"
                        />
                      </div>
                    )}

                    {block.type === 'button' && (
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={block.text || ''}
                          onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                          placeholder="Button Label"
                          className="px-4 py-2 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-semibold focus:outline-none border-0"
                        />
                        <input
                          type="text"
                          value={block.url || ''}
                          onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                          placeholder="https://..."
                          className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3 py-1.5 font-code text-xs text-on-surface focus:outline-none"
                        />
                      </div>
                    )}

                    {block.type === 'divider' && <div className="h-px bg-surface-container-high my-2" />}
                  </div>
                ))}

                {(!product.description?.blocks || product.description.blocks.length === 0) && (
                  <div className="p-8 text-center border-2 border-dashed border-surface-container-high/60 rounded-xl text-on-surface-variant font-body-sm">
                    No specification blocks yet. Click any block in the left palette to insert headings, tables, or notes.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Taxonomy Tags */}
            <div className="pt-6 border-t border-surface-container-high/30 flex flex-wrap items-center gap-2">
              <span className="font-label-xs text-label-xs uppercase font-bold text-on-surface-variant mr-1">
                Tags:
              </span>
              {(product.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-xs text-label-xs font-semibold"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-error text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1 bg-surface-container rounded-full px-2.5 py-0.5 border border-surface-container-high/40">
                <span className="text-on-surface-variant font-code text-xs">#</span>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder="add tag..."
                  className="bg-transparent border-0 font-label-xs text-xs text-on-surface focus:outline-none p-0 w-20"
                />
              </div>
            </div>
          </div>
        </main>

        {/* Right Design & Settings Inspector Rail */}
        <aside className="w-80 bg-surface-container-lowest border-l border-surface-container-high/40 flex flex-col shrink-0 overflow-y-auto">
          {/* Tab Selector */}
          <div className="p-3 border-b border-surface-container-high/40">
            <div className="grid grid-cols-2 p-0.5 bg-surface-container rounded-xl border border-surface-container-high/40">
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`py-1.5 rounded-lg font-label-xs text-label-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'specs'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Product Specs</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={`py-1.5 rounded-lg font-label-xs text-label-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'seo'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">travel_explore</span>
                <span>SEO & Social</span>
              </button>
            </div>
          </div>

          {/* Inspector Content */}
          <div className="p-5 space-y-6">
            {activeTab === 'specs' ? (
              <>
                {/* Pricing & SKU */}
                <div className="space-y-4">
                  <span className="font-label-xs text-label-xs uppercase font-bold tracking-wider text-on-surface-variant block">
                    Pricing & Inventory
                  </span>

                  <div>
                    <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={product.price ?? 0}
                      onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-code text-sm font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      Currency
                    </label>
                    <select
                      value={product.currency || 'USD'}
                      onChange={(e) => setProduct({ ...product, currency: e.target.value })}
                      className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                      SKU / Identifier
                    </label>
                    <input
                      type="text"
                      value={product.sku || ''}
                      onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                      placeholder="e.g. STU-MON-001"
                      className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-code text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Category & Featured */}
                <div className="pt-4 border-t border-surface-container-high/40 space-y-4">
                  <span className="font-label-xs text-label-xs uppercase font-bold tracking-wider text-on-surface-variant block">
                    Taxonomy & Merchandising
                  </span>

                  <CategorySelector
                    value={product.category || 'general'}
                    onChange={(slugVal) => setProduct({ ...product, category: slugVal })}
                    type="product"
                    label="Product Category"
                  />

                  <label className="flex items-center gap-2.5 font-label-sm text-label-sm font-semibold text-on-surface cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={product.featured || false}
                      onChange={(e) => setProduct({ ...product, featured: e.target.checked })}
                      className="w-4 h-4 text-primary rounded border-surface-container-high focus:ring-primary"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-amber-500 text-[18px]">star</span>
                      <span>Feature on Storefront Homepage</span>
                    </span>
                  </label>
                </div>

                {/* Revisions & History */}
                {!isNew && (
                  <div className="pt-4 border-t border-surface-container-high/40 space-y-2">
                    <span className="font-label-xs text-label-xs uppercase font-bold tracking-wider text-on-surface-variant block">
                      Snapshots & Revisions
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRevisions(true);
                        loadRevisions();
                      }}
                      className="w-full px-3.5 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-label-sm text-label-sm font-semibold flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-primary">history</span>
                        <span>Version History</span>
                      </div>
                      <span className="font-code text-[11px] text-on-surface-variant">View logs</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <SEOFields
                  seo={
                    product.seo || {
                      title: '',
                      description: '',
                      canonical: '',
                      ogTitle: '',
                      ogDescription: '',
                      ogImage: '',
                      robots: 'index,follow',
                      noIndex: false
                    }
                  }
                  onChange={(seo) => setProduct((prev) => ({ ...prev, seo }))}
                />
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPickerModal
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(url) => {
            setProduct((prev) => ({
              ...prev,
              images: [...(prev.images || []), url]
            }));
            setShowMediaPicker(false);
          }}
        />
      )}

      {/* Revisions History Modal */}
      {showRevisions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-surface-container-high/40 flex items-center justify-between bg-surface-container-low/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                <h3 className="font-headline-sm text-headline-sm font-serif text-on-surface">Product Revisions</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRevisions(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              {loadingRevisions ? (
                <div className="p-8 text-center text-on-surface-variant font-body-sm">Loading revisions...</div>
              ) : revisions.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant font-body-sm">No revisions recorded yet.</div>
              ) : (
                revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 bg-surface-container-low border border-surface-container-high/40 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="font-label-sm text-label-sm font-semibold text-on-surface">
                        {new Date(rev.createdAt).toLocaleString()}
                      </p>
                      <p className="font-body-sm text-[11px] text-on-surface-variant">
                        Author: {rev.authorEmail || 'Product Architect'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreRevision(rev.id)}
                      className="px-3 py-1 bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold rounded-lg transition-colors"
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

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-surface px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
          <span className="font-body-sm text-body-sm font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

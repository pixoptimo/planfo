import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Blueprint, BlueprintEntry, ContentBlock, SEO } from '@cms/schemas';
import { api } from '../../api/client.js';
import { MediaPickerModal } from '../../components/Media/MediaPickerModal.js';
import { SEOFields } from '../../components/SEO/SEOFields.js';
import { getBlueprintIcon } from '../../utils/blueprintIcons.js';
import { getMediaUrl } from '../../utils/media.js';
import { slugify } from '../../utils/slugify.js';
import { useAuth } from '../../context/AuthContext.js';
import { PlanfoLogo } from '../../components/UI/PlanfoLogo.js';

export const DynamicEntryEdit: React.FC = () => {
  const { blueprintSlug, entrySlug } = useParams<{ blueprintSlug: string; entrySlug?: string }>();
  const isNew = !entrySlug || entrySlug === 'new';
  const navigate = useNavigate();
  const { user } = useAuth();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!isNew);

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [entry, setEntry] = useState<Partial<BlueprintEntry>>({
    title: '',
    slug: '',
    status: 'draft',
    category: 'general',
    tags: [],
    excerpt: '',
    featuredImage: '',
    data: {},
    content: { blocks: [] },
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

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPublishDropdown, setShowPublishDropdown] = useState(false);

  // Inspector & Viewport
  const [activeTab, setActiveTab] = useState<'attributes' | 'seo'>('attributes');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [canvasWidth, setCanvasWidth] = useState(720);
  const [canvasPadding, setCanvasPadding] = useState(48);

  // Media Picker
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [activeImageField, setActiveImageField] = useState<string | null>(null);

  // Demo ZIP handling
  const [demoModes, setDemoModes] = useState<Record<string, 'url' | 'zip'>>({});
  const [uploadingZip, setUploadingZip] = useState(false);
  const [zipUploadMessage, setZipUploadMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Undo / Redo history
  const historyRef = useRef<Partial<BlueprintEntry>[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const pushHistory = (state: Partial<BlueprintEntry>) => {
    const nextIndex = historyIndexRef.current + 1;
    historyRef.current = historyRef.current.slice(0, nextIndex);
    historyRef.current.push(JSON.parse(JSON.stringify(state)));
    historyIndexRef.current = nextIndex;
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prev = historyRef.current[historyIndexRef.current];
      if (prev) setEntry(JSON.parse(JSON.stringify(prev)));
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const next = historyRef.current[historyIndexRef.current];
      if (next) setEntry(JSON.parse(JSON.stringify(next)));
    }
  };

  useEffect(() => {
    if (blueprintSlug) {
      loadData(blueprintSlug, entrySlug);
    }
  }, [blueprintSlug, entrySlug]);

  const loadData = async (bpSlug: string, entSlug?: string) => {
    setLoading(true);
    setError(null);
    try {
      const bp = await api.get<Blueprint>(`/api/blueprints/${bpSlug}`);
      setBlueprint(bp);

      if (!isNew && entSlug) {
        const res = await api.get<{ blueprint: Blueprint; entry: BlueprintEntry }>(
          `/api/blueprints/${bpSlug}/entries/${entSlug}`
        );
        setEntry(res.entry);
        pushHistory(res.entry);
      } else {
        const initial = {
          title: `New ${bp.singularName}`,
          slug: '',
          status: 'draft' as const,
          category: 'general',
          tags: [],
          excerpt: '',
          featuredImage: '',
          data: {},
          content: { blocks: [] },
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
        };
        setEntry(initial);
        pushHistory(initial);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load record');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (val: string) => {
    setEntry((prev) => {
      const next = { ...prev, title: val };
      if (!slugManuallyEdited || !prev.slug) {
        next.slug = slugify(val);
      }
      return next;
    });
  };

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setEntry((prev) => ({
      ...prev,
      data: {
        ...(prev.data || {}),
        [fieldName]: value
      }
    }));
  };

  const handleDemoZipUpload = async (fieldName: string, file: File) => {
    setUploadingZip(true);
    setZipUploadMessage(null);

    try {
      const targetSlug = entry.slug || entrySlug || blueprintSlug || 'template';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slug', targetSlug);

      const res = await api.post<{
        demoUrl: string;
        downloadFile: string;
        entryHtml: string;
        filesCount: number;
        totalSize: number;
      }>('/api/demos/upload', formData);

      if (res?.demoUrl) {
        handleCustomFieldChange(fieldName, res.demoUrl);
        if (blueprint?.fields.some((f) => f.name === 'downloadFile') && res.downloadFile) {
          handleCustomFieldChange('downloadFile', res.downloadFile);
        }
        setZipUploadMessage({
          text: `ZIP extracted (${res.filesCount} files). Live URL set to "${res.demoUrl}".`
        });
      }
    } catch (err) {
      setZipUploadMessage({
        text: err instanceof Error ? err.message : 'ZIP upload failed',
        error: true
      });
    } finally {
      setUploadingZip(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!entry.tags?.includes(trimmed)) {
      setEntry((prev) => ({ ...prev, tags: [...(prev.tags || []), trimmed] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEntry((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tagToRemove) || []
    }));
  };

  // Content Blocks
  const blocks = (entry.content?.blocks as ContentBlock[]) || [];

  const addBlock = (type: string) => {
    const id = `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    let newBlock: any;

    switch (type) {
      case 'heading':
        newBlock = { id, type: 'heading', level: 2, text: 'New Section Heading' };
        break;
      case 'paragraph':
        newBlock = { id, type: 'paragraph', text: 'Enter your editorial narrative and paragraph content here...' };
        break;
      case 'quote':
        newBlock = {
          id,
          type: 'blockquote',
          text: '“High quality editorial cadence requires intentional design tokens and structured workflows.”',
          citation: 'Editorial Principles'
        };
        break;
      case 'button':
        newBlock = { id, type: 'button', text: 'Discover More', url: '#', variant: 'primary', target: '_self' };
        break;
      case 'callout':
        newBlock = {
          id,
          type: 'callout',
          variant: 'info',
          title: 'Architectural Directive',
          text: 'Maintain strict separation of presentation tokens and markdown persistence.'
        };
        break;
      case 'divider':
        newBlock = { id, type: 'divider' };
        break;
      case 'image':
        newBlock = { id, type: 'image', url: '', alt: '', caption: 'Figure 1: Architectural diagram' };
        break;
      default:
        newBlock = { id, type: 'paragraph', text: '' };
        break;
    }

    const nextBlocks = [...blocks, newBlock];
    setEntry((prev) => ({ ...prev, content: { blocks: nextBlocks } }));
    pushHistory({ ...entry, content: { blocks: nextBlocks } });
  };

  const updateBlock = (id: string, text: string) => {
    const nextBlocks = blocks.map((b) => (b.id === id ? { ...b, text } : b));
    setEntry((prev) => ({ ...prev, content: { blocks: nextBlocks } }));
  };

  const removeBlock = (id: string) => {
    const nextBlocks = blocks.filter((b) => b.id !== id);
    setEntry((prev) => ({ ...prev, content: { blocks: nextBlocks } }));
    pushHistory({ ...entry, content: { blocks: nextBlocks } });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    const nextBlocks = [...blocks];
    const target = direction === 'up' ? index - 1 : index + 1;
    const temp = nextBlocks[index];
    nextBlocks[index] = nextBlocks[target];
    nextBlocks[target] = temp;
    setEntry((prev) => ({ ...prev, content: { blocks: nextBlocks } }));
    pushHistory({ ...entry, content: { blocks: nextBlocks } });
  };

  const handleSave = async (publish = false) => {
    if (!entry.title?.trim()) {
      setError('Entry title is required');
      return;
    }
    if (!blueprintSlug) return;

    setSaving(true);
    setError(null);

    const payload = {
      ...entry,
      title: entry.title.trim(),
      slug: entry.slug?.trim() || undefined,
      status: publish ? ('published' as const) : (entry.status || 'draft'),
      data: entry.data || {},
      category: entry.category || 'general',
      tags: entry.tags || [],
      content: entry.content || { blocks: [] }
    };

    try {
      if (isNew) {
        const created = await api.post<BlueprintEntry>(
          `/api/blueprints/${blueprintSlug}/entries`,
          payload
        );
        setToastMessage(`"${created.title}" created successfully!`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        navigate(`/blueprints/${blueprintSlug}/${created.slug}`, { replace: true });
      } else {
        const updated = await api.put<BlueprintEntry>(
          `/api/blueprints/${blueprintSlug}/entries/${entrySlug}`,
          payload
        );
        setEntry(updated);
        setToastMessage(`"${updated.title}" saved successfully!`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
      setShowPublishDropdown(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-3 text-on-surface-variant font-body-sm">
        <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>Loading Studio Canvas...</span>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="p-8 bg-surface-container-lowest border border-surface-container-high/60 rounded-2xl text-center space-y-4 max-w-md shadow-sm">
          <span className="material-symbols-outlined text-4xl text-error">error</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Blueprint Not Found</h2>
          <Link
            to="/blueprints/studio"
            className="inline-flex items-center gap-2 font-label-md text-label-md font-semibold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Return to Blueprint Studio</span>
          </Link>
        </div>
      </div>
    );
  }

  const IconComp = getBlueprintIcon(blueprint.icon);

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased flex flex-col">
      {/* Top Studio Stage Bar */}
      <header className="h-14 bg-surface-container-lowest border-b border-surface-container-high/40 px-5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        {/* Left: Brand, collection breadcrumb, title & autosave */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            title="Planfo CMS Home"
            className="hidden sm:flex items-center justify-center p-1 rounded-lg hover:bg-surface-container transition-transform hover:scale-105 shrink-0"
          >
            <PlanfoLogo variant="icon" className="h-6 w-auto" />
          </Link>

          <Link
            to={`/blueprints/${blueprint.slug}`}
            className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
            title={`Back to ${blueprint.name}`}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>

          <div className="flex items-center gap-2 text-body-sm min-w-0">
            <Link
              to="/blueprints/studio"
              className="text-on-surface-variant hover:text-primary transition-colors truncate hidden sm:inline"
            >
              Blueprints
            </Link>
            <span className="text-outline-variant select-none hidden sm:inline">/</span>
            <Link
              to={`/blueprints/${blueprint.slug}`}
              className="text-on-surface-variant hover:text-primary transition-colors truncate"
            >
              {blueprint.name}
            </Link>
            <span className="text-outline-variant select-none">/</span>
            <span className="font-title-sm text-title-sm font-semibold text-on-surface truncate max-w-[200px]">
              {entry.title || `New ${blueprint.singularName}`}
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
              onClick={() => setViewportMode('desktop')}
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
              onClick={() => setViewportMode('mobile')}
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
          <a
            href={`/blueprints/${blueprint.slug}/${entry.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-surface-container-high/60 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span className="hidden sm:inline">Preview</span>
          </a>

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
              <span>{entry.status === 'published' ? 'Update Live' : `Publish ${blueprint.singularName}`}</span>
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
                  onClick={() => handleSave(true)}
                  className="w-full px-4 py-2 text-left font-label-sm text-label-sm text-primary font-semibold hover:bg-surface-container flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">publish</span>
                  <span>Publish Immediately</span>
                </button>
              </div>
            )}
          </div>

          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
            {user?.name?.[0] || 'A'}
          </div>
        </div>
      </header>

      {/* Main Studio 3-Panel Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* PANEL 1: Left Floating Block Composer Palette */}
        {blueprint.hasContentEditor && (
          <aside className="w-64 border-r border-surface-container-high/40 bg-surface-container-lowest/80 backdrop-blur-xs p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-label-xs text-label-xs font-bold uppercase tracking-wider text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[18px]">widgets</span>
                  <span>Insert Blocks</span>
                </div>
                <span className="font-code text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  8 Available
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant">
                Click or drag blocks onto the manuscript paper canvas.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => addBlock('heading')}
                  className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high/40 text-left transition-colors flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-lg text-primary">T</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">H1/H2</span>
                  </div>
                  <span className="font-label-xs text-[11px] font-semibold text-on-surface group-hover:text-primary">
                    Headings
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => addBlock('paragraph')}
                  className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high/40 text-left transition-colors flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-lg text-primary">¶</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">P</span>
                  </div>
                  <span className="font-label-xs text-[11px] font-semibold text-on-surface group-hover:text-primary">
                    Paragraph
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => addBlock('image')}
                  className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high/40 text-left transition-colors flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="material-symbols-outlined text-[20px] text-primary">image</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">IMG</span>
                  </div>
                  <span className="font-label-xs text-[11px] font-semibold text-on-surface group-hover:text-primary">
                    Media Frame
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => addBlock('quote')}
                  className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high/40 text-left transition-colors flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="material-symbols-outlined text-[20px] text-primary">format_quote</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">QUOTE</span>
                  </div>
                  <span className="font-label-xs text-[11px] font-semibold text-on-surface group-hover:text-primary">
                    Pull Quote
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => addBlock('button')}
                  className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high/40 text-left transition-colors flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="material-symbols-outlined text-[20px] text-primary">smart_button</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">CTA</span>
                  </div>
                  <span className="font-label-xs text-[11px] font-semibold text-on-surface group-hover:text-primary">
                    CTA Button
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => addBlock('callout')}
                  className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high/40 text-left transition-colors flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="material-symbols-outlined text-[20px] text-primary">info</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">NOTE</span>
                  </div>
                  <span className="font-label-xs text-[11px] font-semibold text-on-surface group-hover:text-primary">
                    Callout Note
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => addBlock('divider')}
                  className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high/40 text-left transition-colors flex flex-col gap-1 group col-span-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="material-symbols-outlined text-[20px] text-primary">horizontal_rule</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">HR</span>
                  </div>
                  <span className="font-label-xs text-[11px] font-semibold text-on-surface group-hover:text-primary">
                    Hairline Divider
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-container-high/40 flex items-center justify-between font-code text-[11px] text-on-surface-variant">
              <span>Collection Schema</span>
              <span className="text-primary font-semibold">/{blueprint.slug}</span>
            </div>
          </aside>
        )}

        {/* PANEL 2: Center Manuscript Paper Canvas */}
        <main className="flex-1 overflow-y-auto bg-surface-container-low/40 p-6 md:p-10 flex flex-col items-center">
          <div
            style={{
              maxWidth: viewportMode === 'mobile' ? '380px' : `${canvasWidth}px`,
              paddingTop: `${canvasPadding}px`,
              paddingBottom: `${canvasPadding}px`
            }}
            className="w-full bg-white shadow-xl rounded-2xl p-8 md:p-14 border border-surface-container-high/40 transition-all duration-300 min-h-[850px] flex flex-col justify-between"
          >
            <div className="space-y-6">
              {/* Category, Status & Metadata pill */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-container-high/40 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-xs text-label-xs font-bold uppercase">
                    {blueprint.singularName}
                  </span>
                  {entry.category && (
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container font-label-xs text-label-xs font-semibold text-on-surface capitalize">
                      {entry.category}
                    </span>
                  )}
                </div>
                <span className="font-code text-code text-[11px] text-on-surface-variant">
                  /{blueprint.slug}/{entry.slug || 'slug-preview'}
                </span>
              </div>

              {/* Editable Headline */}
              <div>
                <input
                  type="text"
                  value={entry.title || ''}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={`Enter ${blueprint.singularName.toLowerCase()} title...`}
                  className="w-full font-serif font-bold text-3xl md:text-5xl text-on-surface tracking-tight border-none outline-none focus:ring-0 placeholder:text-on-surface-variant/30 bg-transparent p-0"
                />
              </div>

              {/* Subtitle / Excerpt */}
              <div>
                <textarea
                  rows={2}
                  value={entry.excerpt || ''}
                  onChange={(e) => setEntry((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Enter a brief summary or introductory blurb..."
                  className="w-full font-body-lg text-body-lg text-on-surface-variant/80 border-none outline-none focus:ring-0 placeholder:text-on-surface-variant/30 bg-transparent p-0 resize-none font-serif italic"
                />
              </div>

              {/* Featured Image display */}
              {entry.featuredImage && (
                <div className="rounded-xl overflow-hidden border border-surface-container-high/40 shadow-sm aspect-video bg-surface-container relative group">
                  <img src={getMediaUrl(entry.featuredImage)} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveImageField(null);
                        setShowMediaPicker(true);
                      }}
                      className="px-3 py-1.5 bg-white text-on-surface font-label-xs font-bold rounded-lg shadow-sm"
                    >
                      Change Hero Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntry((prev) => ({ ...prev, featuredImage: '' }))}
                      className="px-3 py-1.5 bg-error text-white font-label-xs font-bold rounded-lg shadow-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Blueprint Custom Fields Showcase Block */}
              {blueprint.fields.length > 0 && (
                <div className="p-5 rounded-2xl bg-surface-container-low/60 border border-surface-container-high/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
                      <span className="font-title-sm text-title-sm font-semibold text-on-surface">
                        {blueprint.singularName} Attributes
                      </span>
                    </div>
                    <span className="font-label-xs text-label-xs text-on-surface-variant font-medium">
                      {blueprint.fields.length} Custom Fields
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {blueprint.fields.map((fld) => {
                      const val = entry.data?.[fld.name];
                      return (
                        <div key={fld.id} className="p-3 bg-white rounded-xl border border-surface-container-high/40 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-label-xs text-[11px] font-semibold text-on-surface-variant uppercase">
                              {fld.label}
                            </span>
                            <span className="font-code text-[10px] text-primary">{fld.type}</span>
                          </div>
                          <div className="font-body-sm text-on-surface font-medium truncate">
                            {val !== undefined && val !== null && String(val) !== '' ? (
                              fld.type === 'boolean' ? (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${val ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                                  {val ? 'Yes' : 'No'}
                                </span>
                              ) : fld.type === 'url' ? (
                                <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-code text-xs">
                                  {String(val)}
                                </a>
                              ) : (
                                String(val)
                              )
                            ) : (
                              <span className="text-outline-variant italic">Not configured</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Content Blocks on the Paper */}
              {blocks.map((blk, idx) => (
                <div
                  key={blk.id}
                  className="group relative p-4 rounded-xl border border-transparent hover:border-primary/40 hover:bg-surface-container-low/30 transition-all space-y-2"
                >
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white shadow-sm border border-surface-container-high/40 rounded-lg p-1 z-10">
                    <button
                      type="button"
                      onClick={() => moveBlock(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 hover:bg-surface-container rounded text-on-surface-variant disabled:opacity-30"
                      title="Move up"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(idx, 'down')}
                      disabled={idx === blocks.length - 1}
                      className="p-1 hover:bg-surface-container rounded text-on-surface-variant disabled:opacity-30"
                      title="Move down"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(blk.id)}
                      className="p-1 hover:bg-error-container hover:text-error rounded text-on-surface-variant"
                      title="Delete block"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>

                  {blk.type === 'heading' && (
                    <input
                      type="text"
                      value={blk.text || ''}
                      onChange={(e) => updateBlock(blk.id, e.target.value)}
                      className="w-full font-serif font-bold text-2xl md:text-3xl text-on-surface border-none outline-none bg-transparent p-0"
                    />
                  )}

                  {blk.type === 'paragraph' && (
                    <textarea
                      rows={3}
                      value={blk.text || ''}
                      onChange={(e) => updateBlock(blk.id, e.target.value)}
                      className="w-full font-body-md text-body-md text-on-surface leading-relaxed border-none outline-none bg-transparent p-0 resize-none"
                    />
                  )}

                  {blk.type === 'blockquote' && (
                    <div className="border-l-4 border-primary pl-4 py-1 italic font-serif text-lg text-on-surface/90">
                      <textarea
                        rows={2}
                        value={blk.text || ''}
                        onChange={(e) => updateBlock(blk.id, e.target.value)}
                        className="w-full border-none outline-none bg-transparent p-0 resize-none font-serif italic text-lg"
                      />
                    </div>
                  )}

                  {blk.type === 'callout' && (
                    <div className="p-4 rounded-xl bg-surface-container border border-surface-container-high/60 space-y-1">
                      <span className="font-label-sm font-bold text-primary block">{blk.title || 'Note'}</span>
                      <textarea
                        rows={2}
                        value={blk.text || ''}
                        onChange={(e) => updateBlock(blk.id, e.target.value)}
                        className="w-full font-body-sm text-on-surface border-none outline-none bg-transparent p-0 resize-none"
                      />
                    </div>
                  )}

                  {blk.type === 'button' && (
                    <div className="py-2">
                      <button
                        type="button"
                        className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md font-semibold shadow-xs"
                      >
                        {blk.text || 'CTA Button'}
                      </button>
                    </div>
                  )}

                  {blk.type === 'divider' && <hr className="border-surface-container-high/60 my-4" />}
                </div>
              ))}
            </div>

            {/* Bottom Paper Footer */}
            <div className="pt-8 border-t border-surface-container-high/40 flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant font-body-sm mt-8">
              <div className="flex items-center gap-2">
                <span>Tags:</span>
                {entry.tags && entry.tags.length > 0 ? (
                  entry.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-surface-container font-mono text-[11px] text-primary">
                      #{t}
                    </span>
                  ))
                ) : (
                  <span className="italic">No tags</span>
                )}
              </div>
              <span className="font-code text-[11px]">Planfo CMS Editorial Studio</span>
            </div>
          </div>
        </main>

        {/* PANEL 3: Right Inspector Rail */}
        <aside className="w-80 border-l border-surface-container-high/40 bg-surface-container-lowest flex flex-col justify-between shrink-0 overflow-y-auto">
          <div>
            {/* Inspector Tabs */}
            <div className="p-2 border-b border-surface-container-high/40 flex items-center gap-1 bg-surface-container-low/40">
              <button
                type="button"
                onClick={() => setActiveTab('attributes')}
                className={`flex-1 py-1.5 rounded-lg text-label-xs font-semibold text-center transition-colors ${
                  activeTab === 'attributes'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Attributes & Media
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={`flex-1 py-1.5 rounded-lg text-label-xs font-semibold text-center transition-colors ${
                  activeTab === 'seo'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                SEO & Social
              </button>
            </div>

            <div className="p-5 space-y-6">
              {activeTab === 'attributes' ? (
                <>
                  {/* Hero Image Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-label-xs text-label-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Hero & Showcase Media
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">image</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={entry.featuredImage || ''}
                          onChange={(e) => setEntry((prev) => ({ ...prev, featuredImage: e.target.value }))}
                          placeholder="/media/image.jpg"
                          className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3 py-1.5 font-code text-code text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setActiveImageField(null);
                            setShowMediaPicker(true);
                          }}
                          className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                        >
                          <span className="material-symbols-outlined text-[16px]">folder_open</span>
                        </button>
                      </div>

                      {entry.featuredImage && (
                        <div className="aspect-video bg-surface-container rounded-xl overflow-hidden border border-surface-container-high/40 relative group shadow-2xs">
                          <img src={getMediaUrl(entry.featuredImage)} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setEntry((prev) => ({ ...prev, featuredImage: '' }))}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-error text-white rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Schema Fields Editor */}
                  {blueprint.fields.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-surface-container-high/40">
                      <span className="font-label-xs text-label-xs font-bold uppercase tracking-wider text-on-surface-variant block">
                        Schema Properties ({blueprint.fields.length})
                      </span>

                      {zipUploadMessage && (
                        <div
                          className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                            zipUploadMessage.error ? 'bg-error-container/40 text-error' : 'bg-surface-container text-primary font-semibold'
                          }`}
                        >
                          <span>{zipUploadMessage.text}</span>
                          <button type="button" onClick={() => setZipUploadMessage(null)}>
                            ✕
                          </button>
                        </div>
                      )}

                      {blueprint.fields.map((fld) => {
                        const val = entry.data?.[fld.name] ?? '';
                        return (
                          <div key={fld.id} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="font-label-xs text-label-xs font-semibold text-on-surface">
                                {fld.label} {fld.required && <span className="text-error">*</span>}
                              </label>
                              <span className="font-code text-[10px] text-on-surface-variant">({fld.type})</span>
                            </div>

                            {fld.type === 'text' && (
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                                placeholder={fld.placeholder || ''}
                                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3 py-1.5 font-body-sm text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            )}

                            {fld.type === 'number' && (
                              <input
                                type="number"
                                value={val}
                                onChange={(e) => handleCustomFieldChange(fld.name, e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder={fld.placeholder || '0'}
                                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3 py-1.5 font-body-sm text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            )}

                            {fld.type === 'boolean' && (
                              <label className="flex items-center gap-2 cursor-pointer py-1">
                                <input
                                  type="checkbox"
                                  checked={Boolean(val)}
                                  onChange={(e) => handleCustomFieldChange(fld.name, e.target.checked)}
                                  className="w-4 h-4 text-primary rounded border-surface-container-high focus:ring-primary"
                                />
                                <span className="font-body-sm text-xs text-on-surface font-medium">Active / Enabled</span>
                              </label>
                            )}

                            {fld.type === 'date' && (
                              <input
                                type="date"
                                value={val}
                                onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3 py-1.5 font-body-sm text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            )}

                            {fld.type === 'url' && (
                              <div className="space-y-1.5">
                                <input
                                  type="url"
                                  value={val}
                                  onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                                  placeholder={fld.placeholder || 'https://...'}
                                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3 py-1.5 font-code text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                {fld.name.toLowerCase().includes('demo') && (
                                  <div>
                                    <input
                                      type="file"
                                      accept=".zip"
                                      id={`zip-${fld.name}`}
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleDemoZipUpload(fld.name, file);
                                      }}
                                    />
                                    <label
                                      htmlFor={`zip-${fld.name}`}
                                      className="cursor-pointer text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">cloud_upload</span>
                                      <span>{uploadingZip ? 'Extracting...' : 'Upload Demo .ZIP bundle'}</span>
                                    </label>
                                  </div>
                                )}
                              </div>
                            )}

                            {fld.type === 'select' && (
                              <select
                                value={val}
                                onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3 py-1.5 font-body-sm text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="">Select option...</option>
                                {fld.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                            {fld.type === 'email' && (
                              <input
                                type="email"
                                value={val}
                                onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                                placeholder="user@example.com"
                                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3 py-1.5 font-code text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Taxonomy */}
                  {(blueprint.hasCategories || blueprint.hasTags) && (
                    <div className="space-y-3 pt-4 border-t border-surface-container-high/40">
                      <span className="font-label-xs text-label-xs font-bold uppercase tracking-wider text-on-surface-variant block">
                        Taxonomy
                      </span>

                      {blueprint.hasCategories && (
                        <div className="space-y-1">
                          <label className="font-label-xs text-label-xs text-on-surface-variant">Category</label>
                          <input
                            type="text"
                            value={entry.category || ''}
                            onChange={(e) => setEntry((prev) => ({ ...prev, category: e.target.value }))}
                            placeholder="e.g. general, case-studies"
                            className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3 py-1.5 font-body-sm text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      )}

                      {blueprint.hasTags && (
                        <div className="space-y-1.5">
                          <label className="font-label-xs text-label-xs text-on-surface-variant">Tags</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddTag();
                                }
                              }}
                              placeholder="Add tag and press Enter"
                              className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3 py-1.5 font-body-sm text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <button
                              type="button"
                              onClick={handleAddTag}
                              className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-semibold shrink-0"
                            >
                              Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {entry.tags?.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container font-label-xs text-label-xs text-on-surface"
                              >
                                <span>#{t}</span>
                                <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-error">
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Canvas & Spacing controls */}
                  <div className="space-y-3 pt-4 border-t border-surface-container-high/40">
                    <span className="font-label-xs text-label-xs font-bold uppercase tracking-wider text-on-surface-variant block">
                      Canvas Spacing
                    </span>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-on-surface-variant">Max Column Width</span>
                        <span className="font-mono text-primary font-semibold">{canvasWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="540"
                        max="880"
                        step="20"
                        value={canvasWidth}
                        onChange={(e) => setCanvasWidth(Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* SEO & Social Tab */
                <div className="space-y-4">
                  <SEOFields
                    seo={
                      (entry.seo as SEO) || {
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
                    onChange={(seo) => setEntry((prev) => ({ ...prev, seo }))}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-surface-container-high/40 bg-surface-container-low/30">
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="w-full py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.01]"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Save Changes</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Floating Save Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-surface px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 font-label-md text-label-md animate-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPickerModal
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(url) => {
            if (activeImageField) {
              handleCustomFieldChange(activeImageField, url);
              setActiveImageField(null);
            } else {
              setEntry((prev) => ({ ...prev, featuredImage: url }));
            }
            setShowMediaPicker(false);
          }}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Post, Category, RevisionMeta, ContentBlock, SEO } from '@cms/schemas';
import { api } from '../../api/client.js';
import { MediaPickerModal } from '../../components/Media/MediaPickerModal.js';
import { slugify } from '../../utils/slugify.js';
import { useAuth } from '../../context/AuthContext.js';
import { useSidebar } from '../../context/SidebarContext.js';
import { ProfileDropdown } from '../../components/UI/ProfileDropdown.js';
import { SidebarRail } from '../../components/Layout/SidebarRail.js';

// Default block templates for all supported ContentBlock types
const createDefaultBlock = (type: string): ContentBlock => {
  const id = `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case 'heading':
      return { id, type: 'heading', level: 1, text: 'New Section Heading' };
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
        citation: '— Systems Manifesto, Vol. IV • Design Principles'
      };
    case 'image':
      return {
        id,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        alt: 'Geometric modern architectural study in soft ambient light',
        caption: 'Fig 1.1: Geometric modulation and structural whitespace in modern architecture.'
      };
    case 'list':
      return {
        id,
        type: 'list',
        style: 'unordered',
        items: [
          'Cadence over Clutter: lock vertical margins strictly to modular line-height multiples.',
          'Intentional Tokens: colors express semantic role hierarchy, never decorative mood boards.',
          'Adaptive Shells: decouple reading columns from dynamic auxiliary toolchains.'
        ]
      };
    case 'table':
      return {
        id,
        type: 'table',
        headers: ['Metric Parameter', 'Baseline Legacy', 'Editorial Studio Standard'],
        rows: [
          ['Typographic Measure', '960px Fluid Stretch', '720px Clamped Optimal'],
          ['Typeface Pairing', 'Single System Sans', 'Newsreader Serif + Inter Sans'],
          ['Rendering Latency', '45ms Hydration', '< 12ms Pure Static Edge']
        ]
      };
    case 'button':
      return {
        id,
        type: 'button',
        text: 'Subscribe to Dispatch',
        url: '#',
        variant: 'primary',
        target: '_self'
      };
    case 'code':
      return {
        id,
        type: 'code',
        language: 'typescript',
        code: `// Systems Manifesto Token Definition\nexport const designSystem = {\n  rhythm: '4px-grid',\n  measure: '720px',\n  contrast: 'WCAG AAA'\n};`
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
            badge: '#primary',
            title: 'Cadence over Clutter',
            text: 'Lock all vertical margins strictly to modular line-height multiples.',
            buttonText: '',
            buttonUrl: ''
          },
          {
            id: `item_2_${Date.now()}`,
            icon: '02',
            badge: '#secondary',
            title: 'Intentional Tokens',
            text: 'Colors express semantic role hierarchy, never decorative mood boards.',
            buttonText: '',
            buttonUrl: ''
          },
          {
            id: `item_3_${Date.now()}`,
            icon: '03',
            badge: '#tertiary',
            title: 'Adaptive Shells',
            text: 'Decouple reading columns from dynamic auxiliary toolchains.',
            buttonText: '',
            buttonUrl: ''
          }
        ]
      };
    default:
      return { id, type: 'paragraph', text: 'New content block' };
  }
};

export const PostEdit: React.FC = () => {
  const { mainPaddingClass } = useSidebar();
  const { slug } = useParams<{ slug?: string }>();
  const isNew = !slug || slug === 'new';
  const navigate = useNavigate();
  const { user, can } = useAuth();

  // Core Post Data
  const [post, setPost] = useState<Partial<Post>>({
    title: '',
    slug: '',
    excerpt: '',
    author: user?.name || user?.email || '',
    category: 'general',
    tags: [],
    status: 'draft',
    template: 'default',
    content: { blocks: [] },
    featuredImage: '',
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

  // Editor Workspace State
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>(isNew ? 'Unsaved draft' : 'Synced');
  const [activeInspectorTab, setActiveInspectorTab] = useState<'settings' | 'seo'>('settings');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'featured' | 'new' | string>('featured');
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showBlockPalette, setShowBlockPalette] = useState(true);

  // History Stack for Undo/Redo
  const [history, setHistory] = useState<Array<ContentBlock[]>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Revisions Modal
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState<RevisionMeta[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  const manuscriptRef = useRef<HTMLDivElement>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger feedback toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const updateSEO = (updates: Partial<SEO>) => {
    setPost((prev) => ({
      ...prev,
      seo: {
        title: prev.seo?.title || '',
        description: prev.seo?.description || '',
        canonical: prev.seo?.canonical || '',
        ogTitle: prev.seo?.ogTitle || '',
        ogDescription: prev.seo?.ogDescription || '',
        ogImage: prev.seo?.ogImage || '',
        robots: prev.seo?.robots || 'index,follow',
        noIndex: prev.seo?.noIndex || false,
        ...updates
      }
    }));
  };

  // Push to history for undo/redo
  const commitBlocks = useCallback((newBlocks: ContentBlock[]) => {
    setPost((prev) => ({ ...prev, content: { blocks: newBlocks } }));
    setSaveStatus('Unsaved changes');

    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      const nextHistory = [...sliced, newBlocks];
      if (nextHistory.length > 30) nextHistory.shift();
      return nextHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 29));
  }, [historyIndex]);

  // Load Categories
  const loadCategories = async () => {
    try {
      const data = await api.get<Category[]>('/api/categories?type=post');
      if (Array.isArray(data)) setCategories(data);
    } catch {
      // Graceful fallback
    }
  };

  // Load Post by slug
  const loadPost = async (postSlug: string) => {
    setLoading(true);
    try {
      const data = await api.get<Post>(`/api/posts/${postSlug}`);
      setPost(data);
      const blks = data.content?.blocks || [];
      setHistory([blks]);
      setHistoryIndex(0);
      setSaveStatus('Auto-synced just now');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  // Initialize or fetch post
  useEffect(() => {
    loadCategories();
    if (!isNew && slug) {
      loadPost(slug);
    } else {
      setHistory([[]]);
      setHistoryIndex(0);
    }
  }, [slug, isNew]);

  // Handle Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const targetBlocks = history[newIndex];
      setPost((prev) => ({ ...prev, content: { blocks: targetBlocks } }));
      triggerToast('Undo applied');
    }
  }, [historyIndex, history]);

  // Handle Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const targetBlocks = history[newIndex];
      setPost((prev) => ({ ...prev, content: { blocks: targetBlocks } }));
      triggerToast('Redo applied');
    }
  }, [historyIndex, history]);

  // Block Operations
  const insertBlock = (type: string, atIndex?: number) => {
    const newBlock = createDefaultBlock(type);
    const blocks = [...(post.content?.blocks || [])];

    if (typeof atIndex === 'number' && atIndex >= 0) {
      blocks.splice(atIndex + 1, 0, newBlock);
    } else {
      blocks.push(newBlock);
    }

    commitBlocks(blocks);
    setSelectedBlockId(newBlock.id);
    triggerToast(`Inserted ${type} block`);
  };

  const updateBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    const blocks = (post.content?.blocks || []).map((b) => {
      if (b.id === blockId) {
        return { ...b, ...updates } as ContentBlock;
      }
      return b;
    });
    commitBlocks(blocks);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const blocks = [...(post.content?.blocks || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const [moved] = blocks.splice(index, 1);
    blocks.splice(targetIndex, 0, moved);
    commitBlocks(blocks);
  };

  const duplicateBlock = (index: number) => {
    const blocks = [...(post.content?.blocks || [])];
    const original = blocks[index];
    const clone = {
      ...original,
      id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    } as ContentBlock;
    blocks.splice(index + 1, 0, clone);
    commitBlocks(blocks);
    triggerToast('Block duplicated');
  };

  const deleteBlock = (blockId: string) => {
    const blocks = (post.content?.blocks || []).filter((b) => b.id !== blockId);
    commitBlocks(blocks);
    if (selectedBlockId === blockId) setSelectedBlockId(null);
    triggerToast('Block removed');
  };

  // Save / Publish
  const handleSave = async (publish = false) => {
    if (!post.title?.trim()) {
      triggerToast('Post title is required');
      return;
    }

    setSaving(true);
    setSaveStatus('Saving to filesystem...');

    const targetStatus = publish ? 'published' : post.status || 'draft';
    const postSlug = post.slug?.trim() || slugify(post.title);

    const payload: Partial<Post> = {
      ...post,
      slug: postSlug,
      status: targetStatus
    };

    try {
      if (isNew) {
        const created = await api.post<Post>('/api/posts', payload);
        triggerToast('Post created successfully!');
        setSaveStatus('Auto-synced just now');
        navigate(`/posts/${created.slug}`, { replace: true });
      } else {
        const updated = await api.put<Post>(`/api/posts/${slug}`, payload);
        setPost(updated);
        setSaveStatus('Auto-synced just now');
        triggerToast(publish ? 'Post published successfully!' : 'Draft saved to filesystem');
        if (updated.slug !== slug) {
          navigate(`/posts/${updated.slug}`, { replace: true });
        }
      }
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Save failed');
      setSaveStatus('Save error');
    } finally {
      setSaving(false);
      setShowPublishMenu(false);
    }
  };

  // Debounced Autosave for existing posts
  useEffect(() => {
    if (isNew || !slug || !post.title?.trim()) return;
    if (saveStatus !== 'Unsaved changes') return;

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);

    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus('Auto-saving...');
        const payload: Partial<Post> = {
          ...post,
          slug: post.slug?.trim() || slugify(post.title || ''),
          status: post.status || 'draft'
        };
        const updated = await api.put<Post>(`/api/posts/${slug}`, payload);
        setPost(updated);
        setSaveStatus('Auto-synced just now');
      } catch {
        setSaveStatus('Unsaved changes');
      }
    }, 3000);

    return () => {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [post, slug, isNew, saveStatus]);

  // Global Keyboard Shortcuts (Cmd+S, Cmd+Z, Cmd+Y, Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave(false);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowBlockPalette((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, post]);

  // Revisions
  const loadRevisions = async () => {
    if (isNew || !slug) return;
    setLoadingRevisions(true);
    try {
      const data = await api.get<RevisionMeta[]>(`/api/posts/${slug}/revisions`);
      if (Array.isArray(data)) setRevisions(data);
    } catch {
      // Graceful fallback
    } finally {
      setLoadingRevisions(false);
    }
  };

  const restoreRevision = async (revId: string) => {
    if (!slug) return;
    if (!confirm('Restore this revision to the manuscript?')) return;

    try {
      const restored = await api.post<Post>(`/api/posts/${slug}/revisions/${revId}/restore`);
      setPost(restored);
      setShowRevisions(false);
      triggerToast('Revision restored successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  // Compute stats (word count, read time)
  const computeStats = () => {
    const textBlocks = (post.content?.blocks || [])
      .map((b: any) => b.text || b.citation || (Array.isArray(b.items) ? b.items.join(' ') : ''))
      .join(' ');
    const fullText = `${post.title || ''} ${post.excerpt || ''} ${textBlocks}`;
    const words = fullText.trim().split(/\s+/).filter(Boolean).length;
    const chars = fullText.length;
    const readTimeMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readTimeMinutes };
  };

  const stats = computeStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-on-surface-variant font-label-md gap-3">
        <span className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>Loading Editorial Studio Manuscript...</span>
      </div>
    );
  }

  const blocks = post.content?.blocks || [];
  const activeBlock = blocks.find((b) => b.id === selectedBlockId);
  const activeBlockIndex = activeBlock ? blocks.findIndex((b) => b.id === selectedBlockId) : -1;

  return (
    <div className="h-screen bg-surface text-on-surface font-body-md antialiased flex overflow-hidden relative select-text">
      {/* Toast Notification */}
      <div
        className={`fixed bottom-8 right-8 z-50 transform transition-all duration-300 pointer-events-none flex items-center gap-3 px-5 py-3.5 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
        }`}
      >
        <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
        <span className="font-label-md text-label-md font-semibold tracking-wide">{toastMessage}</span>
      </div>

      {/* Global 64px Left Icon Rail Navigation */}
      <SidebarRail />

      {/* Main Studio Viewport with dynamic sidebar padding */}
      <div className={`${mainPaddingClass} flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out`}>
        {/* Top Header Bar */}
        <header className="h-16 shrink-0 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-high/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40">
          <div className="h-16 w-full px-6 flex items-center justify-between gap-4">
            {/* Breadcrumb Hierarchy */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-label-md text-label-md text-on-surface font-semibold tracking-normal shrink-0">
                Editorial Studio
              </span>
              <span className="text-outline-variant font-body-sm text-body-sm select-none">/</span>
              <Link
                to="/posts"
                className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface cursor-pointer truncate"
              >
                Chronicles
              </Link>
              <span className="text-outline-variant select-none font-body-sm text-body-sm">/</span>
              <span className="font-label-md text-label-md text-on-surface truncate max-w-xs font-medium">
                {post.title || 'Untitled Manuscript'}
              </span>

              <span className="px-2.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-medium shrink-0">
                {post.status === 'published' ? 'Published' : 'Draft Saved'}
              </span>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Live Preview Button */}
              {!isNew && (
                <a
                  href={`/api/preview/post/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  <span>Preview</span>
                </a>
              )}

              {/* Split Publish & Save Button */}
              <div className="relative inline-flex rounded-lg bg-primary text-on-primary shadow-sm">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(post.status === 'published')}
                  className="px-4 py-1.5 font-label-md text-label-md text-on-primary font-medium hover:bg-primary-container transition-colors rounded-l-lg flex items-center gap-1.5"
                >
                  {saving ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">save</span>
                  )}
                  <span>{post.status === 'published' ? 'Update Post' : 'Save Draft'}</span>
                </button>

                <div className="w-px bg-primary-container self-stretch" />

                <button
                  type="button"
                  onClick={() => setShowPublishMenu(!showPublishMenu)}
                  className="px-2 py-1.5 hover:bg-primary-container transition-colors rounded-r-lg flex items-center justify-center"
                  title="Publish options"
                >
                  <span className="material-symbols-outlined text-[18px]">expand_more</span>
                </button>

                {showPublishMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xl p-2 z-50 space-y-1 text-on-surface">
                    <button
                      type="button"
                      onClick={() => handleSave(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container-low font-label-md text-label-md text-left transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">draft</span>
                      <span>Save as Draft</span>
                    </button>
                    {can('posts.publish') && (
                      <button
                        type="button"
                        onClick={() => handleSave(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md text-left transition-colors font-semibold"
                      >
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        <span>Publish Live Now</span>
                      </button>
                    )}
                    {!isNew && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowPublishMenu(false);
                          setShowRevisions(true);
                          loadRevisions();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container-low font-label-md text-label-md text-left transition-colors border-t border-outline-variant/20 pt-2"
                      >
                        <span className="material-symbols-outlined text-[18px] text-primary">history</span>
                        <span>Revision History</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <ProfileDropdown />
            </div>
          </div>
        </header>

        {/* Sub-bar: Document Meta, Presets & Quick Actions */}
        <div className="shrink-0 bg-surface-container-lowest border-b border-surface-container-high/40 shadow-[0_1px_3px_rgba(19,27,46,0.03)] px-6 py-2 flex items-center justify-between gap-4 z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-on-surface font-body-sm text-body-sm">
              <span className="text-on-surface-variant">Preset:</span>
              <span className="font-label-md text-label-md font-semibold">Longform Editorial</span>
            </div>

            <div className="h-4 w-px bg-surface-container-high hidden sm:block" />

            <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[16px] text-primary">cloud_done</span>
              <span>{saveStatus}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Undo / Redo / Stats */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40"
                title="Undo (Cmd+Z)"
              >
                <span className="material-symbols-outlined text-[18px]">undo</span>
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40"
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
        </div>

        {/* Three-Panel Post Editor Stage */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative bg-surface">
          {/* PANEL 1: Left Attached Palette: Content Block Composer */}
          {showBlockPalette ? (
            <aside className="w-64 border-r border-surface-container-high/60 bg-surface-container-lowest p-4 flex flex-col justify-between shrink-0 overflow-y-auto transition-all duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">add_circle</span>
                    <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-bold">
                      Insert Blocks
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-code text-[11px]">
                      ⌘K
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBlockPalette(false)}
                      className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors shrink-0"
                      title="Collapse palette"
                    >
                      <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_left</span>
                    </button>
                  </div>
                </div>

                <p className="font-body-sm text-[11px] text-on-surface-variant px-0.5">
                  Click elements to insert directly onto the manuscript surface.
                </p>

              {/* Block Composer Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => insertBlock('heading', activeBlockIndex)}
                  className="flex flex-col items-start gap-1 p-2.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[20px] text-primary group-hover:text-on-primary">
                      title
                    </span>
                    <span className="font-code text-code opacity-60">H1</span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface group-hover:text-on-primary">
                    Heading 1
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => insertBlock('paragraph', activeBlockIndex)}
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
                  onClick={() => {
                    setMediaPickerTarget('new');
                    setShowMediaPicker(true);
                  }}
                  className="flex flex-col items-start gap-1 p-2.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary transition-all text-left group relative"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[20px] text-primary group-hover:text-on-primary">
                      image
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface group-hover:text-on-primary">
                    Media Frame
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => insertBlock('blockquote', activeBlockIndex)}
                  className="flex flex-col items-start gap-1 p-2.5 rounded-lg bg-primary-fixed text-on-primary-fixed shadow-xs text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[20px] text-primary">format_quote</span>
                    <span className="font-label-sm text-label-sm bg-primary text-on-primary px-1 rounded">Active</span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold">Pull Quote</span>
                </button>

                <button
                  type="button"
                  onClick={() => insertBlock('button', activeBlockIndex)}
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
                  onClick={() => insertBlock('code', activeBlockIndex)}
                  className="flex flex-col items-start gap-1 p-2.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[20px] text-primary group-hover:text-on-primary">
                      code_blocks
                    </span>
                    <span className="font-code text-code opacity-60">JS</span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface group-hover:text-on-primary">
                    Code Snippet
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => insertBlock('callout', activeBlockIndex)}
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
                  onClick={() => insertBlock('divider', activeBlockIndex)}
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

                <button
                  type="button"
                  onClick={() => insertBlock('grid', activeBlockIndex)}
                  className="flex flex-col items-start gap-1 p-2.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[20px] text-primary group-hover:text-on-primary">
                      fact_check
                    </span>
                    <span className="font-code text-code opacity-60">3x</span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface group-hover:text-on-primary">
                    Directive Grid
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => insertBlock('list', activeBlockIndex)}
                  className="flex flex-col items-start gap-1 p-2.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="material-symbols-outlined text-[20px] text-primary group-hover:text-on-primary">
                      format_list_bulleted
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface group-hover:text-on-primary">
                    Bullet List
                  </span>
                </button>
              </div>
            </div>

            {/* Live Cursor Pill Indicator */}
            <div className="relative bg-surface-container p-2.5 rounded-lg flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
                <span className="font-label-sm text-label-sm text-on-surface font-medium">
                  {activeBlock ? `Cursor: ${activeBlock.type}` : 'Cursor: Manuscript Root'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest text-primary font-code text-code shadow-xs">
                {activeBlockIndex >= 0 ? `Ln ${activeBlockIndex + 1}` : 'Ln 1'}
              </span>
            </div>
          </aside>
        ) : (
          <div className="w-16 border-r border-surface-container-high/60 bg-surface-container-lowest flex flex-col items-center py-3.5 shrink-0 gap-2 z-20 select-none transition-all duration-300 ease-in-out">
            <button
              type="button"
              onClick={() => setShowBlockPalette(true)}
              className="w-10 h-10 rounded-xl bg-primary-container text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center transition-all shadow-xs group relative"
              title="Expand Insert Blocks (⌘K)"
            >
              <span className="material-symbols-outlined text-[20px]">widgets</span>
              <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60 flex items-center gap-2">
                <span>Expand Insert Blocks</span>
                <span className="font-code text-[10px] text-primary bg-surface-container px-1.5 py-0.5 rounded">⌘K</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setShowBlockPalette(true)}
              className="w-10 h-7 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors"
              title="Expand block palette"
            >
              <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_right</span>
            </button>
            <div className="w-8 h-px bg-surface-container-high/60 my-1" />
            <button
              type="button"
              onClick={() => insertBlock('heading', activeBlockIndex)}
              className="relative group flex items-center justify-center w-10 h-10 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all"
              title="Insert Heading"
            >
              <span className="material-symbols-outlined text-[20px]">title</span>
              <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60">
                Heading (H1/H2)
              </div>
            </button>
            <button
              type="button"
              onClick={() => insertBlock('paragraph', activeBlockIndex)}
              className="relative group flex items-center justify-center w-10 h-10 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all"
              title="Insert Paragraph"
            >
              <span className="material-symbols-outlined text-[20px]">text_fields</span>
              <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60">
                Paragraph
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setMediaPickerTarget('new');
                setShowMediaPicker(true);
              }}
              className="relative group flex items-center justify-center w-10 h-10 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all"
              title="Insert Media"
            >
              <span className="material-symbols-outlined text-[20px]">image</span>
              <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60">
                Media Frame
              </div>
            </button>
            <button
              type="button"
              onClick={() => insertBlock('blockquote', activeBlockIndex)}
              className="relative group flex items-center justify-center w-10 h-10 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all"
              title="Insert Quote"
            >
              <span className="material-symbols-outlined text-[20px]">format_quote</span>
              <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60">
                Pull Quote
              </div>
            </button>
          </div>
        )}

          {/* PANEL 2: Center Stage: Editorial Manuscript Canvas with 24px side padding and inner scroll */}
          <main className="flex-1 h-full overflow-y-auto px-6 py-8 flex flex-col items-center justify-start min-h-0 bg-surface">
            <div
              ref={manuscriptRef}
              id="manuscriptPaper"
              style={{
                maxWidth: '100%'
              }}
              className="w-full h-auto shrink-0 bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(19,27,46,0.04),0_12px_36px_-6px_rgba(19,27,46,0.06)] px-8 sm:px-14 py-12 transition-all duration-300 relative group/canvas border border-outline-variant/20 mb-16"
            >
              {/* Hover contextual sheet badge */}
              <div className="absolute -top-3 right-8 flex items-center gap-1 bg-inverse-surface text-inverse-on-surface px-2.5 py-1 rounded-full shadow-lg text-[12px] opacity-0 group-hover/canvas:opacity-100 transition-opacity pointer-events-none">
                <span className="material-symbols-outlined text-[14px]">edit_note</span>
                <span className="font-label-sm text-label-sm">Live Manuscript Canvas</span>
              </div>

              {/* Eyebrow / Masthead Metadata Strip */}
              <header className="mb-6">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="font-label-sm text-label-sm tracking-widest uppercase text-primary font-bold">
                    PRODUCT DISPATCH • {post.category ? post.category.toUpperCase() : 'EDITORIAL'}
                  </span>
                  <span className="font-code text-code text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                    AUTONOMOUS ARCHITECTURE
                  </span>
                </div>

                {/* Inline Editable Article Title */}
                <input
                  type="text"
                  value={post.title || ''}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setPost((prev) => ({
                      ...prev,
                      title: newTitle,
                      slug: isNew ? slugify(newTitle) : prev.slug
                    }));
                    setSaveStatus('Unsaved changes');
                  }}
                  placeholder="Enter Article Headline..."
                  className="w-full font-serif text-[36px] leading-[1.2] font-medium text-on-surface mb-3 tracking-tight bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 -mx-1"
                />

                {/* Inline Editable Subtitle / Excerpt */}
                <textarea
                  rows={2}
                  value={post.excerpt || ''}
                  onChange={(e) => {
                    setPost((prev) => ({ ...prev, excerpt: e.target.value }));
                    setSaveStatus('Unsaved changes');
                  }}
                  placeholder="Write a concise summary or excerpt for this article..."
                  className="w-full text-[17px] text-on-surface-variant italic mb-6 leading-relaxed bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 -mx-1 resize-none"
                />

                {/* Byline Strip with Author Avatar & Date */}
                <div className="flex items-center justify-between py-3 bg-surface-container-low px-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-sm shadow-sm uppercase">
                      {(post.author || user?.name || user?.email || 'A')[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        {post.author || user?.name || user?.email || 'Author'}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant capitalize">
                        {user?.role || 'Editorial Author'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <span>{new Date().toLocaleDateString()} • {stats.readTimeMinutes} min read</span>
                  </div>
                </div>
              </header>

              {/* Hairline Divider */}
              <div className="w-full h-px bg-surface-container-high mb-6" />

              {/* Rendered Block Flow */}
              <article className="space-y-6 text-on-surface">
                {blocks.map((block, idx) => {
                  const isSelected = selectedBlockId === block.id;

                  return (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`relative group/block rounded-lg transition-all p-1 -m-1 ${
                        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-surface-container-low/50'
                      }`}
                    >
                      {/* Floating Block Action Toolbar (on hover or focus) */}
                      <div className="absolute -top-3 right-2 hidden group-hover/block:flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-sm px-1.5 py-0.5 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(idx, 'up');
                          }}
                          disabled={idx === 0}
                          className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                          title="Move Up"
                        >
                          <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(idx, 'down');
                          }}
                          disabled={idx === blocks.length - 1}
                          className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                          title="Move Down"
                        >
                          <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateBlock(idx);
                          }}
                          className="p-1 text-on-surface-variant hover:text-on-surface"
                          title="Duplicate"
                        >
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBlock(block.id);
                          }}
                          className="p-1 text-on-surface-variant hover:text-error"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>

                      {/* Render based on Block Type */}
                      {block.type === 'heading' && (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={block.text || ''}
                            onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                            placeholder="Heading text..."
                            className="w-full font-serif text-on-surface tracking-tight bg-transparent focus:outline-none font-semibold"
                            style={{
                              fontSize: block.level === 1 ? '32px' : block.level === 2 ? '26px' : '21px',
                              lineHeight: '1.25'
                            }}
                          />
                        </div>
                      )}

                      {block.type === 'paragraph' && (
                        <textarea
                          rows={Math.max(2, Math.ceil((block.text || '').length / 65))}
                          value={block.text || ''}
                          onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                          placeholder="Write paragraph..."
                          className="w-full text-[16px] leading-relaxed text-on-surface bg-transparent focus:outline-none resize-none"
                        />
                      )}

                      {block.type === 'image' && (
                        <div className="w-full rounded-xl overflow-hidden bg-surface-container relative shadow-sm my-4">
                          <img
                            src={block.url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'}
                            alt={block.alt || 'Editorial Image'}
                            className="w-full h-72 object-cover"
                          />
                          <div className="p-3 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <input
                              type="text"
                              value={block.caption || ''}
                              onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                              placeholder="Add image caption..."
                              className="font-body-sm text-body-sm text-on-surface-variant bg-transparent focus:outline-none flex-1"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMediaPickerTarget(block.id);
                                  setShowMediaPicker(true);
                                }}
                                className="px-2 py-0.5 rounded bg-surface-container-lowest font-label-xs text-label-xs text-primary shadow-xs"
                              >
                                Replace
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {block.type === 'blockquote' && (
                        <blockquote className="my-6 pl-6 py-2 bg-gradient-to-r from-primary-fixed/30 to-transparent rounded-r-xl relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full" />
                          <textarea
                            rows={2}
                            value={block.text || ''}
                            onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                            placeholder="Enter pull quote..."
                            className="w-full font-serif font-headline-md text-headline-md italic text-on-surface leading-snug bg-transparent focus:outline-none resize-none"
                          />
                          <footer className="mt-2 font-label-md text-label-md text-on-surface-variant not-italic flex items-center gap-2">
                            <input
                              type="text"
                              value={block.citation || ''}
                              onChange={(e) => updateBlock(block.id, { citation: e.target.value })}
                              placeholder="Citation source..."
                              className="font-semibold text-primary bg-transparent focus:outline-none"
                            />
                          </footer>
                        </blockquote>
                      )}

                      {block.type === 'list' && (
                        <div className="my-4 pl-4 space-y-2">
                          {(block.items || []).map((item: string, itemIdx: number) => (
                            <div key={itemIdx} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  const newItems = [...(block.items || [])];
                                  newItems[itemIdx] = e.target.value;
                                  updateBlock(block.id, { items: newItems });
                                }}
                                className="flex-1 bg-transparent text-on-surface focus:outline-none font-body-md"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = (block.items || []).filter((_, i) => i !== itemIdx);
                                  updateBlock(block.id, { items: newItems });
                                }}
                                className="text-on-surface-variant hover:text-error text-xs px-1"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = [...(block.items || []), 'New list item'];
                              updateBlock(block.id, { items: newItems });
                            }}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 pt-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span> Add Item
                          </button>
                        </div>
                      )}

                      {block.type === 'table' && (
                        <div className="my-4 overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-low p-2">
                          <table className="w-full text-left font-body-sm text-body-sm">
                            <thead>
                              <tr className="border-b border-outline-variant/30">
                                {(block.headers || []).map((h: string, hIdx: number) => (
                                  <th key={hIdx} className="p-2 font-semibold text-on-surface">
                                    <input
                                      type="text"
                                      value={h}
                                      onChange={(e) => {
                                        const newHeaders = [...(block.headers || [])];
                                        newHeaders[hIdx] = e.target.value;
                                        updateBlock(block.id, { headers: newHeaders });
                                      }}
                                      className="bg-transparent w-full font-bold focus:outline-none"
                                    />
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(block.rows || []).map((row: string[], rIdx: number) => (
                                <tr key={rIdx} className="border-b border-outline-variant/20 last:border-0">
                                  {row.map((cell: string, cIdx: number) => (
                                    <td key={cIdx} className="p-2">
                                      <input
                                        type="text"
                                        value={cell}
                                        onChange={(e) => {
                                          const newRows = (block.rows || []).map((r, ri) =>
                                            ri === rIdx ? r.map((c, ci) => (ci === cIdx ? e.target.value : c)) : r
                                          );
                                          updateBlock(block.id, { rows: newRows });
                                        }}
                                        className="bg-transparent w-full focus:outline-none"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="pt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newRows = [...(block.rows || []), Array((block.headers || []).length).fill('Cell')];
                                updateBlock(block.id, { rows: newRows });
                              }}
                              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">add</span> Add Row
                            </button>
                          </div>
                        </div>
                      )}

                      {block.type === 'grid' && (
                        <div className="p-6 rounded-xl bg-surface-container-low shadow-[0_1px_4px_rgba(19,27,46,0.02)] space-y-4 my-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
                              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-bold">
                                Key Architectural Takeaways
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-code text-code">
                              3 Directives
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                            {(block.items || []).map((item: any, i: number) => (
                              <div
                                key={item.id || i}
                                className="bg-surface-container-lowest p-3.5 rounded-lg flex flex-col justify-between shadow-xs"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-code text-code text-primary font-bold">
                                      0{i + 1}
                                    </span>
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        i === 0
                                          ? 'bg-secondary'
                                          : i === 1
                                          ? 'bg-secondary-container'
                                          : 'bg-primary'
                                      }`}
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={item.title || ''}
                                    onChange={(e) => {
                                      const newItems = [...(block.items || [])];
                                      newItems[i] = { ...item, title: e.target.value };
                                      updateBlock(block.id, { items: newItems });
                                    }}
                                    placeholder="Takeaway title..."
                                    className="font-label-md text-label-md text-on-surface font-semibold mb-1 w-full bg-transparent focus:outline-none"
                                  />
                                  <textarea
                                    rows={2}
                                    value={item.text || ''}
                                    onChange={(e) => {
                                      const newItems = [...(block.items || [])];
                                      newItems[i] = { ...item, text: e.target.value };
                                      updateBlock(block.id, { items: newItems });
                                    }}
                                    placeholder="Detail takeaway..."
                                    className="font-body-sm text-body-sm text-on-surface-variant w-full bg-transparent focus:outline-none resize-none"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {block.type === 'code' && (
                        <div className="rounded-xl bg-surface-container-highest p-4 font-code text-code my-4 overflow-x-auto">
                          <textarea
                            rows={4}
                            value={block.code || ''}
                            onChange={(e) => updateBlock(block.id, { code: e.target.value })}
                            className="w-full bg-transparent font-code text-code text-on-surface focus:outline-none resize-none"
                          />
                        </div>
                      )}

                      {block.type === 'callout' && (
                        <div className="p-4 rounded-xl bg-primary-fixed/40 border-l-4 border-primary text-on-primary-fixed my-4 space-y-1">
                          <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                            placeholder="Callout Title..."
                            className="font-title-md text-title-md font-bold w-full bg-transparent focus:outline-none"
                          />
                          <textarea
                            rows={2}
                            value={block.text || ''}
                            onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                            placeholder="Callout text..."
                            className="font-body-md text-body-md w-full bg-transparent focus:outline-none resize-none"
                          />
                        </div>
                      )}

                      {block.type === 'divider' && (
                        <div className="py-4">
                          <hr className="border-t border-outline-variant/30" />
                        </div>
                      )}

                      {block.type === 'button' && (
                        <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-primary-fixed to-surface-container text-on-primary-fixed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-headline-sm text-headline-sm text-on-primary-fixed">
                              Join the Editorial Syndicate
                            </h4>
                            <p className="font-body-sm text-body-sm text-on-primary-fixed-variant">
                              Receive weekly longform teardowns on token systems & typography.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all whitespace-nowrap"
                          >
                            {block.text || 'Subscribe to Dispatch'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </article>

              {/* Manuscript Footer: Tags & Share */}
              <footer className="mt-10 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-on-surface-variant font-body-sm text-body-sm">
                <div className="flex flex-wrap items-center gap-2">
                  {(post.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">favorite</span>
                    <span className="font-code text-code">248</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        triggerToast('Proof link copied to clipboard');
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
          </main>

          {/* PANEL 3: Right Inspector Rail (Fixed with inner scroll) */}
          <aside className="w-80 h-full shrink-0 bg-surface-container-lowest border-l border-surface-container-high/60 shadow-[-1px_0_4px_rgba(19,27,46,0.03)] flex flex-col z-20 overflow-y-auto">
            {/* Inspector Tab Switcher */}
            <div className="p-4 pb-2 bg-surface-container-lowest">
              <div className="flex items-center p-1 bg-surface-container-low rounded-lg w-full">
                <button
                  type="button"
                  onClick={() => setActiveInspectorTab('settings')}
                  className={`flex-1 py-1.5 text-center font-label-md text-label-md rounded-md transition-all ${
                    activeInspectorTab === 'settings'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Post Settings
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInspectorTab('seo')}
                  className={`flex-1 py-1.5 text-center font-label-md text-label-md rounded-md transition-all ${
                    activeInspectorTab === 'seo'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  SEO & Social
                </button>
              </div>
            </div>

            {/* Inspector Scrollable Controls */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              {activeInspectorTab === 'settings' ? (
                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                      Publication Status
                    </label>
                    <select
                      value={post.status || 'draft'}
                      onChange={(e) => {
                        setPost((prev) => ({ ...prev, status: e.target.value as 'draft' | 'published' }));
                        setSaveStatus('Unsaved changes');
                      }}
                      className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                      Publication Slug
                    </label>
                    <input
                      type="text"
                      value={post.slug || ''}
                      onChange={(e) => {
                        setPost((prev) => ({ ...prev, slug: e.target.value }));
                        setSaveStatus('Unsaved changes');
                      }}
                      placeholder="post-slug"
                      className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 font-mono text-[11px]">
                      URL: /blog/{post.slug || 'slug'}
                    </p>
                  </div>

                  {/* Author */}
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                      Author
                    </label>
                    <input
                      type="text"
                      value={post.author || ''}
                      onChange={(e) => {
                        setPost((prev) => ({ ...prev, author: e.target.value }));
                        setSaveStatus('Unsaved changes');
                      }}
                      placeholder="Author name"
                      className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                      Category
                    </label>
                    <select
                      value={post.category || 'general'}
                      onChange={(e) => {
                        setPost((prev) => ({ ...prev, category: e.target.value }));
                        setSaveStatus('Unsaved changes');
                      }}
                      className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="general">General</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(post.tags || []).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface"
                        >
                          #{t}
                          <button
                            type="button"
                            onClick={() =>
                              setPost((prev) => ({
                                ...prev,
                                tags: (prev.tags || []).filter((tag) => tag !== t)
                              }))
                            }
                            className="hover:text-error"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = tagInput.trim().replace(/^#/, '');
                            if (val && !post.tags?.includes(val)) {
                              setPost((prev) => ({ ...prev, tags: [...(prev.tags || []), val] }));
                              setTagInput('');
                              setSaveStatus('Unsaved changes');
                            }
                          }
                        }}
                        placeholder="Add tag (Press Enter)..."
                        className="flex-1 h-9 px-3 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Featured Cover Image */}
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                      Featured Cover Image
                    </label>
                    {post.featuredImage ? (
                      <div className="relative rounded-lg overflow-hidden group">
                        <img
                          src={post.featuredImage}
                          alt="Cover"
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 text-white font-label-sm flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setMediaPickerTarget('featured');
                              setShowMediaPicker(true);
                            }}
                            className="px-2.5 py-1 bg-white/20 hover:bg-white/40 rounded text-xs"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => setPost((prev) => ({ ...prev, featuredImage: '' }))}
                            className="px-2.5 py-1 bg-error/70 hover:bg-error rounded text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setMediaPickerTarget('featured');
                          setShowMediaPicker(true);
                        }}
                        className="w-full h-24 border-2 border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-colors gap-1"
                      >
                        <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                        <span className="font-label-sm text-label-sm">Select Cover Image</span>
                      </button>
                    )}
                  </div>

                  {/* Template Select */}
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1">
                      Article Template
                    </label>
                    <select
                      value={post.template || 'default'}
                      onChange={(e) => {
                        setPost((prev) => ({ ...prev, template: e.target.value }));
                        setSaveStatus('Unsaved changes');
                      }}
                      className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="default">Default Longform</option>
                      <option value="minimal">Minimalist Canvas</option>
                      <option value="full-width">Full Bleed Visual</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* SEO & SOCIAL TAB */
                <div className="space-y-4">
                  {/* Live SERP Preview */}
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                    <span className="font-label-xs text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">
                      Search Result Preview
                    </span>
                    <p className="text-[11px] font-mono text-on-surface-variant truncate">
                      yoursite.com/blog/{post.slug || 'post-slug'}
                    </p>
                    <p className="text-sm font-semibold text-primary line-clamp-1">
                      {post.seo?.title || post.title || 'Untitled Article'}
                    </p>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      {post.seo?.description || post.excerpt || 'Add a meta description to control how this post appears in search engines.'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                        Meta Title
                      </label>
                      <span className="font-code text-[10px] text-on-surface-variant">
                        {(post.seo?.title || post.title || '').length}/60
                      </span>
                    </div>
                    <input
                      type="text"
                      value={post.seo?.title || ''}
                      onChange={(e) => updateSEO({ title: e.target.value })}
                      placeholder={post.title || 'Article meta title'}
                      className="w-full h-9 px-3 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-label-sm text-label-sm text-on-surface font-semibold">
                        Meta Description
                      </label>
                      <span className="font-code text-[10px] text-on-surface-variant">
                        {(post.seo?.description || post.excerpt || '').length}/160
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={post.seo?.description || ''}
                      onChange={(e) => updateSEO({ description: e.target.value })}
                      placeholder={post.excerpt || 'Summarize this article for search engines...'}
                      className="w-full p-2.5 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface font-semibold mb-1">
                      Canonical URL
                    </label>
                    <input
                      type="text"
                      value={post.seo?.canonical || ''}
                      onChange={(e) => updateSEO({ canonical: e.target.value })}
                      placeholder="https://example.com/blog/..."
                      className="w-full h-9 px-3 bg-surface-container-low rounded-lg font-code text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="pt-2 border-t border-outline-variant/20 space-y-3">
                    <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant font-bold block">
                      Social / OpenGraph
                    </span>
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                        OG Title
                      </label>
                      <input
                        type="text"
                        value={post.seo?.ogTitle || ''}
                        onChange={(e) => updateSEO({ ogTitle: e.target.value })}
                        placeholder={post.seo?.title || post.title || 'Social share title'}
                        className="w-full h-9 px-3 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                        OG Description
                      </label>
                      <textarea
                        rows={2}
                        value={post.seo?.ogDescription || ''}
                        onChange={(e) => updateSEO({ ogDescription: e.target.value })}
                        placeholder={post.seo?.description || post.excerpt || 'Social share description'}
                        className="w-full p-2.5 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/20">
                    <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-lg bg-surface-container-low">
                      <div>
                        <span className="font-label-sm text-label-sm text-on-surface font-semibold block">
                          Exclude from Search Engines
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          Adds noindex, nofollow meta tag
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(post.seo?.noIndex)}
                        onChange={(e) =>
                          updateSEO({
                            noIndex: e.target.checked,
                            robots: e.target.checked ? 'noindex,nofollow' : 'index,follow'
                          })
                        }
                        className="w-4 h-4 accent-primary rounded"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Inspector Footer Bar */}
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/20 shadow-[0_-1px_4px_rgba(19,27,46,0.02)] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowStatsModal(true)}
                className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">insights</span>
                <span>{stats.words} words</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url, alt) => {
          if (mediaPickerTarget === 'featured') {
            setPost((prev) => ({ ...prev, featuredImage: url }));
          } else if (mediaPickerTarget === 'new') {
            const imgBlock = createDefaultBlock('image') as any;
            imgBlock.url = url;
            if (alt) imgBlock.alt = alt;
            const newBlocks = [...(post.content?.blocks || []), imgBlock];
            commitBlocks(newBlocks);
          } else {
            // Update specific block
            updateBlock(mediaPickerTarget, { url, alt });
          }
          setShowMediaPicker(false);
          triggerToast('Media applied');
        }}
      />

      {/* Document Statistics Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">insights</span>
                <h3 className="font-title-md text-title-md text-on-surface font-bold">Manuscript Statistics</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 font-code text-code">
              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="font-label-xs text-label-xs text-on-surface-variant block uppercase">Words</span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold">{stats.words}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="font-label-xs text-label-xs text-on-surface-variant block uppercase">Characters</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{stats.chars}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="font-label-xs text-label-xs text-on-surface-variant block uppercase">Reading Time</span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold">
                  {stats.readTimeMinutes} min
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="font-label-xs text-label-xs text-on-surface-variant block uppercase">Total Blocks</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  {blocks.length}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowStatsModal(false)}
              className="w-full py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Revision History Modal */}
      {showRevisions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                <h3 className="font-title-md text-title-md text-on-surface font-bold">Revision History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRevisions(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {loadingRevisions ? (
              <div className="py-8 text-center text-on-surface-variant font-body-sm">
                Loading snapshot timeline...
              </div>
            ) : revisions.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant font-body-sm">
                No previous snapshots found for this manuscript.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <span className="font-label-md text-label-md text-on-surface font-semibold block">
                        {new Date(rev.createdAt).toLocaleString()}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        By {rev.authorEmail} • {rev.summary || `Snapshot v${rev.version}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => restoreRevision(rev.id)}
                      className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold hover:bg-primary shadow-xs"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

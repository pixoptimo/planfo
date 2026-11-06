import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  History,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import type { Page, RevisionMeta } from '@cms/schemas';
import { api } from '../../api/client.js';
import { StructuredEditor } from '../../components/Editor/StructuredEditor.js';
import { SEOFields } from '../../components/SEO/SEOFields.js';
import { MediaPickerModal } from '../../components/Media/MediaPickerModal.js';
import { StatusBadge } from '../../components/UI/StatusBadge.js';
import { getMediaUrl } from '../../utils/media.js';
import { slugify } from '../../utils/slugify.js';
import { useAuth } from '../../context/AuthContext.js';
import { getTemplatePreset } from '../../data/templatePresets.js';

export const PageEdit: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const isNew = !slug || slug === 'new';
  const navigate = useNavigate();
  const { can } = useAuth();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!isNew);

  const [page, setPage] = useState<Partial<Page>>({
    title: '',
    slug: '',
    status: 'draft',
    template: 'default',
    content: { blocks: [] },
    featuredImage: '',
    noIndex: false,
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

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Revisions Drawer State
  const [revisions, setRevisions] = useState<RevisionMeta[]>([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<string[]>(['default', 'landing']);

  useEffect(() => {
    api.get<{ templates: string[]; activeTheme: string }>('/api/themes/templates')
      .then((data) => {
        if (data?.templates && Array.isArray(data.templates) && data.templates.length > 0) {
          setAvailableTemplates(data.templates);
        }
      })
      .catch(() => {
        // Fallback silently to default
      });
  }, []);

  useEffect(() => {
    if (!isNew && slug) {
      loadPage(slug);
    }
  }, [slug, isNew]);

  const loadPage = async (pageSlug: string) => {
    setLoading(true);
    try {
      const data = await api.get<Page>(`/api/pages/${pageSlug}`);
      setPage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish = false) => {
    if (!page.title?.trim()) {
      setError('Page title is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const targetStatus = publish ? 'published' : page.status || 'draft';
    const payload = {
      ...page,
      status: targetStatus
    };

    try {
      if (isNew) {
        const created = await api.post<Page>('/api/pages', payload);
        navigate(`/pages/${created.slug}`, { replace: true });
        setSuccess('Page created successfully!');
      } else {
        const updated = await api.put<Page>(`/api/pages/${slug}`, payload);
        setPage(updated);
        setSuccess(publish ? 'Page published successfully!' : 'Changes saved successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const loadRevisions = async () => {
    if (isNew || !slug) return;
    setLoadingRevisions(true);
    try {
      const data = await api.get<RevisionMeta[]>(`/api/pages/${slug}/revisions`);
      setRevisions(data);
    } catch {
      //
    } finally {
      setLoadingRevisions(false);
    }
  };

  const restoreRevision = async (revId: string) => {
    if (!slug) return;
    if (!confirm('Are you sure you want to restore this revision? A new version will be created.')) return;

    try {
      const restored = await api.post<Page>(`/api/pages/${slug}/revisions/${revId}/restore`);
      setPage(restored);
      setShowRevisions(false);
      setSuccess(`Restored to version`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-on-surface-variant font-label-md">Loading page data...</div>;
  }

  return (
    <div className="space-y-6 pb-20 w-full font-body-md text-on-surface antialiased">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/pages"
            className="p-2 text-on-surface-variant hover:text-on-surface bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
                {isNew ? 'Create New Page' : `Edit: ${page.title}`}
              </h1>
              {!isNew && page.status && <StatusBadge status={page.status} />}
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant font-mono mt-0.5">
              URL: /{page.slug === 'home' ? '' : page.slug || 'slug-preview'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isNew && (
            <>
              <button
                type="button"
                onClick={() => {
                  setShowRevisions(true);
                  loadRevisions();
                }}
                className="px-3.5 py-2 bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition"
              >
                <History className="w-3.5 h-3.5 text-primary" />
                <span>Revisions</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>

          {can('pages.publish') && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{page.status === 'published' ? 'Update Page' : 'Publish Page'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-xs text-error flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Core Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 space-y-4 shadow-xs">
          <div>
            <label className="block font-label-sm text-label-sm font-semibold text-on-surface uppercase tracking-wider mb-1">
              Page Title *
            </label>
            <input
              type="text"
              required
              value={page.title || ''}
              onChange={(e) => {
                const newTitle = e.target.value;
                setPage((prev) => {
                  const next = { ...prev, title: newTitle };
                  if (!slugManuallyEdited || !prev.slug) {
                    next.slug = slugify(newTitle);
                  }
                  return next;
                });
              }}
              placeholder="About Us, Contact, Features..."
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-base font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-label-sm text-label-sm font-semibold text-on-surface uppercase tracking-wider">
                URL Slug
              </label>
              {page.title && (
                <button
                  type="button"
                  onClick={() => {
                    const auto = slugify(page.title || '');
                    setPage((prev) => ({ ...prev, slug: auto }));
                    setSlugManuallyEdited(false);
                  }}
                  className="text-[11px] text-primary hover:underline font-medium transition"
                >
                  Regenerate from Title
                </button>
              )}
            </div>
            <input
              type="text"
              value={page.slug || ''}
              onChange={(e) => {
                const val = e.target.value;
                setSlugManuallyEdited(val.trim().length > 0);
                setPage((prev) => ({ ...prev, slug: val }));
              }}
              placeholder="auto-generated-from-title"
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 space-y-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-label-sm text-label-sm font-semibold text-on-surface uppercase tracking-wider">
                Layout Template
              </label>
            </div>
            <select
              value={page.template || 'default'}
              onChange={(e) => {
                const newTemplate = e.target.value;
                const preset = getTemplatePreset(newTemplate);
                const currentBlocks = (page.content as any)?.blocks || [];
                const isEmpty =
                  currentBlocks.length === 0 ||
                  (currentBlocks.length === 1 && !currentBlocks[0]?.text?.trim() && !currentBlocks[0]?.items?.length);

                if (preset && isEmpty) {
                  setPage((prev) => ({
                    ...prev,
                    template: newTemplate,
                    content: { blocks: JSON.parse(JSON.stringify(preset.blocks)) }
                  }));
                  setSuccess(`Auto-filled sections and grid cards for "${preset.name}"!`);
                } else {
                  setPage((prev) => ({ ...prev, template: newTemplate }));
                }
              }}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary capitalize"
            >
              {Array.from(new Set(['default', ...availableTemplates, page.template || 'default'])).map((tpl) => (
                <option key={tpl} value={tpl}>
                  {tpl.replace(/-/g, ' ')} {tpl === 'default' ? '(Standard)' : ''}
                </option>
              ))}
            </select>

            {(() => {
              const currentPreset = getTemplatePreset(page.template || 'default');
              if (!currentPreset) return null;
              return (
                <div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                  <span className="text-[11px] text-on-surface-variant truncate max-w-[140px]" title={currentPreset.description}>
                    Preset: <strong className="text-on-surface">{currentPreset.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentBlocks = (page.content as any)?.blocks || [];
                      if (
                        currentBlocks.length > 0 &&
                        !confirm(
                          `Load "${currentPreset.name}" sections? This will populate the editor with starter sections and grid cards.`
                        )
                      ) {
                        return;
                      }
                      setPage((prev) => ({
                        ...prev,
                        content: { blocks: JSON.parse(JSON.stringify(currentPreset.blocks)) }
                      }));
                      setSuccess(`Loaded "${currentPreset.name}" sections and grid cards!`);
                    }}
                    className="text-[11px] text-primary hover:underline font-medium flex items-center space-x-1"
                    title="Load starter sections and multi-column grid cards"
                  >
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>Load Sections</span>
                  </button>
                </div>
              );
            })()}
          </div>

          <div>
            <label className="block font-label-sm text-label-sm font-semibold text-on-surface uppercase tracking-wider mb-1">
              Featured Hero Image
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={page.featuredImage || ''}
                  onChange={(e) => setPage({ ...page, featuredImage: e.target.value })}
                  placeholder="/media/image.jpg"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="p-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-xs"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>

              {page.featuredImage && (
                <div className="aspect-video bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant/30 relative">
                  <img
                    src={getMediaUrl(page.featuredImage)}
                    alt="Featured"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Search Engine Visibility / Indexing Directive */}
          <div className="pt-3 border-t border-outline-variant/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-label-sm text-label-sm font-semibold text-on-surface uppercase tracking-wider">
                Search Engine Indexing
              </label>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  page.noIndex || page.seo?.robots?.includes('noindex')
                    ? 'bg-secondary/10 text-secondary border border-secondary/30'
                    : 'bg-primary/10 text-primary border border-primary/30'
                }`}
              >
                {page.noIndex || page.seo?.robots?.includes('noindex') ? 'No-Index' : 'Indexed'}
              </span>
            </div>

            <label className="flex items-start space-x-2.5 p-3 bg-surface-container-low border border-outline-variant/30 rounded-lg cursor-pointer hover:border-outline-variant transition">
              <input
                type="checkbox"
                checked={Boolean(page.noIndex || page.seo?.robots?.includes('noindex'))}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setPage((prev) => ({
                    ...prev,
                    noIndex: isChecked,
                    seo: {
                      ...prev.seo,
                      noIndex: isChecked,
                      robots: isChecked ? 'noindex,nofollow' : 'index,follow'
                    } as any
                  }));
                }}
                className="mt-0.5 rounded border-outline-variant text-primary focus:ring-0 focus:ring-offset-0 bg-surface-container-lowest"
              />
              <div className="text-xs">
                <span className="font-semibold text-on-surface block">No-Index this page</span>
                <span className="text-[11px] text-on-surface-variant block leading-relaxed mt-0.5">
                  Applies <code className="text-secondary font-mono text-[10px]">noindex,nofollow</code> to hide this page from search engines and excludes it from sitemap.xml.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Structured Content Block Editor */}
      <div className="space-y-2">
        <label className="block font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
          Structured Page Content
        </label>
        <StructuredEditor
          content={
            page.content && typeof page.content === 'object' && 'blocks' in page.content
              ? (page.content as any)
              : { blocks: [] }
          }
          onChange={(newContent) => setPage({ ...page, content: newContent })}
        />
      </div>

      {/* SEO Accordion */}
      <SEOFields
        seo={page.seo || ({} as any)}
        onChange={(newSeo) => setPage({ ...page, seo: newSeo })}
        defaultTitle={page.title}
      />

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => setPage({ ...page, featuredImage: url })}
      />

      {/* Revisions Drawer */}
      {showRevisions && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border-l border-outline-variant/30 w-full max-w-md h-full flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-on-surface text-base">Revision History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRevisions(false)}
                className="text-on-surface-variant hover:text-on-surface text-sm"
              >
                Close ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {loadingRevisions ? (
                <div className="text-center py-10 text-on-surface-variant">Loading revisions...</div>
              ) : revisions.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant">No revisions found for this page yet.</div>
              ) : (
                revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 bg-surface-container-low border border-outline-variant/30 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-primary">
                        Version {rev.version}
                      </span>
                      <span className="text-[11px] text-on-surface-variant font-mono">
                        {new Date(rev.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface">{rev.summary}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                      <span className="text-[11px] text-on-surface-variant">By {rev.authorEmail}</span>
                      <button
                        type="button"
                        onClick={() => restoreRevision(rev.id)}
                        className="px-2.5 py-1 bg-primary-container text-on-primary-container rounded text-xs font-semibold hover:bg-primary shadow-xs"
                      >
                        Restore This Version
                      </button>
                    </div>
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

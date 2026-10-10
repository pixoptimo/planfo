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
  AlertCircle
} from 'lucide-react';
import type { Page, RevisionMeta } from '@cms/schemas';
import { api } from '../../api/client.js';
import { StructuredEditor } from '../../components/Editor/StructuredEditor.js';
import { SEOFields } from '../../components/SEO/SEOFields.js';
import { MediaPickerModal } from '../../components/Media/MediaPickerModal.js';
import { StatusBadge } from '../../components/UI/StatusBadge.js';
import { useAuth } from '../../context/AuthContext.js';

export const PageEdit: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const isNew = !slug || slug === 'new';
  const navigate = useNavigate();
  const { can } = useAuth();

  const [page, setPage] = useState<Partial<Page>>({
    title: '',
    slug: '',
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
      robots: 'index,follow'
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
    return <div className="text-center py-20 text-slate-400">Loading page data...</div>;
  }

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/pages"
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {isNew ? 'Create New Page' : `Edit: ${page.title}`}
              </h1>
              {!isNew && page.status && <StatusBadge status={page.status} />}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
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
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <History className="w-3.5 h-3.5" />
                <span>Revisions</span>
              </button>

              <a
                href={`/api/preview/page/${page.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-brand-400 border border-slate-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </a>
            </>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>

          {can('pages.publish') && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Page</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Core Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Page Title *
            </label>
            <input
              type="text"
              required
              value={page.title || ''}
              onChange={(e) => setPage({ ...page, title: e.target.value })}
              placeholder="About Us, Contact, Features..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-base font-semibold text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              URL Slug
            </label>
            <input
              type="text"
              value={page.slug || ''}
              onChange={(e) => setPage({ ...page, slug: e.target.value })}
              placeholder="auto-generated-from-title"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Layout Template
            </label>
            <select
              value={page.template || 'default'}
              onChange={(e) => setPage({ ...page, template: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 capitalize"
            >
              {Array.from(new Set(['default', ...availableTemplates, page.template || 'default'])).map((tpl) => (
                <option key={tpl} value={tpl}>
                  {tpl.replace(/-/g, ' ')} {tpl === 'default' ? '(Standard)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Featured Hero Image
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={page.featuredImage || ''}
                  onChange={(e) => setPage({ ...page, featuredImage: e.target.value })}
                  placeholder="/media/image.jpg"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>

              {page.featuredImage && (
                <div className="aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                  <img src={page.featuredImage} alt="Featured" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Structured Content Block Editor */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-white text-base">Revision History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRevisions(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                Close ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {loadingRevisions ? (
                <div className="text-center py-10 text-slate-400">Loading revisions...</div>
              ) : revisions.length === 0 ? (
                <div className="text-center py-10 text-slate-500">No revisions found for this page yet.</div>
              ) : (
                revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-emerald-400">
                        Version {rev.version}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(rev.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{rev.summary}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400">By {rev.authorEmail}</span>
                      <button
                        type="button"
                        onClick={() => restoreRevision(rev.id)}
                        className="px-2.5 py-1 bg-brand-600/20 hover:bg-brand-600/40 text-brand-400 rounded text-xs font-semibold"
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

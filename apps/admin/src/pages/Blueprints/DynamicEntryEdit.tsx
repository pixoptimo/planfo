import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Sliders,
  Calendar,
  Link as LinkIcon,
  Mail,
  Type,
  FileText,
  Globe,
  Archive,
  UploadCloud,
  ExternalLink,
  Play
} from 'lucide-react';
import type { Blueprint, BlueprintEntry, BlueprintField } from '@cms/schemas';
import { api } from '../../api/client.js';
import { StructuredEditor } from '../../components/Editor/StructuredEditor.js';
import { SEOFields } from '../../components/SEO/SEOFields.js';
import { MediaPickerModal } from '../../components/Media/MediaPickerModal.js';
import { StatusBadge } from '../../components/UI/StatusBadge.js';
import { getBlueprintIcon } from '../../utils/blueprintIcons.js';
import { getMediaUrl } from '../../utils/media.js';
import { slugify } from '../../utils/slugify.js';
import { useAuth } from '../../context/AuthContext.js';

export const DynamicEntryEdit: React.FC = () => {
  const { blueprintSlug, entrySlug } = useParams<{ blueprintSlug: string; entrySlug?: string }>();
  const isNew = !entrySlug || entrySlug === 'new';
  const navigate = useNavigate();
  const { can } = useAuth();
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
  const [success, setSuccess] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [activeImageField, setActiveImageField] = useState<string | null>(null);
  const [demoModes, setDemoModes] = useState<Record<string, 'url' | 'zip'>>({});
  const [uploadingZip, setUploadingZip] = useState(false);
  const [zipUploadMessage, setZipUploadMessage] = useState<{ text: string; error?: boolean } | null>(null);

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
          text: `ZIP extracted (${res.filesCount} files). Entry point set to "${res.demoUrl}". Multi-page demo is live!`
        });
      }
    } catch (err) {
      setZipUploadMessage({
        text: err instanceof Error ? err.message : 'ZIP upload and extraction failed',
        error: true
      });
    } finally {
      setUploadingZip(false);
    }
  };

  const [siteUrl, setSiteUrl] = useState<string>('');

  useEffect(() => {
    api.get<{ siteUrl: string; cmsUrl: string }>('/api/system/info')
      .then((info) => {
        if (info?.siteUrl) setSiteUrl(info.siteUrl);
        else if (info?.cmsUrl) setSiteUrl(info.cmsUrl);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (blueprintSlug) {
      loadData(blueprintSlug, entrySlug);
    }
  }, [blueprintSlug, entrySlug]);

  const loadData = async (bpSlug: string, entSlug?: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Blueprint Schema
      const bp = await api.get<Blueprint>(`/api/blueprints/${bpSlug}`);
      setBlueprint(bp);

      // 2. Fetch Entry if editing
      if (!isNew && entSlug) {
        const res = await api.get<{ blueprint: Blueprint; entry: BlueprintEntry }>(
          `/api/blueprints/${bpSlug}/entries/${entSlug}`
        );
        setEntry(res.entry);
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

  const handleSave = async (publish = false) => {
    if (!entry.title?.trim()) {
      setError('Entry title is required');
      return;
    }
    if (!blueprintSlug) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

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
        setSuccess(`"${created.title}" created successfully!`);
        navigate(`/blueprints/${blueprintSlug}/${created.slug}`, { replace: true });
      } else {
        const updated = await api.put<BlueprintEntry>(
          `/api/blueprints/${blueprintSlug}/entries/${entrySlug}`,
          payload
        );
        setEntry(updated);
        setSuccess(`"${updated.title}" saved successfully!`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center space-x-2 text-slate-400 font-mono text-xs">
        <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
        <span>Loading record editor...</span>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Blueprint Not Found</h2>
        <Link
          to="/blueprints/studio"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-brand-400 hover:text-brand-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Blueprint Studio</span>
        </Link>
      </div>
    );
  }

  const IconComp = getBlueprintIcon(blueprint.icon);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <Link
            to={`/blueprints/${blueprint.slug}`}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition"
            title={`Back to ${blueprint.name}`}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {isNew ? `Create New ${blueprint.singularName}` : `Edit: ${entry.title || 'Untitled'}`}
              </h1>
              {!isNew && <StatusBadge status={entry.status || 'draft'} />}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              URL: /{blueprint.slug}/{entry.slug || 'slug-preview'}
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{entry.status === 'published' ? 'Update' : 'Publish'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center space-x-3 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Base Fields Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {blueprint.singularName} Title *
            </label>
            <input
              type="text"
              required
              value={entry.title || ""}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={`Enter ${blueprint.singularName.toLowerCase()} title...`}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-base font-semibold text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                URL Slug *
              </label>
              {entry.title && (
                <button
                  type="button"
                  onClick={() => {
                    const auto = slugify(entry.title || '');
                    setEntry((prev) => ({ ...prev, slug: auto }));
                    setSlugManuallyEdited(false);
                  }}
                  className="text-[11px] text-brand-400 hover:text-brand-300 font-medium transition"
                >
                  Regenerate from Title
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-500 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                /{blueprint.slug}/
              </span>
              <input
                type="text"
                required
                value={entry.slug || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSlugManuallyEdited(val.trim().length > 0);
                  setEntry((prev) => ({ ...prev, slug: val }));
                }}
                placeholder="url-friendly-slug"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Summary / Excerpt
            </label>
            <textarea
              rows={2}
              value={entry.excerpt || ""}
              onChange={(e) => setEntry((prev) => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Brief summary or introductory blurb..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Featured Hero Image
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={entry.featuredImage || ""}
                  onChange={(e) => setEntry((prev) => ({ ...prev, featuredImage: e.target.value }))}
                  placeholder="/media/image.jpg"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveImageField(null);
                    setShowMediaPicker(true);
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs flex-shrink-0"
                  title="Choose from Media Library or Upload"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>

              {entry.featuredImage && (
                <div className="aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative group">
                  <img
                    src={getMediaUrl(entry.featuredImage)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setEntry((prev) => ({ ...prev, featuredImage: "" }))}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-lg transition"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {(blueprint.hasCategories || blueprint.hasTags) && (
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              {blueprint.hasCategories && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={entry.category || ""}
                    onChange={(e) => setEntry((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g. general, featured"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              {blueprint.hasTags && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Tags
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add tag and press Enter..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 font-semibold"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-400 p-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Custom Fields Section */}
      {blueprint.fields.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-brand-400" />
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Custom Attributes & Fields
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {blueprint.fields.length} Configured Fields
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blueprint.fields.map((fld: BlueprintField) => {
                  const val = entry.data?.[fld.name] ?? fld.defaultValue ?? '';
                  const isDemoField = fld.name === 'demoUrl' || fld.name === 'demo';

                  if (isDemoField) {
                    const currentMode =
                      demoModes[fld.name] ||
                      (typeof val === 'string' && val.startsWith('demos/') ? 'zip' : 'url');

                    return (
                      <div
                        key={fld.id || fld.name}
                        className="col-span-1 md:col-span-2 space-y-2.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <label className="block text-xs font-bold text-white">
                                {fld.label} {fld.required && <span className="text-rose-400">*</span>}
                              </label>
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                Live Device Simulator
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Choose between a hosted live URL or uploading an extracted ZIP bundle for full multi-page navigation.
                            </p>
                          </div>

                          {/* Toggle Switch */}
                          <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-700/80 rounded-xl self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setDemoModes({ ...demoModes, [fld.name]: 'url' });
                                setZipUploadMessage(null);
                              }}
                              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                currentMode === 'url'
                                  ? 'bg-brand-500 text-slate-950 shadow-sm'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>Live URL</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDemoModes({ ...demoModes, [fld.name]: 'zip' });
                                setZipUploadMessage(null);
                              }}
                              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                currentMode === 'zip'
                                  ? 'bg-brand-500 text-slate-950 shadow-sm'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Archive className="w-3.5 h-3.5" />
                              <span>ZIP Bundle (Multi-page)</span>
                            </button>
                          </div>
                        </div>

                        {/* Mode 1: Live URL */}
                        {currentMode === 'url' && (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center space-x-2">
                              <div className="relative flex-1">
                                <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  required={fld.required}
                                  value={val}
                                  onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                                  placeholder="https://my-demo-site.netlify.app or sample-templates/quantum-saas.html"
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
                                />
                              </div>
                              {val && (
                                <a
                                  href={val}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition flex-shrink-0"
                                  title="Test URL in new window"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Test URL</span>
                                </a>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Direct URL loaded inside the device preview simulator. Supports external sites or local static templates.
                            </p>
                          </div>
                        )}

                        {/* Mode 2: ZIP Bundle */}
                        {currentMode === 'zip' && (
                          <div className="space-y-3 pt-1">
                            {val && typeof val === 'string' && val.startsWith('demos/') && (
                              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-emerald-300">
                                      Active Extracted Multi-Page Demo
                                    </div>
                                    <div className="text-[11px] font-mono text-emerald-400/80 truncate">
                                      Entry: {val}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  <a
                                    href={`${siteUrl ? siteUrl.replace(/\/$/, '') : ''}/demos/${entry.slug || 'prefiop'}/index.html`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
                                    title="Open interactive device simulator"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    <span>Open Simulator</span>
                                  </a>
                                  <a
                                    href={`${siteUrl ? siteUrl.replace(/\/$/, '') : ''}/${val.replace(/^\//, '')}?raw=true`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center space-x-1 border border-slate-700 transition"
                                    title="Open clean raw HTML in new tab"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Raw HTML</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleCustomFieldChange(fld.name, '')}
                                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/40 rounded-xl p-5 text-center transition">
                              <input
                                type="file"
                                id={`zip-upload-${fld.name}`}
                                accept=".zip,application/zip"
                                className="hidden"
                                disabled={uploadingZip}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  await handleDemoZipUpload(fld.name, file);
                                  e.target.value = '';
                                }}
                              />
                              <label
                                htmlFor={`zip-upload-${fld.name}`}
                                className="cursor-pointer flex flex-col items-center space-y-2"
                              >
                                {uploadingZip ? (
                                  <div className="flex flex-col items-center space-y-1.5 py-2">
                                    <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
                                    <span className="text-xs text-slate-300 font-bold">
                                      Extracting template archive & mapping files...
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                      Preserving internal links, CSS, JavaScript, and asset trees
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-sm">
                                      <UploadCloud className="w-5 h-5 text-brand-400" />
                                    </div>
                                    <div className="text-xs font-bold text-white">
                                      {val && typeof val === 'string' && val.startsWith('demos/')
                                        ? 'Upload new ZIP to replace demo'
                                        : 'Click to upload template ZIP bundle'}
                                    </div>
                                    <p className="text-[11px] text-slate-400 max-w-md leading-relaxed">
                                      Upload a .zip containing <span className="text-white font-mono">index.html</span> and styles. Multi-page links (<span className="text-slate-300 font-mono">&lt;a href="about.html"&gt;</span>) will work seamlessly inside the demo simulator!
                                    </p>
                                  </>
                                )}
                              </label>
                            </div>

                            {zipUploadMessage && (
                              <div
                                className={`p-2.5 rounded-xl text-xs flex items-center space-x-2 ${
                                  zipUploadMessage.error
                                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {zipUploadMessage.error ? (
                                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                )}
                                <span>{zipUploadMessage.text}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={fld.id || fld.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-300">
                          {fld.label} {fld.required && <span className="text-rose-400">*</span>}
                        </label>
                        <span className="text-[10px] font-mono text-slate-500">
                          {fld.name} ({fld.type})
                        </span>
                      </div>

                      {/* Render control depending on type */}
                      {fld.type === 'text' && (
                        <input
                          type="text"
                          required={fld.required}
                          value={val}
                          onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                          placeholder={fld.placeholder || `Enter ${fld.label.toLowerCase()}...`}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                      )}

                      {fld.type === 'textarea' && (
                        <textarea
                          rows={3}
                          required={fld.required}
                          value={val}
                          onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                          placeholder={fld.placeholder || `Enter ${fld.label.toLowerCase()}...`}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500 resize-none"
                        />
                      )}

                      {fld.type === 'number' && (
                        <input
                          type="number"
                          required={fld.required}
                          value={val}
                          onChange={(e) => handleCustomFieldChange(fld.name, parseFloat(e.target.value) || 0)}
                          placeholder={fld.placeholder || '0'}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
                        />
                      )}

                      {fld.type === 'boolean' && (
                        <div className="flex items-center space-x-3 pt-1">
                          <button
                            type="button"
                            onClick={() => handleCustomFieldChange(fld.name, !val)}
                            className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                              val ? 'bg-brand-500' : 'bg-slate-800'
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                                val ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="text-xs text-slate-300 font-mono">
                            {val ? 'Enabled / True' : 'Disabled / False'}
                          </span>
                        </div>
                      )}

                      {fld.type === 'date' && (
                        <input
                          type="date"
                          required={fld.required}
                          value={val}
                          onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
                        />
                      )}

                      {fld.type === 'image' && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                              placeholder="Image URL or select from library..."
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setActiveImageField(fld.name);
                                setShowMediaPicker(true);
                              }}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 flex items-center space-x-1.5 transition"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Select</span>
                            </button>
                          </div>
                          {val && (
                            <div className="relative inline-block border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                              <img src={getMediaUrl(val)} alt="" className="h-20 w-32 object-cover" />
                              <button
                                type="button"
                                onClick={() => handleCustomFieldChange(fld.name, '')}
                                className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-md text-xs transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {fld.type === 'select' && (
                        <select
                          required={fld.required}
                          value={val}
                          onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                        >
                          <option value="">Select an option...</option>
                          {fld.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {fld.type === 'url' && (
                        <div className="relative">
                          <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="url"
                            required={fld.required}
                            value={val}
                            onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                            placeholder={fld.placeholder || 'https://example.com'}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
                          />
                        </div>
                      )}

                      {fld.type === 'email' && (
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required={fld.required}
                            value={val}
                            onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                            placeholder={fld.placeholder || 'user@example.com'}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
                          />
                        </div>
                      )}

                      {fld.type === 'content' && (
                        <textarea
                          rows={5}
                          value={typeof val === 'string' ? val : JSON.stringify(val)}
                          onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                          placeholder="Rich content data or markdown..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
                        />
                      )}

                      {fld.description && (
                        <p className="text-[11px] text-slate-500 mt-1">{fld.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          
      {/* Structured Content Block Editor */}
      {blueprint.hasContentEditor && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Structured Page Content
          </label>
          <StructuredEditor
            content={entry.content || { blocks: [] }}
            onChange={(content) => setEntry((prev) => ({ ...prev, content }))}
          />
        </div>
      )}

      {/* SEO Metadata */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <SEOFields
          seo={
            entry.seo || {
              title: "",
              description: "",
              canonical: "",
              ogTitle: "",
              ogDescription: "",
              ogImage: "",
              robots: "index,follow",
              noIndex: false
            }
          }
          onChange={(seo) => setEntry((prev) => ({ ...prev, seo }))}
        />
      </div>

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

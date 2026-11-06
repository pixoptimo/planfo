import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Blueprint, BlueprintEntry } from '@cms/schemas';
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
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-on-surface-variant font-body-sm">
        <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>Loading record editor...</span>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="p-8 bg-surface-container-lowest border border-surface-container-high/60 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
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
    );
  }

  const IconComp = getBlueprintIcon(blueprint.icon);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto font-body-md text-on-surface antialiased pb-20">
      {/* Header Bar */}
      <div className="w-full bg-surface-container-lowest px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm border border-surface-container-high/40 rounded-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/blueprints/${blueprint.slug}`}
            className="p-2 text-on-surface-variant hover:text-primary bg-surface-container rounded-xl transition-colors shrink-0"
            title={`Back to ${blueprint.name}`}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-headline-sm text-headline-sm font-serif text-on-surface truncate">
                {isNew ? `Create New ${blueprint.singularName}` : `Edit: ${entry.title || 'Untitled'}`}
              </h1>
              {!isNew && <StatusBadge status={entry.status || 'draft'} />}
            </div>
            <p className="font-code text-code text-on-surface-variant text-[11px] truncate mt-0.5">
              URL: /{blueprint.slug}/{entry.slug || 'slug-preview'}
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">save</span>
            )}
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.01] disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">send</span>
            )}
            <span>{entry.status === 'published' ? 'Update Live' : 'Publish Record'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-error-container/40 border border-error/20 rounded-2xl flex items-center gap-3 text-error font-body-sm">
          <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-surface-container-highest border border-primary/20 rounded-2xl flex items-center gap-3 text-primary font-body-sm font-semibold">
          <span className="material-symbols-outlined text-[20px] shrink-0">check_circle</span>
          <span>{success}</span>
        </div>
      )}

      {/* Main 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Title, Slug, Custom Fields, Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Base Fields Card */}
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                {blueprint.singularName} Title *
              </label>
              <input
                type="text"
                required
                value={entry.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={`Enter ${blueprint.singularName.toLowerCase()} title...`}
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-4 py-2.5 font-headline-sm text-headline-sm font-serif text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">
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
                    className="font-label-xs text-label-xs text-primary hover:underline font-semibold"
                  >
                    Regenerate from Title
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-code text-code text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-xl border border-surface-container-high/40 text-xs shrink-0">
                  /{blueprint.slug}/
                </span>
                <input
                  type="text"
                  required
                  value={entry.slug || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSlugManuallyEdited(val.trim().length > 0);
                    setEntry((prev) => ({ ...prev, slug: val }));
                  }}
                  placeholder="url-friendly-slug"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-code text-code text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Summary / Excerpt
              </label>
              <textarea
                rows={2}
                value={entry.excerpt || ''}
                onChange={(e) => setEntry((prev) => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief summary or introductory blurb..."
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-4 py-2.5 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Dynamic Custom Fields Card */}
          {blueprint.fields.length > 0 && (
            <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                  <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                    Collection Attributes ({blueprint.fields.length})
                  </h2>
                </div>
                <span className="font-label-xs text-label-xs text-on-surface-variant font-medium">
                  Configured in Schema Architect
                </span>
              </div>

              {zipUploadMessage && (
                <div
                  className={`p-3.5 rounded-xl text-body-sm flex items-center justify-between ${
                    zipUploadMessage.error
                      ? 'bg-error-container/40 text-error border border-error/20'
                      : 'bg-surface-container-highest text-primary border border-primary/20'
                  }`}
                >
                  <span>{zipUploadMessage.text}</span>
                  <button
                    type="button"
                    onClick={() => setZipUploadMessage(null)}
                    className="text-on-surface-variant hover:text-on-surface ml-3"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blueprint.fields.map((fld) => {
                  const val = entry.data?.[fld.name] ?? '';

                  return (
                    <div
                      key={fld.id}
                      className={`p-4 rounded-xl bg-surface-container-low/60 border border-surface-container-high/40 space-y-2 ${
                        fld.type === 'content' || fld.type === 'image' ? 'md:col-span-2' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="font-label-sm text-label-sm font-semibold text-on-surface flex items-center gap-1.5">
                          <span>{fld.label}</span>
                          {fld.required && <span className="text-error">*</span>}
                        </label>
                        <span className="font-code text-code text-[10px] text-on-surface-variant px-2 py-0.5 rounded bg-surface-container">
                          {fld.type}
                        </span>
                      </div>

                      {/* Text */}
                      {fld.type === 'text' && (
                        <input
                          type="text"
                          required={fld.required}
                          value={val}
                          onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                          placeholder={fld.placeholder || ''}
                          className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}

                      {/* Number */}
                      {fld.type === 'number' && (
                        <input
                          type="number"
                          required={fld.required}
                          value={val}
                          onChange={(e) =>
                            handleCustomFieldChange(
                              fld.name,
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          placeholder={fld.placeholder || '0'}
                          className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}

                      {/* Boolean */}
                      {fld.type === 'boolean' && (
                        <label className="flex items-center gap-3 cursor-pointer py-1">
                          <input
                            type="checkbox"
                            checked={Boolean(val)}
                            onChange={(e) => handleCustomFieldChange(fld.name, e.target.checked)}
                            className="w-4 h-4 text-primary rounded border-surface-container-high focus:ring-primary"
                          />
                          <span className="font-body-sm text-body-sm text-on-surface font-medium">
                            Enable / Active
                          </span>
                        </label>
                      )}

                      {/* Date */}
                      {fld.type === 'date' && (
                        <input
                          type="date"
                          required={fld.required}
                          value={val}
                          onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                          className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}

                      {/* Image */}
                      {fld.type === 'image' && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                              placeholder="/media/..."
                              className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-code text-code text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setActiveImageField(fld.name);
                                setShowMediaPicker(true);
                              }}
                              className="px-3 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                            >
                              <span className="material-symbols-outlined text-[16px]">image</span>
                              <span>Select</span>
                            </button>
                          </div>
                          {val && (
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-container max-w-xs border border-surface-container-high/40 group">
                              <img src={getMediaUrl(val)} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleCustomFieldChange(fld.name, '')}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-error text-white rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Select */}
                      {fld.type === 'select' && (
                        <select
                          required={fld.required}
                          value={val}
                          onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                          className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Select an option...</option>
                          {fld.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* URL / Live Demo with ZIP Option */}
                      {fld.type === 'url' && (
                        <div className="space-y-2">
                          {fld.name.toLowerCase().includes('demo') && (
                            <div className="flex items-center gap-2 mb-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setDemoModes((prev) => ({ ...prev, [fld.name]: 'url' }))
                                }
                                className={`px-2.5 py-1 rounded-lg text-label-xs font-semibold ${
                                  (demoModes[fld.name] || 'url') === 'url'
                                    ? 'bg-primary text-on-primary'
                                    : 'bg-surface-container text-on-surface-variant'
                                }`}
                              >
                                Live URL
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDemoModes((prev) => ({ ...prev, [fld.name]: 'zip' }))
                                }
                                className={`px-2.5 py-1 rounded-lg text-label-xs font-semibold ${
                                  demoModes[fld.name] === 'zip'
                                    ? 'bg-primary text-on-primary'
                                    : 'bg-surface-container text-on-surface-variant'
                                }`}
                              >
                                Upload HTML/ZIP Bundle
                              </button>
                            </div>
                          )}

                          {demoModes[fld.name] === 'zip' ? (
                            <div className="p-3 border-2 border-dashed border-surface-container-high rounded-xl text-center space-y-2 bg-surface-container-lowest">
                              <input
                                type="file"
                                accept=".zip"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleDemoZipUpload(fld.name, file);
                                }}
                                disabled={uploadingZip}
                                className="hidden"
                                id={`zip-upload-${fld.name}`}
                              />
                              <label
                                htmlFor={`zip-upload-${fld.name}`}
                                className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold rounded-lg"
                              >
                                <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                                <span>{uploadingZip ? 'Extracting & Deploying...' : 'Select .ZIP File'}</span>
                              </label>
                              <p className="font-body-sm text-[11px] text-on-surface-variant">
                                Automatically unzips to public demo directory with index.html entry point.
                              </p>
                            </div>
                          ) : (
                            <div className="relative">
                              <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2">
                                link
                              </span>
                              <input
                                type="url"
                                required={fld.required}
                                value={val}
                                onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                                placeholder={fld.placeholder || 'https://example.com'}
                                className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl pl-9 pr-3.5 py-2 font-code text-code text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Email */}
                      {fld.type === 'email' && (
                        <div className="relative">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2">
                            mail
                          </span>
                          <input
                            type="email"
                            required={fld.required}
                            value={val}
                            onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                            placeholder={fld.placeholder || 'user@example.com'}
                            className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl pl-9 pr-3.5 py-2 font-code text-code text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      )}

                      {/* Content / Markdown */}
                      {fld.type === 'content' && (
                        <textarea
                          rows={4}
                          value={typeof val === 'string' ? val : JSON.stringify(val)}
                          onChange={(e) => handleCustomFieldChange(fld.name, e.target.value)}
                          placeholder="Rich content data or markdown..."
                          className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}

                      {fld.description && (
                        <p className="font-body-sm text-[11px] text-on-surface-variant">{fld.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Structured Content Block Editor */}
          {blueprint.hasContentEditor && (
            <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">article</span>
                  <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                    Structured Page Manuscript Canvas
                  </h2>
                </div>
                <span className="font-label-xs text-label-xs text-on-surface-variant font-medium">
                  Modular Content Blocks
                </span>
              </div>
              <StructuredEditor
                content={entry.content || { blocks: [] }}
                onChange={(content) => setEntry((prev) => ({ ...prev, content }))}
              />
            </div>
          )}

          {/* SEO Metadata Card */}
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl p-6 shadow-sm">
            <SEOFields
              seo={
                entry.seo || {
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
        </div>

        {/* Right Column (4 cols): Hero Media, Taxonomy, Metadata */}
        <div className="lg:col-span-4 space-y-6">
          {/* Featured Hero Image */}
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Featured Hero Image
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">image</span>
            </div>

            <div className="space-y-3">
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
                  <img
                    src={getMediaUrl(entry.featuredImage)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setEntry((prev) => ({ ...prev, featuredImage: '' }))}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-error text-white rounded-lg transition-colors"
                    title="Remove Image"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Taxonomy: Categories & Tags */}
          {(blueprint.hasCategories || blueprint.hasTags) && (
            <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl p-5 shadow-sm space-y-4">
              <span className="font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                Taxonomies & Routing
              </span>

              {blueprint.hasCategories && (
                <div className="space-y-1.5">
                  <label className="block font-label-xs text-label-xs font-medium text-on-surface-variant">
                    Primary Category
                  </label>
                  <input
                    type="text"
                    value={entry.category || ''}
                    onChange={(e) => setEntry((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g. general, research, case-studies"
                    className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {blueprint.hasTags && (
                <div className="space-y-2 pt-2 border-t border-surface-container-high/40">
                  <label className="block font-label-xs text-label-xs font-medium text-on-surface-variant">
                    Content Tags
                  </label>
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
                      className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3 py-1.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
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
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container font-label-xs text-label-xs font-medium text-on-surface"
                      >
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="text-on-surface-variant hover:text-error ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Blueprint Schema Specs Info Box */}
          <div className="bg-surface-container-low/60 border border-surface-container-high/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">architecture</span>
              <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                Schema Architecture
              </span>
            </div>
            <div className="space-y-1.5 font-body-sm text-body-sm text-on-surface-variant">
              <div className="flex justify-between">
                <span>Collection:</span>
                <span className="font-code font-semibold text-on-surface">{blueprint.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Slug:</span>
                <span className="font-code text-primary font-semibold">/{blueprint.slug}</span>
              </div>
              <div className="flex justify-between">
                <span>Custom Attributes:</span>
                <span className="font-semibold text-on-surface">{blueprint.fields.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Structured Blocks:</span>
                <span className="font-semibold text-on-surface">
                  {blueprint.hasContentEditor ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
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

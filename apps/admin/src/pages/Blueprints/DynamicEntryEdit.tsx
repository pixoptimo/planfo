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
  FileText
} from 'lucide-react';
import type { Blueprint, BlueprintEntry, BlueprintField } from '@cms/schemas';
import { api } from '../../api/client.js';
import { StructuredEditor } from '../../components/Editor/StructuredEditor.js';
import { SEOFields } from '../../components/SEO/SEOFields.js';
import { MediaPickerModal } from '../../components/Media/MediaPickerModal.js';
import { StatusBadge } from '../../components/UI/StatusBadge.js';
import { getBlueprintIcon } from '../../utils/blueprintIcons.js';
import { useAuth } from '../../context/AuthContext.js';

export const DynamicEntryEdit: React.FC = () => {
  const { blueprintSlug, entrySlug } = useParams<{ blueprintSlug: string; entrySlug?: string }>();
  const isNew = !entrySlug || entrySlug === 'new';
  const navigate = useNavigate();
  const { can } = useAuth();

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
      robots: 'index,follow'
    }
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [activeImageField, setActiveImageField] = useState<string | null>(null);

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
      if (isNew) {
        next.slug = val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
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
        <div className="flex items-center space-x-4">
          <Link
            to={`/blueprints/${blueprint.slug}`}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition"
            title={`Back to ${blueprint.name}`}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 mb-0.5">
              <span>{blueprint.name}</span>
              <span>/</span>
              <span>{isNew ? 'New Record' : entry.slug}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>
                {isNew ? `Create New ${blueprint.singularName}` : `Edit ${blueprint.singularName}`}
              </span>
              <StatusBadge status={entry.status || 'draft'} />
            </h1>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center space-x-3 self-start">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl flex items-center space-x-2 border border-slate-800 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Publish</span>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Inputs, Dynamic Fields, Content) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Base Fields Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {blueprint.singularName} Title *
              </label>
              <input
                type="text"
                required
                value={entry.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={`Enter ${blueprint.singularName.toLowerCase()} title...`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                URL Slug *
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-slate-500 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                  /{blueprint.slug}/
                </span>
                <input
                  type="text"
                  required
                  value={entry.slug || ''}
                  onChange={(e) => setEntry((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Summary / Excerpt
              </label>
              <textarea
                rows={2}
                value={entry.excerpt || ''}
                onChange={(e) => setEntry((prev) => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief summary or introductory blurb..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>
          </div>

          {/* Dynamic Custom Fields Section */}
          {blueprint.fields.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-brand-400" />
                  <h2 className="text-sm font-semibold text-slate-200 font-mono uppercase tracking-wider">
                    Custom Attributes & Fields
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {blueprint.fields.length} Configured Fields
                </span>
              </div>

              <div className="space-y-4">
                {blueprint.fields.map((fld: BlueprintField) => {
                  const val = entry.data?.[fld.name] ?? fld.defaultValue ?? '';

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
                              <img src={val} alt="" className="h-20 w-32 object-cover" />
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Type className="w-4 h-4 text-brand-400" />
                  <h2 className="text-sm font-semibold text-slate-200 font-mono uppercase tracking-wider">
                    Structured Content Blocks
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {entry.content?.blocks?.length || 0} Blocks
                </span>
              </div>

              <StructuredEditor
                content={entry.content || { blocks: [] }}
                onChange={(content) => setEntry((prev) => ({ ...prev, content }))}
              />
            </div>
          )}

          {/* SEO Metadata */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 font-mono uppercase tracking-wider">
              Search & Social Metadata
            </h2>
            <SEOFields
              seo={
                entry.seo || {
                  title: '',
                  description: '',
                  canonical: '',
                  ogTitle: '',
                  ogDescription: '',
                  ogImage: '',
                  robots: 'index,follow'
                }
              }
              onChange={(seo) => setEntry((prev) => ({ ...prev, seo }))}
            />
          </div>
        </div>

        {/* Right Column / Sidebar */}
        <div className="space-y-6">
          {/* Publishing Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
              Publishing Status
            </h3>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Current Status:</span>
              <StatusBadge status={entry.status || 'draft'} />
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{entry.status === 'published' ? 'Update & Publish' : 'Publish Record'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 border border-slate-800 transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
              Featured Image
            </h3>

            {entry.featuredImage ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950">
                  <img
                    src={entry.featuredImage}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setEntry((prev) => ({ ...prev, featuredImage: '' }))}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveImageField(null);
                    setShowMediaPicker(true);
                  }}
                  className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-800 transition"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveImageField(null);
                  setShowMediaPicker(true);
                }}
                className="w-full border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 text-center text-slate-400 hover:text-white transition flex flex-col items-center justify-center space-y-2"
              >
                <ImageIcon className="w-6 h-6 text-slate-500" />
                <span className="text-xs font-medium">Select Cover Image</span>
              </button>
            )}
          </div>

          {/* Categories & Tags */}
          {(blueprint.hasCategories || blueprint.hasTags) && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                Taxonomy & Tags
              </h3>

              {blueprint.hasCategories && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    value={entry.category || ''}
                    onChange={(e) => setEntry((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g. general, featured, updates"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              {blueprint.hasTags && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tags
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
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
                      placeholder="Add tag and press Enter..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 font-semibold"
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

          {/* Blueprint Schema Context Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2">
              <IconComp className="w-4 h-4 text-brand-400" />
              <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                Blueprint Info
              </h3>
            </div>
            <div className="text-xs text-slate-400 space-y-1.5 font-mono text-[11px]">
              <div>Name: <span className="text-white">{blueprint.name}</span></div>
              <div>Singular: <span className="text-white">{blueprint.singularName}</span></div>
              <div>Slug: <span className="text-white">/{blueprint.slug}</span></div>
              <div>Fields: <span className="text-white">{blueprint.fields.length}</span></div>
            </div>
            <Link
              to="/blueprints/studio"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 inline-flex items-center space-x-1 pt-1"
            >
              <span>Edit Blueprint Schema</span>
              <span>→</span>
            </Link>
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

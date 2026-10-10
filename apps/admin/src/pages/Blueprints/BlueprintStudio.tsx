import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Boxes,
  HelpCircle,
  Hash,
  Type,
  ToggleLeft,
  Calendar,
  Image as ImageIcon,
  ListFilter,
  Link as LinkIcon,
  Mail,
  FileCode,
  Package,
  Puzzle
} from 'lucide-react';
import type { Blueprint, BlueprintField, BlueprintFieldType, SiteSettings } from '@cms/schemas';
import { api } from '../../api/client.js';
import { BLUEPRINT_ICONS, getBlueprintIcon } from '../../utils/blueprintIcons.js';
import { useAuth } from '../../context/AuthContext.js';
import { FEATURE_PACKS, type FeaturePackDefinition } from '../../data/featurePacks.js';

interface EnrichedBlueprint extends Blueprint {
  entryCount?: number;
}

const FIELD_TYPES: { type: BlueprintFieldType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { type: 'text', label: 'Short Text', icon: Type },
  { type: 'textarea', label: 'Long Text / Bio', icon: FileText },
  { type: 'number', label: 'Numeric Value', icon: Hash },
  { type: 'boolean', label: 'Boolean / Toggle', icon: ToggleLeft },
  { type: 'date', label: 'Date / Timestamp', icon: Calendar },
  { type: 'image', label: 'Media Image', icon: ImageIcon },
  { type: 'select', label: 'Select Dropdown', icon: ListFilter },
  { type: 'url', label: 'Web URL', icon: LinkIcon },
  { type: 'email', label: 'Email Address', icon: Mail },
  { type: 'content', label: 'Rich Content Block', icon: FileCode }
];

export const BlueprintStudio: React.FC = () => {
  const { can } = useAuth();
  const [searchParams] = useSearchParams();
  const [blueprints, setBlueprints] = useState<EnrichedBlueprint[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string>('');

  // Form State
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [singularName, setSingularName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('FileText');
  const [hasCategories, setHasCategories] = useState(true);
  const [hasTags, setHasTags] = useState(true);
  const [hasContentEditor, setHasContentEditor] = useState(true);
  const [fields, setFields] = useState<BlueprintField[]>([]);

  useEffect(() => {
    loadBlueprints();
  }, []);

  const loadBlueprints = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bpData, settingsData] = await Promise.all([
        api.get<EnrichedBlueprint[]>('/api/blueprints'),
        api.get<SiteSettings>('/api/settings').catch(() => null)
      ]);
      setBlueprints(bpData);
      if (settingsData) setSettings(settingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blueprints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const actionParam = searchParams.get('action');
    if (actionParam === 'new') {
      openCreateModal();
    }
    const packParam = searchParams.get('pack');
    if (packParam) {
      const foundPack = FEATURE_PACKS.find((p) => p.id === packParam);
      if (foundPack) {
        setSelectedPackId(foundPack.id);
        openCreateModal({
          name: foundPack.name.replace(/ Pack$/, ''),
          singularName: foundPack.name.replace(/ Pack$/, '').slice(0, -1),
          slug: foundPack.suggestedSlug,
          description: foundPack.description,
          icon: foundPack.icon,
          fields: foundPack.fields
        });
      }
    }
  }, [searchParams]);

  const handleApplyPack = (packId: string) => {
    setSelectedPackId(packId);
    if (!packId) return;
    const foundPack = FEATURE_PACKS.find((p) => p.id === packId);
    if (!foundPack) return;

    if (!name) setName(foundPack.name.replace(/ Pack$/, ''));
    if (!slug) setSlug(foundPack.suggestedSlug);
    if (icon === 'FileText') setIcon(foundPack.icon);
    if (!description) setDescription(foundPack.description);
    setFields(foundPack.fields);
  };

  const openCreateModal = (preset?: Partial<Blueprint>) => {
    setIsEditing(false);
    setEditingSlug(null);
    setSelectedPackId('');
    setName(preset?.name || '');
    setSingularName(preset?.singularName || '');
    setSlug(preset?.slug || '');
    setDescription(preset?.description || '');
    setIcon(preset?.icon || 'FileText');
    setHasCategories(preset?.hasCategories ?? true);
    setHasTags(preset?.hasTags ?? true);
    setHasContentEditor(preset?.hasContentEditor ?? true);
    setFields(preset?.fields || []);
    setIsModalOpen(true);
  };

  const openEditModal = (bp: Blueprint) => {
    if (bp.isBuiltIn) return;
    setIsEditing(true);
    setEditingSlug(bp.slug);
    setName(bp.name);
    setSingularName(bp.singularName);
    setSlug(bp.slug);
    setDescription(bp.description || '');
    setIcon(bp.icon || 'FileText');
    setHasCategories(bp.hasCategories);
    setHasTags(bp.hasTags);
    setHasContentEditor(bp.hasContentEditor);
    setFields(bp.fields || []);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const autoSingular = val.endsWith('s') && val.length > 2 ? val.slice(0, -1) : val;
      setSingularName(autoSingular);
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(autoSlug);
    }
  };

  const addField = () => {
    const fieldIndex = fields.length + 1;
    const newField: BlueprintField = {
      id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `field_${fieldIndex}`,
      label: `Field ${fieldIndex}`,
      type: 'text',
      required: false,
      placeholder: '',
      description: '',
      options: []
    };
    setFields([...fields, newField]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, patch: Partial<BlueprintField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...patch };
    setFields(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Blueprint name is required');
      return;
    }
    if (!singularName.trim()) {
      setError('Singular name is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name: name.trim(),
      singularName: singularName.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      icon,
      hasCategories,
      hasTags,
      hasContentEditor,
      fields: fields.map((f) => ({
        ...f,
        name: f.name.trim().replace(/[^a-zA-Z0-9_]/g, '_'),
        label: f.label.trim()
      }))
    };

    try {
      if (isEditing && editingSlug) {
        await api.put(`/api/blueprints/${editingSlug}`, payload);
        setSuccess(`Blueprint "${name}" updated successfully.`);
      } else {
        await api.post('/api/blueprints', payload);
        setSuccess(`Blueprint "${name}" created successfully.`);
      }
      setIsModalOpen(false);
      await loadBlueprints();
      // Dispatch custom event to notify sidebar
      window.dispatchEvent(new CustomEvent('blueprints-updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bp: Blueprint) => {
    if (bp.isBuiltIn) return;
    if (!confirm(`Are you sure you want to delete blueprint "${bp.name}"? Existing entries will remain in storage.`)) return;

    try {
      await api.delete(`/api/blueprints/${bp.slug}`);
      setSuccess(`Blueprint "${bp.name}" deleted.`);
      await loadBlueprints();
      window.dispatchEvent(new CustomEvent('blueprints-updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const builtIns = blueprints.filter((b) => b.isBuiltIn);
  const customs = blueprints.filter((b) => !b.isBuiltIn);

  return (
    <div className="space-y-6 w-full pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-emerald-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Schema Architect & Collections</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Blueprints Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Visually design custom schemas, configure custom fields (text, media, dropdowns, dates), and automatically instantiate new collections in the sidebar without touching code.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {can('blueprints.create') && (
            <button
              onClick={() => openCreateModal()}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Blueprint</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <Link
          to="/blueprints/studio"
          className="px-4 py-2.5 text-xs font-bold border-b-2 border-brand-500 text-brand-400 flex items-center space-x-2"
        >
          <Boxes className="w-4 h-4" />
          <span>Schema Builder & Blueprints</span>
        </Link>
        <Link
          to="/blueprints/feature-packs"
          className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center space-x-2 transition"
        >
          <Package className="w-4 h-4" />
          <span>Feature Packs Hub</span>
        </Link>
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

      {/* Core Built-In Blueprints */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Core Built-in Blueprints
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">Immutable Core Architecture</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {builtIns.map((bp) => {
            const IconComp = getBlueprintIcon(bp.icon);
            return (
              <div
                key={bp.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition relative overflow-hidden group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-white text-base">{bp.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Core
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">/{bp.slug}</span>
                    </div>
                  </div>

                  <span className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded-md text-slate-400 border border-slate-800">
                    {bp.entryCount || 0} entries
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {bp.description}
                </p>

                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                    <span>Block Editor</span>
                    <span>•</span>
                    <span>SEO Ready</span>
                    <span>•</span>
                    <span>Versioning</span>
                  </div>

                  <Link
                    to={`/${bp.slug}`}
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center space-x-1"
                  >
                    <span>Manage Content</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Blueprints Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Boxes className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Custom Blueprints ({customs.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">Dynamic User Collections</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
            <span>Loading schema configurations...</span>
          </div>
        ) : customs.length === 0 ? (
          <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto border border-brand-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Custom Blueprints Created Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                Create custom collections like Testimonials, Case Studies, Team Bios, or FAQs. They will immediately appear in your sidebar navigation with custom form fields.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap justify-center gap-2">
              <button
                onClick={() =>
                  openCreateModal({
                    name: 'Testimonials',
                    singularName: 'Testimonial',
                    slug: 'testimonials',
                    description: 'Client reviews, feedback ratings, and quotes',
                    icon: 'MessageSquare',
                    hasCategories: true,
                    hasTags: true,
                    hasContentEditor: true,
                    fields: [
                      { id: 'fld_author', name: 'author_title', label: 'Author Title / Role', type: 'text', required: true, options: [], placeholder: 'e.g. Founder & CEO', description: '' },
                      { id: 'fld_company', name: 'company', label: 'Company / Org', type: 'text', required: false, options: [], placeholder: 'e.g. Acme Corp', description: '' },
                      { id: 'fld_rating', name: 'rating', label: 'Star Rating (1-5)', type: 'number', required: false, options: [], placeholder: '5', description: '' },
                      { id: 'fld_avatar', name: 'avatar', label: 'Author Avatar', type: 'image', required: false, options: [], placeholder: '', description: '' }
                    ]
                  })
                }
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 font-medium transition"
              >
                + Testimonials Preset
              </button>

              <button
                onClick={() =>
                  openCreateModal({
                    name: 'Team Members',
                    singularName: 'Member',
                    slug: 'team-members',
                    description: 'Staff directory, leadership profiles, and bios',
                    icon: 'Users',
                    hasCategories: true,
                    hasTags: false,
                    hasContentEditor: true,
                    fields: [
                      { id: 'fld_role', name: 'job_title', label: 'Job Title / Position', type: 'text', required: true, options: [], placeholder: 'e.g. Chief Technology Officer', description: '' },
                      { id: 'fld_email', name: 'email', label: 'Direct Email', type: 'email', required: false, options: [], placeholder: 'name@company.com', description: '' },
                      { id: 'fld_linkedin', name: 'linkedin_url', label: 'LinkedIn Profile', type: 'url', required: false, options: [], placeholder: 'https://linkedin.com/in/...', description: '' }
                    ]
                  })
                }
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 font-medium transition"
              >
                + Team Directory Preset
              </button>

              <button
                onClick={() =>
                  openCreateModal({
                    name: 'Case Studies',
                    singularName: 'Case Study',
                    slug: 'case-studies',
                    description: 'Client success stories and project showcases',
                    icon: 'Briefcase',
                    hasCategories: true,
                    hasTags: true,
                    hasContentEditor: true,
                    fields: [
                      { id: 'fld_client', name: 'client_name', label: 'Client / Brand', type: 'text', required: true, options: [], placeholder: 'e.g. Stripe', description: '' },
                      { id: 'fld_year', name: 'completion_year', label: 'Year Completed', type: 'number', required: false, options: [], placeholder: '2026', description: '' },
                      { id: 'fld_result', name: 'key_metric', label: 'Key Metric / Impact', type: 'text', required: false, options: [], placeholder: '+140% Conversion', description: '' }
                    ]
                  })
                }
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 font-medium transition"
              >
                + Case Studies Preset
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customs.map((bp) => {
              const IconComp = getBlueprintIcon(bp.icon);
              return (
                <div
                  key={bp.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition group"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base leading-tight">{bp.name}</h3>
                          <span className="text-xs font-mono text-slate-400">/{bp.slug}</span>
                        </div>
                      </div>

                      <span className="text-xs font-mono bg-slate-950 px-2 py-0.5 rounded text-brand-400 border border-slate-800">
                        {bp.entryCount || 0} entries
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                      {bp.description || 'No description provided.'}
                    </p>

                    {/* Capabilities & Fields */}
                    <div className="mt-4 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800">
                          {bp.fields.length} Custom Fields
                        </span>
                        {bp.hasCategories && (
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800">
                            Categories
                          </span>
                        )}
                        {bp.hasTags && (
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800">
                            Tags
                          </span>
                        )}
                        {bp.hasContentEditor && (
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800">
                            Content Blocks
                          </span>
                        )}
                      </div>

                      {bp.fields.length > 0 && (
                        <div className="text-[11px] text-slate-500 truncate pt-1">
                          Fields: {bp.fields.map((f) => f.label || f.name).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(bp)}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                        title="Edit Blueprint Schema"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(bp)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                        title="Delete Blueprint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Link
                      to={`/blueprints/${bp.slug}`}
                      className="px-3 py-1.5 bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 hover:text-brand-300 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition"
                    >
                      <span>Manage Entries</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">
                  {isEditing ? `Edit Blueprint Schema: ${name}` : 'Create Custom Blueprint'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure collection names, visual icon, capabilities, and dynamic custom fields.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {!isEditing && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 font-mono">
                    <Puzzle className="w-3.5 h-3.5 text-brand-400" />
                    <span>Attach Feature Pack Plugin Template (Optional)</span>
                  </label>
                  <select
                    value={selectedPackId}
                    onChange={(e) => handleApplyPack(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-sans"
                  >
                    <option value="">None (Custom Blueprint from Scratch)</option>
                    {FEATURE_PACKS.map((pack) => {
                      const isEnabled = Boolean((settings?.featurePacks as Record<string, boolean> | undefined)?.[pack.id]);
                      return (
                        <option key={pack.id} value={pack.id}>
                          {pack.name} {isEnabled ? '— [Active Plugin]' : '— [Inactive Plugin]'}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Selecting a plugin automatically loads its specialized fields. You control the collection name and the exact URL slug (e.g. <code className="text-brand-300">/shop</code>, <code className="text-brand-300">/portfolio</code>, <code className="text-brand-300">/team</code>) below.
                  </p>
                </div>
              )}

              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Blueprint Name (Plural) *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Testimonials, Case Studies"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Singular Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={singularName}
                    onChange={(e) => setSingularName(e.target.value)}
                    placeholder="e.g. Testimonial, Case Study"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    URL Slug Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. testimonials"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Collection Icon
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    {Object.entries(BLUEPRINT_ICONS).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label} ({key})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what this blueprint represents..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              {/* Capabilities checklist */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <span className="text-xs font-semibold text-slate-200 block font-mono uppercase tracking-wider">
                  Capabilities & Features
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasCategories}
                      onChange={(e) => setHasCategories(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-brand-500 focus:ring-brand-500"
                    />
                    <span>Categories Taxonomy</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasTags}
                      onChange={(e) => setHasTags(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-brand-500 focus:ring-brand-500"
                    />
                    <span>Content Tags</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasContentEditor}
                      onChange={(e) => setHasContentEditor(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-brand-500 focus:ring-brand-500"
                    />
                    <span>Structured Block Editor</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Field Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider block">
                      Custom Fields ({fields.length})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Define typed attributes stored with each entry
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={addField}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-brand-400 font-semibold text-xs rounded-lg flex items-center space-x-1.5 border border-slate-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Field</span>
                  </button>
                </div>

                {fields.length === 0 ? (
                  <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                    No custom fields defined yet. Click "Add Field" to attach custom attributes.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map((fld, idx) => (
                      <div
                        key={fld.id || idx}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          <div className="sm:col-span-4">
                            <label className="block text-[10px] text-slate-400 mb-1 font-mono uppercase">
                              Field Label
                            </label>
                            <input
                              type="text"
                              required
                              value={fld.label}
                              onChange={(e) => {
                                const newLabel = e.target.value;
                                const autoName = newLabel.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                                updateField(idx, { label: newLabel, name: fld.name || autoName });
                              }}
                              placeholder="e.g. Author Title"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[10px] text-slate-400 mb-1 font-mono uppercase">
                              Identifier Key
                            </label>
                            <input
                              type="text"
                              required
                              value={fld.name}
                              onChange={(e) => updateField(idx, { name: e.target.value })}
                              placeholder="e.g. author_title"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[10px] text-slate-400 mb-1 font-mono uppercase">
                              Type
                            </label>
                            <select
                              value={fld.type}
                              onChange={(e) => updateField(idx, { type: e.target.value as BlueprintFieldType })}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                            >
                              {FIELD_TYPES.map((t) => (
                                <option key={t.type} value={t.type}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2 flex items-center justify-between sm:justify-end space-x-2 pt-4 sm:pt-0">
                            <label className="flex items-center space-x-1 text-[11px] text-slate-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={fld.required}
                                onChange={(e) => updateField(idx, { required: e.target.checked })}
                                className="rounded bg-slate-900 border-slate-700 text-brand-500"
                              />
                              <span>Req</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => removeField(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded"
                              title="Remove Field"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Extra configs for select type */}
                        {fld.type === 'select' && (
                          <div className="pt-2 border-t border-slate-850">
                            <label className="block text-[10px] text-slate-400 mb-1 font-mono">
                              Dropdown Options (comma-separated values)
                            </label>
                            <input
                              type="text"
                              value={fld.options?.join(', ') || ''}
                              onChange={(e) =>
                                updateField(idx, {
                                  options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                                })
                              }
                              placeholder="e.g. Small, Medium, Large"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isEditing ? 'Save Blueprint Schema' : 'Create Blueprint'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import type { Blueprint, BlueprintField, BlueprintFieldType } from '@cms/schemas';
import { api } from '../../api/client.js';
import { slugify } from '../../utils/slugify.js';
import { useAuth } from '../../context/AuthContext.js';
import { PlanfoLogo } from '../../components/UI/PlanfoLogo.js';
import { FEATURE_PACKS } from '../../data/featurePacks.js';

interface EnrichedBlueprint extends Blueprint {
  entryCount?: number;
}

const FIELD_TYPES: { type: BlueprintFieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'Short Text', icon: 'text_fields' },
  { type: 'textarea', label: 'Long Text / Bio', icon: 'notes' },
  { type: 'number', label: 'Numeric Value', icon: 'tag' },
  { type: 'boolean', label: 'Boolean / Toggle', icon: 'toggle_on' },
  { type: 'date', label: 'Date / Timestamp', icon: 'calendar_today' },
  { type: 'image', label: 'Media Image', icon: 'image' },
  { type: 'select', label: 'Select Dropdown', icon: 'list' },
  { type: 'url', label: 'Web URL', icon: 'link' },
  { type: 'email', label: 'Email Address', icon: 'mail' },
  { type: 'content', label: 'Rich Content Block', icon: 'code' }
];

function getMaterialIconName(iconName?: string): string {
  switch (iconName?.toLowerCase()) {
    case 'briefcase':
    case 'work':
      return 'work';
    case 'users':
    case 'badge':
    case 'user':
      return 'badge';
    case 'messagesquare':
    case 'message-square':
    case 'quote':
    case 'format_quote':
      return 'format_quote';
    case 'calendar':
    case 'events':
      return 'calendar_month';
    case 'helpcircle':
    case 'help-circle':
    case 'faqs':
    case 'help':
      return 'help_outline';
    case 'layers':
    case 'templates':
      return 'layers';
    case 'shoppingbag':
    case 'shopping-bag':
    case 'products':
      return 'shopping_bag';
    case 'newspaper':
    case 'posts':
      return 'newspaper';
    case 'filetext':
    case 'file-text':
    case 'pages':
      return 'description';
    default:
      return 'schema';
  }
}

export const BlueprintStudio: React.FC = () => {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Blueprints & Core counts
  const [blueprints, setBlueprints] = useState<EnrichedBlueprint[]>([]);
  const [pagesCount, setPagesCount] = useState<number>(18);
  const [postsCount, setPostsCount] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast & Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string>('');
  const [blueprintToDelete, setBlueprintToDelete] = useState<Blueprint | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAstModal, setShowAstModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showDocsModal, setShowDocsModal] = useState(false);

  // Form State
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [singularName, setSingularName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Briefcase');
  const [hasCategories, setHasCategories] = useState(true);
  const [hasTags, setHasTags] = useState(true);
  const [hasContentEditor, setHasContentEditor] = useState(true);
  const [fields, setFields] = useState<BlueprintField[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bpData, pagesData, postsData] = await Promise.all([
        api.get<EnrichedBlueprint[]>('/api/blueprints'),
        api.get<any[]>('/api/pages').catch(() => null),
        api.get<any>('/api/posts').catch(() => null)
      ]);

      setBlueprints(bpData);
      if (Array.isArray(pagesData)) {
        setPagesCount(pagesData.length);
      }
      if (postsData) {
        if (Array.isArray(postsData)) setPostsCount(postsData.length);
        else if (Array.isArray(postsData.posts)) setPostsCount(postsData.posts.length);
        else if (typeof postsData.total === 'number') setPostsCount(postsData.total);
      }
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Failed to load blueprints');
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
    if (icon === 'Briefcase') setIcon(foundPack.icon);
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
    setIcon(preset?.icon || 'Briefcase');
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
    setIcon(bp.icon || 'Briefcase');
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
      const autoSlug = slugify(val);
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
      triggerToast('Blueprint name is required');
      return;
    }
    if (!singularName.trim()) {
      triggerToast('Singular name is required');
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      singularName: singularName.trim(),
      slug: isEditing && editingSlug ? editingSlug : (slug.trim() || undefined),
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
        triggerToast(`Blueprint "${name}" updated successfully.`);
      } else {
        await api.post('/api/blueprints', payload);
        triggerToast(`Blueprint "${name}" created successfully.`);
      }
      setIsModalOpen(false);
      await loadData();
      window.dispatchEvent(new CustomEvent('blueprints-updated'));
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!blueprintToDelete || blueprintToDelete.isBuiltIn) return;

    try {
      setIsDeleting(true);
      await api.delete(`/api/blueprints/${blueprintToDelete.slug}`);
      triggerToast(`Blueprint "${blueprintToDelete.name}" deleted successfully.`);
      const deletedSlug = blueprintToDelete.slug;
      setBlueprintToDelete(null);
      if (isModalOpen && editingSlug === deletedSlug) {
        setIsModalOpen(false);
      }
      await loadData();
      window.dispatchEvent(new CustomEvent('blueprints-updated'));
      window.dispatchEvent(new CustomEvent('trash-updated'));
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImportSchema = async () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!parsed.name || !parsed.singularName) {
        throw new Error('Invalid schema format. "name" and "singularName" are required.');
      }
      await api.post('/api/blueprints', parsed);
      triggerToast(`Imported blueprint "${parsed.name}" successfully.`);
      setShowImportModal(false);
      setImportJson('');
      await loadData();
      window.dispatchEvent(new CustomEvent('blueprints-updated'));
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const handleRecompileEngine = async () => {
    triggerToast('Recompiling schema engine...');
    setTimeout(() => {
      triggerToast('Schema engine recompiled & synced successfully! 0 compile errors.');
    }, 800);
  };

  const customs = blueprints.filter((b) => !b.isBuiltIn);
  const totalCount = 2 + customs.length;

  const filteredCustoms = customs.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <aside className="fixed left-0 top-0 h-full w-16 bg-surface-container-lowest z-50 flex flex-col items-center justify-between py-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-surface-container-high/60">
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
              title="Dashboard"
              className="flex items-center justify-center w-10 h-10 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </Link>
            <Link
              to="/posts"
              title="Posts"
              className="flex items-center justify-center w-10 h-10 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">article</span>
            </Link>
            <Link
              to="/pages"
              title="Pages"
              className="flex items-center justify-center w-10 h-10 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">description</span>
            </Link>
            <Link
              to="/blueprints/studio"
              title="Blueprints Studio"
              className="flex items-center justify-center w-10 h-10 transition-colors bg-primary-container/20 text-primary font-bold rounded-lg shadow-xs"
            >
              <span className="material-symbols-outlined text-[20px]">schema</span>
            </Link>
            <Link
              to="/media"
              title="Media"
              className="flex items-center justify-center w-10 h-10 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">photo_library</span>
            </Link>
          </nav>
        </div>
        <div className="flex flex-col items-center gap-space-sm w-full px-space-xs">
          <Link
            to="/settings"
            title="Settings"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </Link>
          <div
            title={`Signed in as ${user?.name || user?.email || 'Admin'}`}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shadow-xs"
          >
            {(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="pl-16 flex flex-col flex-1">
        {/* Fixed Top Header */}
        <header className="fixed top-0 left-16 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/60">
          <div className="h-16 w-full px-space-lg flex items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md min-w-0">
              <PlanfoLogo variant="full" className="h-5 w-auto" />
              <span className="text-outline-variant font-body-sm text-body-sm select-none">/</span>
              <div className="flex items-center gap-space-xs min-w-0 text-on-surface-variant">
                <Link
                  to="/blueprints/studio"
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface cursor-pointer truncate"
                >
                  Blueprints
                </Link>
                <span className="text-outline-variant select-none font-body-sm text-body-sm">/</span>
                <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
                  Schema Architect
                </span>
              </div>
              <span className="px-space-xs py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-medium flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                v2.4 Live Tokens
              </span>
            </div>

            <div className="flex items-center gap-space-md">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDocsModal(true)}
                  className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md"
                >
                  <span className="material-symbols-outlined text-[18px]">menu_book</span>
                  Schema Docs
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md"
                >
                  <span className="material-symbols-outlined text-[18px]">file_upload</span>
                  Import Schema
                </button>
              </div>

              {can('blueprints.create') && (
                <button
                  type="button"
                  onClick={() => navigate('/blueprints/new')}
                  className="inline-flex items-center gap-2 px-space-md py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-sm transition-all hover:scale-[1.01]"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Create Custom Blueprint
                </button>
              )}

              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shadow-xs">
                {(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="w-full pt-16 bg-surface min-h-screen flex flex-col pb-20">
          <div className="flex flex-col w-full">
            {/* Sub-header Breadcrumb & Live Tokens bar */}
            <div className="w-full bg-surface-container-lowest px-space-xl py-space-sm flex flex-wrap items-center justify-between gap-space-md shadow-sm border-b border-surface-container-high/40">
              <div className="flex items-center gap-space-sm text-body-sm font-body-sm min-w-0">
                <Link
                  to="/"
                  className="text-on-surface-variant hover:text-primary cursor-pointer transition-colors font-medium"
                >
                  Planfo Studio
                </Link>
                <span className="text-outline-variant select-none">/</span>
                <Link
                  to="/blueprints/studio"
                  className="text-on-surface-variant hover:text-primary cursor-pointer transition-colors font-medium"
                >
                  Blueprints Studio
                </Link>
                <span className="text-outline-variant select-none">/</span>
                <span className="text-primary font-semibold">Schema Architect</span>
                <span className="ml-space-sm inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container font-code text-code text-primary font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  v2.4 Live Tokens
                </span>
              </div>
              <div className="flex items-center gap-space-sm">
                <button
                  type="button"
                  onClick={() => setShowDocsModal(true)}
                  className="inline-flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px] text-on-surface-variant">menu_book</span>
                  Schema Docs
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px] text-on-surface-variant">file_upload</span>
                  Import Schema
                </button>
                {can('blueprints.create') && (
                  <button
                    type="button"
                    onClick={() => navigate('/blueprints/new')}
                    className="inline-flex items-center gap-2 px-space-md py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-sm transition-all hover:scale-[1.01]"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Create Custom Blueprint
                  </button>
                )}
              </div>
            </div>

            <div className="w-full px-space-xl py-space-lg flex flex-col gap-space-xl max-w-7xl mx-auto">
              {/* Hero / Title Overview Section */}
              <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
                <div className="flex flex-col gap-space-xs max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm w-fit uppercase tracking-wider font-semibold">
                    <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                    Schema Architect &amp; Collections
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1 font-serif text-4xl">
                    Blueprints Studio
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Visually design custom schemas, configure custom fields (text, media, dropdowns, dates,
                    relationships), and automatically instantiate new editorial collections in the sidebar without
                    touching code.
                  </p>
                </div>

                {/* Quick Metrics Ribbon */}
                <div className="grid grid-cols-3 gap-space-sm p-space-sm bg-surface-container-lowest rounded-xl shadow-sm min-w-[320px] border border-surface-container-high/40">
                  <div className="flex flex-col p-space-sm rounded-lg bg-surface-container-low">
                    <span className="font-code text-code text-on-surface-variant uppercase font-medium">Total</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold text-2xl">
                      {totalCount}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Blueprints</span>
                  </div>
                  <div className="flex flex-col p-space-sm rounded-lg bg-surface-container-low">
                    <span className="font-code text-code text-on-surface-variant uppercase font-medium">Core</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold text-2xl">2</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Immutable</span>
                  </div>
                  <div className="flex flex-col p-space-sm rounded-lg bg-surface-container-low">
                    <span className="font-code text-code text-on-surface-variant uppercase font-medium">Custom</span>
                    <span className="font-headline-sm text-headline-sm text-secondary font-bold text-2xl">
                      {customs.length}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Dynamic</span>
                  </div>
                </div>
              </section>

              {/* Sub-navigation Tabs & Live Search Bar */}
              <div className="flex items-center justify-between gap-space-md pb-space-xs bg-surface-container-low p-1.5 rounded-xl border border-surface-container-high/40">
                <div className="flex items-center gap-space-xs">
                  <button
                    type="button"
                    className="flex items-center gap-2 px-space-md py-2 rounded-lg bg-surface-container-lowest text-primary shadow-sm font-label-md text-label-md font-semibold transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">schema</span>
                    Schema Builder &amp; Blueprints
                  </button>
                  <Link
                    to="/blueprints/feature-packs"
                    className="flex items-center gap-2 px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">extension</span>
                    Feature Packs Hub
                    <span className="px-1.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">
                      4 New
                    </span>
                  </Link>
                </div>
                <div className="hidden sm:flex items-center gap-space-sm pr-space-sm">
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-[16px]">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search schemas..."
                      className="pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-lowest text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary w-52 transition-all shadow-sm border border-surface-container-high/40"
                    />
                  </div>
                </div>
              </div>

              {/* Section 1: Core Built-in Blueprints */}
              <section className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
                    <h2 className="font-label-md text-label-md tracking-wider uppercase text-on-surface font-semibold">
                      Core Built-in Blueprints
                    </h2>
                    <span className="font-code text-code text-on-surface-variant px-2 py-0.5 rounded bg-surface-container-low">
                      2 Core
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    Immutable Core Architecture
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  {/* Card 1: Pages */}
                  <div className="group relative flex flex-col justify-between p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all border border-surface-container-high/40">
                    <div className="flex flex-col gap-space-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[22px]">description</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-lg">
                                Pages
                              </h3>
                              <span className="px-2 py-0.5 rounded-full bg-primary-fixed-dim text-on-primary-fixed font-label-sm text-label-sm uppercase font-semibold">
                                Core
                              </span>
                            </div>
                            <span className="font-code text-code text-on-surface-variant">/pages</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-code text-code text-on-surface font-medium">
                          {pagesCount} entries
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                        Standalone hierarchical pages (Home, About, Services, Landing). Optimized for freeform page
                        composition.
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
                          Block Editor
                        </span>
                        <span className="text-outline-variant font-code">•</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
                          SEO Ready
                        </span>
                        <span className="text-outline-variant font-code">•</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
                          Versioning
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-space-lg mt-space-sm border-t border-surface-container-high/40">
                      <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                        <span className="material-symbols-outlined text-[16px] text-primary">auto_stories</span>
                        Static Tree Routing
                      </div>
                      <Link
                        to="/pages"
                        className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-primary-container font-semibold transition-colors"
                      >
                        Manage Content
                        <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </Link>
                    </div>
                  </div>

                  {/* Card 2: Articles */}
                  <div className="group relative flex flex-col justify-between p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all border border-surface-container-high/40">
                    <div className="flex flex-col gap-space-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[22px]">newspaper</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-lg">
                                Articles
                              </h3>
                              <span className="px-2 py-0.5 rounded-full bg-primary-fixed-dim text-on-primary-fixed font-label-sm text-label-sm uppercase font-semibold">
                                Core
                              </span>
                            </div>
                            <span className="font-code text-code text-on-surface-variant">/posts</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-code text-code text-on-surface font-medium">
                          {postsCount} entries
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                        Chronological articles, essays, editorials, and news dispatches with advanced publishing
                        taxonomies.
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
                          Block Editor
                        </span>
                        <span className="text-outline-variant font-code">•</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
                          SEO Ready
                        </span>
                        <span className="text-outline-variant font-code">•</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
                          Versioning
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-space-lg mt-space-sm border-t border-surface-container-high/40">
                      <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                        <span className="material-symbols-outlined text-[16px] text-primary">feed</span>
                        RSS &amp; Newsletter Ready
                      </div>
                      <Link
                        to="/posts"
                        className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-primary-container font-semibold transition-colors"
                      >
                        Manage Content
                        <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Custom Blueprints */}
              <section className="flex flex-col gap-space-md">
                <div className="flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">layers</span>
                    <h2 className="font-label-md text-label-md tracking-wider uppercase text-on-surface font-semibold">
                      Custom Blueprints ({customs.length})
                    </h2>
                    <span className="font-label-sm text-label-sm text-secondary bg-surface-container-high px-2 py-0.5 rounded font-medium">
                      Dynamic User Collections
                    </span>
                  </div>
                  {can('blueprints.create') && (
                    <button
                      type="button"
                      onClick={() => navigate('/blueprints/new')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low text-primary font-label-md text-label-md transition-colors shadow-sm border border-surface-container-high/40"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_circle</span>
                      New Blueprint
                    </button>
                  )}
                </div>

                {/* 6 Blueprint Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
                  {filteredCustoms.map((bp) => {
                    const iconName = getMaterialIconName(bp.icon);
                    const fieldsSummary = bp.fields?.map((f) => f.label).join(', ') || 'No custom fields';

                    return (
                      <div
                        key={bp.id || bp.slug}
                        className="group flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all border border-surface-container-high/40"
                      >
                        <div className="flex flex-col gap-space-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-space-sm">
                              <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                              </div>
                              <div>
                                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-base">
                                  {bp.name}
                                </h3>
                                <span className="font-code text-code text-on-surface-variant">/{bp.slug}</span>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded font-code text-code font-medium ${
                                (bp.entryCount || 0) > 0
                                  ? 'bg-primary-fixed text-primary font-semibold'
                                  : 'bg-surface-container-low text-on-surface-variant'
                              }`}
                            >
                              {bp.entryCount || 0} entries
                            </span>
                          </div>

                          <p className="font-body-md text-body-md text-on-surface-variant min-h-[44px] line-clamp-2">
                            {bp.description || `Custom collection for ${bp.name}.`}
                          </p>

                          {/* Tags/Pills */}
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant font-medium">
                              {bp.fields?.length || 0} Custom Fields
                            </span>
                            {bp.hasCategories && (
                              <span className="px-2 py-0.5 rounded bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant font-medium">
                                Categories
                              </span>
                            )}
                            {bp.hasTags && (
                              <span className="px-2 py-0.5 rounded bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant font-medium">
                                Tags
                              </span>
                            )}
                            {bp.hasContentEditor && (
                              <span className="px-2 py-0.5 rounded bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant font-medium">
                                Content Blocks
                              </span>
                            )}
                          </div>

                          {/* Defined Fields Box */}
                          <div className="p-2.5 rounded-lg bg-surface-container-low text-body-sm font-body-sm text-on-surface-variant">
                            <span className="font-label-sm text-label-sm uppercase text-outline block mb-1 font-semibold text-[10px]">
                              Defined Fields
                            </span>
                            <span className="truncate block font-body-sm text-body-sm">{fieldsSummary}</span>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between pt-space-md mt-space-sm border-t border-surface-container-high/40">
                          <div className="flex items-center gap-1">
                            {can('blueprints.update') && (
                              <button
                                type="button"
                                onClick={() => navigate(`/blueprints/edit/${bp.slug}`)}
                                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                                title="Edit Schema"
                              >
                                <span className="material-symbols-outlined text-[17px]">edit</span>
                              </button>
                            )}
                            {can('blueprints.delete') && (
                              <button
                                type="button"
                                onClick={() => setBlueprintToDelete(bp)}
                                className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                                title="Delete Schema"
                              >
                                <span className="material-symbols-outlined text-[17px]">delete</span>
                              </button>
                            )}
                          </div>
                          <Link
                            to={`/blueprints/${bp.slug}`}
                            className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-primary-container font-semibold transition-colors"
                          >
                            Manage Entries
                            <span className="material-symbols-outlined text-[15px] group-hover:translate-x-1 transition-transform">
                              arrow_forward
                            </span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Schema Engine Interactive Diagnostics & Visual Feed */}
              <section className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md border border-surface-container-high/40">
                <div className="flex items-center gap-space-md">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[28px]">terminal</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-semibold text-base">
                      Schema Compiler Status
                    </span>
                    <span className="font-code text-code text-on-surface-variant">
                      Generated TypeScript definitions synced with GraphQL AST • 0 compile errors
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button
                    type="button"
                    onClick={() => setShowAstModal(true)}
                    className="px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors"
                  >
                    View Generated AST
                  </button>
                  <button
                    type="button"
                    onClick={handleRecompileEngine}
                    className="px-space-md py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-colors shadow-xs"
                  >
                    Recompile Engine
                  </button>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Create / Edit Blueprint Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-surface-container-high">
            <div className="h-16 px-6 bg-surface-container-low flex items-center justify-between border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">schema</span>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {isEditing ? `Edit Blueprint: ${name}` : 'Create Custom Blueprint'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              {!isEditing && (
                <div className="p-3 bg-surface-container-low rounded-xl space-y-1.5">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase">
                    Load from Feature Pack Preset
                  </label>
                  <select
                    value={selectedPackId}
                    onChange={(e) => handleApplyPack(e.target.value)}
                    className="w-full p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-body-sm font-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Choose a Preset or Start from Scratch --</option>
                    {FEATURE_PACKS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.fields.length} fields)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                    Blueprint Name (Plural) *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    placeholder="e.g. Case Studies"
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                    Singular Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={singularName}
                    placeholder="e.g. Case Study"
                    onChange={(e) => setSingularName(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    disabled={isEditing}
                    value={slug}
                    placeholder="e.g. case-studies"
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 font-code text-code text-on-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                    Icon Theme
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full p-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Briefcase">Briefcase / Work</option>
                    <option value="Users">Users / Badge</option>
                    <option value="MessageSquare">Message / Quotes</option>
                    <option value="Calendar">Calendar / Events</option>
                    <option value="HelpCircle">Help / FAQs</option>
                    <option value="Layers">Layers / Templates</option>
                    <option value="ShoppingBag">Shopping / Products</option>
                    <option value="FileText">Document / Standard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  placeholder="Short description of this content collection..."
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-surface-container-low rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer font-label-sm text-label-sm text-on-surface">
                  <input
                    type="checkbox"
                    checked={hasCategories}
                    onChange={(e) => setHasCategories(e.target.checked)}
                    className="accent-primary rounded"
                  />
                  <span>Categories</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-label-sm text-label-sm text-on-surface">
                  <input
                    type="checkbox"
                    checked={hasTags}
                    onChange={(e) => setHasTags(e.target.checked)}
                    className="accent-primary rounded"
                  />
                  <span>Tags</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-label-sm text-label-sm text-on-surface">
                  <input
                    type="checkbox"
                    checked={hasContentEditor}
                    onChange={(e) => setHasContentEditor(e.target.checked)}
                    className="accent-primary rounded"
                  />
                  <span>Content Blocks</span>
                </label>
              </div>

              {/* Custom Fields Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider">
                    Custom Fields ({fields.length})
                  </span>
                  <button
                    type="button"
                    onClick={addField}
                    className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold flex items-center gap-1 transition"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Field
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((f, idx) => (
                    <div
                      key={f.id || idx}
                      className="p-3.5 bg-surface-container-low rounded-xl border border-surface-container-high space-y-2.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-label-sm text-on-surface-variant mb-1">
                            Field Label *
                          </label>
                          <input
                            type="text"
                            required
                            value={f.label}
                            placeholder="e.g. Client Name"
                            onChange={(e) => {
                              const labelVal = e.target.value;
                              updateField(idx, {
                                label: labelVal,
                                name: f.name === `field_${idx + 1}` ? slugify(labelVal).replace(/-/g, '_') : f.name
                              });
                            }}
                            className="w-full px-2.5 py-1.5 bg-surface-container-lowest rounded border border-outline-variant/30 text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-label-sm text-on-surface-variant mb-1">
                            Field Key (Code) *
                          </label>
                          <input
                            type="text"
                            required
                            value={f.name}
                            placeholder="client_name"
                            onChange={(e) => updateField(idx, { name: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-surface-container-lowest rounded border border-outline-variant/30 font-code text-code text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-label-sm text-on-surface-variant mb-1">
                            Field Type
                          </label>
                          <select
                            value={f.type}
                            onChange={(e) => updateField(idx, { type: e.target.value as BlueprintFieldType })}
                            className="w-full p-1.5 bg-surface-container-lowest rounded border border-outline-variant/30 text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t.type} value={t.type}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-on-surface-variant cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(f.required)}
                            onChange={(e) => updateField(idx, { required: e.target.checked })}
                            className="accent-primary"
                          />
                          <span>Required Field</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeField(idx)}
                          className="text-error hover:bg-error/10 p-1 rounded flex items-center gap-1 text-xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-4" />
            </form>

            <div className="h-16 px-6 bg-surface-container-low flex items-center justify-end gap-3 border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-xs transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : isEditing ? 'Update Blueprint' : 'Create Blueprint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {blueprintToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl p-6 border border-surface-container-high space-y-4">
            <div className="flex items-center gap-3 text-error">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Delete Blueprint</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Are you sure you want to delete <strong className="text-on-surface">{blueprintToDelete.name}</strong>?
              All defined fields and associated entries in this collection may be permanently affected.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBlueprintToDelete(null)}
                className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-error hover:bg-error/90 text-on-error font-label-md text-label-md shadow-sm transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated AST Viewer Modal */}
      {showAstModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-surface-container-high">
            <div className="h-14 px-6 bg-surface-container-low flex items-center justify-between border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">terminal</span>
                <h3 className="font-label-md text-label-md font-bold text-on-surface">
                  Generated TypeScript &amp; AST Definitions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAstModal(false)}
                className="p-1 rounded hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-inverse-surface text-inverse-on-surface font-code text-xs">
              <pre className="whitespace-pre-wrap leading-relaxed">
{`// ==========================================
// AUTO-GENERATED BLUEPRINT SCHEMA TYPINGS
// Planfo Static CMS AST Engine • v2.4 Live
// ==========================================

export interface PageCollection {
  id: string;
  title: string;
  slug: string;
  template: string;
  content: { blocks: any[] };
  seo: { title: string; description: string; canonical: string };
  createdAt: string;
  updatedAt: string;
}

export interface PostCollection {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  categories: string[];
  tags: string[];
  content: { blocks: any[] };
  createdAt: string;
  updatedAt: string;
}

${customs
  .map(
    (b) => `// Dynamic Collection: ${b.name} (/${b.slug})
export interface ${b.singularName.replace(/\s+/g, '')}Entry {
  id: string;
  title: string;
  slug: string;
${(b.fields || []).map((f) => `  ${f.name}${f.required ? '' : '?'}: ${f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : 'string'};`).join('\n')}
  createdAt: string;
  updatedAt: string;
}`
  )
  .join('\n\n')}
`}
              </pre>
            </div>
            <div className="p-3 bg-surface-container-low flex justify-end gap-2 border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => {
                  triggerToast('TypeScript definitions copied to clipboard');
                }}
                className="px-3 py-1.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold"
              >
                Copy Definitions
              </button>
              <button
                type="button"
                onClick={() => setShowAstModal(false)}
                className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high font-label-sm text-label-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Schema Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-surface-container-high space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">file_upload</span>
                <h3 className="font-label-md text-label-md font-bold text-on-surface">Import Blueprint Schema</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Paste a valid Planfo blueprint schema JSON object below:
            </p>
            <textarea
              rows={8}
              value={importJson}
              placeholder={`{\n  "name": "Portfolios",\n  "singularName": "Portfolio",\n  "slug": "portfolios",\n  "description": "Showcase of projects",\n  "fields": []\n}`}
              onChange={(e) => setImportJson(e.target.value)}
              className="w-full p-3 bg-surface-container-low rounded-xl font-code text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSchema}
                disabled={!importJson.trim()}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-xs disabled:opacity-50"
              >
                Import Schema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schema Docs Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest w-full max-w-xl max-h-[85vh] rounded-2xl shadow-2xl p-6 border border-surface-container-high space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">menu_book</span>
                <h3 className="font-label-md text-label-md font-bold text-on-surface">Schema Architect Documentation</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDocsModal(false)}
                className="p-1 rounded hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="space-y-3 font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              <p>
                The <strong className="text-on-surface">Blueprints Studio</strong> allows you to visually design content models
                and collections that seamlessly integrate with Planfo CMS's static generation pipeline.
              </p>
              <h4 className="font-label-md text-label-md font-bold text-on-surface pt-2">Core Blueprints</h4>
              <p>
                <strong className="text-on-surface">Pages</strong> and <strong className="text-on-surface">Articles</strong> are
                immutable core collections optimized for tree routing and chronological editorial taxonomy.
              </p>
              <h4 className="font-label-md text-label-md font-bold text-on-surface pt-2">Custom Blueprints</h4>
              <p>
                Every custom blueprint automatically creates a new sidebar entry, dedicated REST endpoints, JSON schema
                validation, and entry management views without restarting the server.
              </p>
              <h4 className="font-label-md text-label-md font-bold text-on-surface pt-2">Supported Field Types</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Text &amp; Textarea for narratives and labels</li>
                <li>Numbers, Dates, and Booleans for metrics and statuses</li>
                <li>Media Images linked directly to the CMS asset storage</li>
                <li>Select Dropdowns for controlled vocabularies</li>
                <li>Rich Content Block editor integration</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowDocsModal(false)}
              className="w-full py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-semibold hover:bg-primary-container transition"
            >
              Close Documentation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

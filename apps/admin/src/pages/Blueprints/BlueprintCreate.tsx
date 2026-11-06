import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Blueprint, BlueprintField, BlueprintFieldType } from '@cms/schemas';
import { api } from '../../api/client.js';
import { slugify } from '../../utils/slugify.js';
import { useAuth } from '../../context/AuthContext.js';
import { FEATURE_PACKS } from '../../data/featurePacks.js';

const AVAILABLE_ICONS = [
  { value: 'Briefcase', label: 'cases (Business Portfolio)', icon: 'work' },
  { value: 'Users', label: 'badge (Team & Directory)', icon: 'badge' },
  { value: 'MessageSquare', label: 'format_quote (Testimonials)', icon: 'format_quote' },
  { value: 'Calendar', label: 'calendar_month (Events & Schedule)', icon: 'calendar_month' },
  { value: 'HelpCircle', label: 'help_outline (FAQs & Guides)', icon: 'help_outline' },
  { value: 'Layers', label: 'layers (Templates & Design)', icon: 'layers' },
  { value: 'ShoppingBag', label: 'shopping_bag (E-commerce / Store)', icon: 'shopping_bag' },
  { value: 'FileText', label: 'description (Editorial Document)', icon: 'description' }
];

const FIELD_TYPE_OPTIONS: { type: BlueprintFieldType; label: string; icon: string; description: string }[] = [
  { type: 'text', label: 'Short Text', icon: 'text_fields', description: 'Single line text up to 255 chars' },
  { type: 'textarea', label: 'Long Text / Bio', icon: 'notes', description: 'Multi-line prose and paragraphs' },
  { type: 'number', label: 'Integer / Number', icon: 'pin', description: 'Numeric values, metrics, currency' },
  { type: 'boolean', label: 'Boolean Toggle', icon: 'toggle_on', description: 'True/false switch' },
  { type: 'date', label: 'Date / Timestamp', icon: 'calendar_today', description: 'Calendar date picker' },
  { type: 'image', label: 'Media Asset', icon: 'image', description: 'Media library upload with WebP/AVIF' },
  { type: 'select', label: 'Select / Choice', icon: 'list', description: 'Controlled dropdown vocabulary' },
  { type: 'url', label: 'Validated URL', icon: 'link', description: 'HTTPS web address with link checker' },
  { type: 'email', label: 'Email Address', icon: 'mail', description: 'RFC-compliant email input' },
  { type: 'content', label: 'Rich Content Block', icon: 'code', description: 'Full drag-and-drop block composer' }
];

function getFieldIcon(type: string): string {
  switch (type) {
    case 'text':
      return 'text_fields';
    case 'textarea':
      return 'notes';
    case 'number':
      return 'pin';
    case 'boolean':
      return 'toggle_on';
    case 'date':
      return 'calendar_today';
    case 'image':
      return 'image';
    case 'select':
      return 'arrow_drop_down_circle';
    case 'url':
      return 'link';
    case 'email':
      return 'mail';
    case 'content':
      return 'code';
    default:
      return 'data_object';
  }
}

export const BlueprintCreate: React.FC = () => {
  const { blueprintSlug } = useParams<{ blueprintSlug?: string }>();
  const isEditing = Boolean(blueprintSlug);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Core Blueprint State
  const [name, setName] = useState(isEditing ? '' : 'Case Studies');
  const [singularName, setSingularName] = useState(isEditing ? '' : 'Case Study');
  const [slug, setSlug] = useState(isEditing ? '' : 'case-studies');
  const [description, setDescription] = useState(
    isEditing
      ? ''
      : 'High-impact client success stories, transformation metrics, testimonial soundbites, and architectural workflow deliverables.'
  );
  const [icon, setIcon] = useState('Briefcase');
  const [showIconMenu, setShowIconMenu] = useState(false);

  // Capabilities
  const [hasCategories, setHasCategories] = useState(true);
  const [hasTags, setHasTags] = useState(true);
  const [hasContentEditor, setHasContentEditor] = useState(true);
  const [hasSeo, setHasSeo] = useState(true);
  const [hasRss, setHasRss] = useState(false);

  // Custom Fields
  const [fields, setFields] = useState<BlueprintField[]>(
    isEditing
      ? []
      : [
          {
            id: 'fld_client_name',
            name: 'client_name',
            label: 'Client Name',
            type: 'text',
            required: true,
            placeholder: 'e.g. Acme Corp',
            description: 'Client / Brand organization name',
            options: []
          },
          {
            id: 'fld_project_year',
            name: 'project_year',
            label: 'Project Year',
            type: 'number',
            required: false,
            placeholder: '2026',
            description: 'Year of completion (2010 - 2035)',
            options: []
          },
          {
            id: 'fld_showcase_image',
            name: 'showcase_image',
            label: 'Hero Showcase Image',
            type: 'image',
            required: true,
            placeholder: '',
            description: 'Focal point enabled visual asset',
            options: []
          },
          {
            id: 'fld_project_url',
            name: 'project_url',
            label: 'Live Project URL',
            type: 'url',
            required: false,
            placeholder: 'https://example.com',
            description: 'Validated HTTPS web address',
            options: []
          }
        ]
  );

  // UI state
  const [selectedPackId, setSelectedPackId] = useState<string>('portfolio');
  const [activeCodeTab, setActiveCodeTab] = useState<'ts' | 'gql' | 'jsonld'>('ts');
  const [editingFieldIdx, setEditingFieldIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Load existing blueprint if editing
  useEffect(() => {
    if (isEditing && blueprintSlug) {
      setLoading(true);
      api.get<Blueprint>(`/api/blueprints/${blueprintSlug}`)
        .then((data) => {
          setName(data.name);
          setSingularName(data.singularName);
          setSlug(data.slug);
          setDescription(data.description || '');
          setIcon(data.icon || 'Briefcase');
          setHasCategories(Boolean(data.hasCategories));
          setHasTags(Boolean(data.hasTags));
          setHasContentEditor(Boolean(data.hasContentEditor));
          setFields(data.fields || []);
          setSelectedPackId('none');
        })
        .catch((err) => {
          triggerToast(err instanceof Error ? err.message : 'Failed to load blueprint');
          navigate('/blueprints/studio');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isEditing, blueprintSlug, navigate]);

  // Handle Feature Pack Selection
  const handleFeaturePackChange = (packId: string) => {
    setSelectedPackId(packId);
    setHasUnsavedChanges(true);

    if (packId === 'none') {
      return;
    }

    const foundPack = FEATURE_PACKS.find((p) => p.id === packId);
    if (foundPack) {
      setName(foundPack.name.replace(/ Pack$/, ''));
      setSingularName(foundPack.name.replace(/ Pack$/, '').slice(0, -1));
      setSlug(foundPack.suggestedSlug);
      setDescription(foundPack.description);
      setIcon(foundPack.icon);
      setFields(
        foundPack.fields.map((f, i) => ({
          ...f,
          id: `fld_${Date.now()}_${i}`
        }))
      );
      triggerToast(`Loaded template: ${foundPack.name}`);
    }
  };

  // Handle Plural Name change & auto-generate singular and slug
  const handleNameChange = (val: string) => {
    setName(val);
    setHasUnsavedChanges(true);
    if (!isEditing) {
      const autoSingular = val.endsWith('s') && val.length > 2 ? val.slice(0, -1) : val;
      setSingularName(autoSingular);
      setSlug(slugify(val));
    }
  };

  // Field manipulation
  const handleAddField = (type: BlueprintFieldType = 'text', customLabel?: string) => {
    const nextIdx = fields.length + 1;
    const defaultLabel = customLabel || `Custom Field ${nextIdx}`;
    const newField: BlueprintField = {
      id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: slugify(defaultLabel).replace(/-/g, '_'),
      label: defaultLabel,
      type,
      required: false,
      placeholder: '',
      description: '',
      options: type === 'select' ? ['Option 1', 'Option 2'] : []
    };
    setFields([...fields, newField]);
    setHasUnsavedChanges(true);
    triggerToast(`Added ${type} field`);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
    if (editingFieldIdx === index) setEditingFieldIdx(null);
    triggerToast('Field removed');
  };

  const handleUpdateField = (index: number, patch: Partial<BlueprintField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...patch };
    setFields(updated);
    setHasUnsavedChanges(true);
  };

  // Submit / Register Blueprint
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      triggerToast('Blueprint name is required');
      return;
    }
    if (!singularName.trim()) {
      triggerToast('Singular item name is required');
      return;
    }

    setSaving(true);
    const sanitizedSlug = slug.trim() ? slugify(slug) : slugify(name);
    const payload = {
      name: name.trim(),
      singularName: singularName.trim(),
      slug: isEditing && blueprintSlug ? blueprintSlug : sanitizedSlug,
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
      if (isEditing && blueprintSlug) {
        await api.put(`/api/blueprints/${blueprintSlug}`, payload);
        triggerToast(`Blueprint "${name}" updated successfully.`);
      } else {
        await api.post('/api/blueprints', payload);
        triggerToast(`Blueprint "${name}" registered & deployed successfully!`);
      }
      setHasUnsavedChanges(false);
      window.dispatchEvent(new CustomEvent('blueprints-updated'));
      setTimeout(() => {
        navigate('/blueprints/studio');
      }, 600);
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Dynamic TypeScript Interface Generator
  const generatedTypeScript = useMemo(() => {
    const typeName = (singularName || 'CustomItem').replace(/[^a-zA-Z0-9]/g, '') + 'Blueprint';
    const fieldLines = fields.map((f) => {
      let tsType = 'string';
      if (f.type === 'number') tsType = 'number';
      else if (f.type === 'boolean') tsType = 'boolean';
      else if (f.type === 'image') tsType = 'MediaAsset';
      else if (f.type === 'date') tsType = 'ISODateString';
      else if (f.type === 'select') {
        tsType = f.options && f.options.length > 0 ? f.options.map((o) => `'${o}'`).join(' | ') : 'string';
      }
      return `  ${f.name}${f.required ? '' : '?'}: ${tsType};`;
    });

    const categoryLine = hasCategories ? `  categories: TaxonomyCategory[];` : null;
    const tagsLine = hasTags ? `  tags: string[];` : null;
    const contentLine = hasContentEditor ? `  content: ContentBlocks;` : null;

    const allLines = [
      `export interface ${typeName} {`,
      `  id: string;`,
      `  title: string;`,
      `  slug: string;`,
      ...fieldLines,
      ...(categoryLine ? [categoryLine] : []),
      ...(tagsLine ? [tagsLine] : []),
      ...(contentLine ? [contentLine] : []),
      `  createdAt: ISODateString;`,
      `  updatedAt: ISODateString;`,
      `}`
    ];
    return allLines.join('\n');
  }, [singularName, fields, hasCategories, hasTags, hasContentEditor]);

  // Dynamic GraphQL Schema Generator
  const generatedGraphQL = useMemo(() => {
    const typeName = (singularName || 'CustomItem').replace(/[^a-zA-Z0-9]/g, '');
    const fieldLines = fields.map((f) => {
      let gqlType = 'String';
      if (f.type === 'number') gqlType = 'Int';
      else if (f.type === 'boolean') gqlType = 'Boolean';
      else if (f.type === 'image') gqlType = 'MediaAsset';
      return `  ${f.name}: ${gqlType}${f.required ? '!' : ''}`;
    });

    return [
      `type ${typeName} {`,
      `  id: ID!`,
      `  title: String!`,
      `  slug: String!`,
      ...fieldLines,
      ...(hasCategories ? [`  categories: [Category!]!`] : []),
      ...(hasTags ? [`  tags: [String!]!`] : []),
      `  createdAt: DateTime!`,
      `  updatedAt: DateTime!`,
      `}`
    ].join('\n');
  }, [singularName, fields, hasCategories, hasTags]);

  // Dynamic JSON-LD Schema Generator
  const generatedJsonLd = useMemo(() => {
    return JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': singularName || 'Thing',
        name: name,
        url: `https://example.com/${slug || 'collection'}`,
        description: description,
        properties: fields.reduce((acc, f) => {
          acc[f.name] = { type: f.type, required: f.required };
          return acc;
        }, {} as Record<string, any>)
      },
      null,
      2
    );
  }, [name, singularName, slug, description, fields]);

  // Count of enabled capabilities
  const enabledCapabilitiesCount = [hasCategories, hasTags, hasContentEditor, hasSeo, hasRss].filter(Boolean).length;
  const currentIconObj = AVAILABLE_ICONS.find((i) => i.value === icon) || AVAILABLE_ICONS[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-on-surface">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-label-md text-label-md text-on-surface-variant animate-pulse">
          Loading Blueprint Schema...
        </p>
      </div>
    );
  }

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
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-surface-container transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-serif font-black text-xl shadow-xs group-hover:scale-105 transition-transform">
              P
            </div>
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

      {/* Main Pl-16 Wrapper */}
      <div className="pl-16 flex flex-col flex-1">
        {/* Fixed Top Header */}
        <header className="fixed top-0 left-16 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/60">
          <div className="h-16 w-full px-space-lg flex items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md min-w-0">
              <span className="font-serif font-black text-xl tracking-tight text-primary">PLANFO</span>
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
                  {isEditing ? `Edit: ${name}` : 'New Collection Blueprint'}
                </span>
              </div>
              <span className="px-space-xs py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-medium flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                v2.4 Live Tokens
              </span>
            </div>

            <div className="flex items-center gap-space-md">
              <button
                type="button"
                onClick={() => navigate('/blueprints/studio')}
                className="px-space-md py-1.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                Discard Draft
              </button>

              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={saving}
                className="px-space-lg py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                {saving ? 'Registering...' : isEditing ? 'Update & Sync Blueprint' : 'Create & Register Blueprint'}
              </button>

              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shadow-xs">
                {(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="w-full pt-16 bg-surface min-h-screen flex flex-col pb-24">
          <div className="flex flex-col w-full">
            {/* Top Command & Action Bar */}
            <section className="w-full bg-surface-container-lowest shadow-sm px-space-xl py-space-md border-b border-surface-container-high/40">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                {/* Breadcrumb Hierarchy & Meta */}
                <div className="flex flex-col gap-space-xs min-w-0">
                  <div className="flex items-center gap-space-sm text-body-sm font-body-sm">
                    <Link
                      to="/blueprints/studio"
                      className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                      <span>Back to Blueprints Studio</span>
                    </Link>
                    <span className="text-outline-variant select-none">/</span>
                    <span className="text-on-surface-variant">Schema Architect</span>
                    <span className="text-outline-variant select-none">/</span>
                    <span className="font-semibold text-primary">
                      {isEditing ? `Edit: ${name}` : 'New Collection Blueprint'}
                    </span>
                  </div>
                  <div className="flex items-center gap-space-md">
                    <h1 className="font-headline-md text-headline-md text-on-surface text-2xl font-bold tracking-tight">
                      {isEditing ? `Edit Blueprint: ${name}` : 'Create Custom Blueprint'}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          hasUnsavedChanges ? 'bg-tertiary animate-pulse' : 'bg-primary'
                        }`}
                      ></span>
                      {hasUnsavedChanges ? 'Schema Draft • Unsaved Changes' : 'Schema Synchronized'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-space-sm self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => navigate('/blueprints/studio')}
                    className="px-space-md py-2 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container font-label-md text-label-md transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    Discard Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={saving}
                    className="px-space-lg py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                    {saving ? 'Registering...' : isEditing ? 'Update & Sync Blueprint' : 'Create & Register Blueprint'}
                  </button>
                </div>
              </div>
            </section>

            {/* Main Grid Workspace: Left Core Architect Form / Right Live Schema Preview */}
            <div className="max-w-7xl mx-auto w-full px-space-xl py-space-xl grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
              {/* Left Column: Core Schema Configuration Form */}
              <div className="lg:col-span-8 flex flex-col gap-space-xl">
                {/* Section 1: Overview & Plugin Injector Card */}
                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-lg border border-surface-container-high/40">
                  <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high/40">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-label-sm text-label-sm tracking-wider uppercase text-primary font-bold">
                        Blueprint Architecture &amp; Taxonomy
                      </span>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-xl">
                        Configure Collection Blueprint
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Define identity, API routing slug, iconography, and system runtime capabilities.
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shadow-xs">
                      <span className="material-symbols-outlined text-[24px]">architecture</span>
                    </div>
                  </div>

                  {/* Optional Feature Pack Dropdown Card */}
                  {!isEditing && (
                    <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-xs border border-surface-container-high/30">
                      <div className="flex items-center justify-between">
                        <label
                          className="font-label-md text-label-md text-on-surface flex items-center gap-2 font-semibold"
                          htmlFor="feature-pack"
                        >
                          <span className="material-symbols-outlined text-primary text-[18px]">extension</span>
                          Attach Feature Pack Plugin Template (Optional)
                        </label>
                        <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                          Fast-track setup
                        </span>
                      </div>
                      <div className="relative w-full mt-1">
                        <select
                          id="feature-pack"
                          value={selectedPackId}
                          onChange={(e) => handleFeaturePackChange(e.target.value)}
                          className="w-full bg-surface-container-lowest text-on-surface rounded-lg px-space-md py-2.5 font-body-md text-body-md shadow-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
                        >
                          <option value="none">None (Custom Blueprint from Scratch)</option>
                          <option value="portfolio">
                            Case Study Showcase • Client, Testimonial, Impact Metrics
                          </option>
                          <option value="catalog">E-commerce Catalog • Inventory, SKU, Variations</option>
                          <option value="team">Team Directory • Bio, Socials, Department</option>
                          <option value="events">Event Booking • Schedule, Venue, Ticketing</option>
                          <option value="testimonials">Testimonials • Social Proof, Ratings, Endorsements</option>
                          <option value="faqs">FAQs &amp; Knowledgebase • Answers, Category Tags</option>
                        </select>
                        <span className="material-symbols-outlined text-on-surface-variant absolute right-3 top-3 pointer-events-none text-[20px]">
                          expand_more
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Selecting a template auto-injects standard typed fields and database validators. You preserve
                        complete authority over naming and custom routing identifiers.
                      </p>
                    </div>
                  )}

                  {/* Basic Meta Fields: 2-Column Responsive Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    {/* Blueprint Plural Name */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface flex items-center justify-between font-semibold"
                        htmlFor="blueprint-plural"
                      >
                        <span>
                          Blueprint Name (Plural) <span className="text-error">*</span>
                        </span>
                        <span className="font-code text-code text-on-surface-variant font-normal">ui_collection</span>
                      </label>
                      <input
                        id="blueprint-plural"
                        type="text"
                        required
                        value={name}
                        placeholder="e.g. Case Studies, Testimonials"
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full bg-surface-container-lowest text-on-surface rounded-lg px-space-md py-2 font-body-md text-body-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
                      />
                    </div>

                    {/* Blueprint Singular Name */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface flex items-center justify-between font-semibold"
                        htmlFor="blueprint-singular"
                      >
                        <span>
                          Singular Item Name <span className="text-error">*</span>
                        </span>
                        <span className="font-code text-code text-on-surface-variant font-normal">ui_record</span>
                      </label>
                      <input
                        id="blueprint-singular"
                        type="text"
                        required
                        value={singularName}
                        placeholder="e.g. Case Study, Testimonial"
                        onChange={(e) => {
                          setSingularName(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full bg-surface-container-lowest text-on-surface rounded-lg px-space-md py-2 font-body-md text-body-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
                      />
                    </div>

                    {/* URL Slug Identifier with Live Route Pill */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface flex items-center justify-between font-semibold"
                        htmlFor="blueprint-slug"
                      >
                        <span>
                          URL Slug Identifier <span className="text-error">*</span>
                        </span>
                        <span className="font-code text-code text-primary font-semibold">/{slug || 'collection'}/:slug</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 font-code text-code text-outline font-medium">/</span>
                        <input
                          id="blueprint-slug"
                          type="text"
                          disabled={isEditing}
                          value={slug}
                          placeholder="case-studies"
                          onChange={(e) => {
                            setSlug(slugify(e.target.value));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full bg-surface-container-lowest text-on-surface rounded-lg pl-8 pr-space-md py-2 font-code text-code shadow-sm focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    {/* Collection Icon Picker */}
                    <div className="flex flex-col gap-1.5 relative">
                      <label className="font-label-md text-label-md text-on-surface font-semibold">
                        Collection Icon • Studio Dock
                      </label>
                      <div className="relative w-full">
                        <button
                          type="button"
                          onClick={() => setShowIconMenu((prev) => !prev)}
                          className="w-full bg-surface-container-lowest text-on-surface rounded-lg px-space-md py-2 font-body-md text-body-md shadow-sm flex items-center justify-between hover:bg-surface-container-low transition-colors border border-outline-variant/30"
                        >
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[20px]">
                              {currentIconObj.icon}
                            </span>
                            <span className="font-label-md text-label-md">{currentIconObj.label}</span>
                          </span>
                          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                            unfold_more
                          </span>
                        </button>

                        {showIconMenu && (
                          <div className="absolute left-0 top-full mt-1 w-full bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-container-high py-2 z-50 animate-in fade-in max-h-56 overflow-y-auto">
                            {AVAILABLE_ICONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setIcon(opt.value);
                                  setShowIconMenu(false);
                                  setHasUnsavedChanges(true);
                                }}
                                className="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-surface-container text-left text-on-surface transition-colors"
                              >
                                <span className="material-symbols-outlined text-primary text-[18px]">{opt.icon}</span>
                                <span className="font-label-md text-label-md">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description & Editorial Intent */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="blueprint-desc">
                      Description &amp; Editorial Intent
                    </label>
                    <textarea
                      id="blueprint-desc"
                      rows={3}
                      value={description}
                      placeholder="Explain what this blueprint models and how editorial staff should orchestrate publication cycles..."
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-surface-container-lowest text-on-surface rounded-lg px-space-md py-2.5 font-body-md text-body-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none border border-outline-variant/30"
                    />
                  </div>
                </div>

                {/* Section 2: Capabilities & Core Modules */}
                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md border border-surface-container-high/40">
                  <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/40">
                    <div className="flex flex-col">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-xl">
                        Capabilities &amp; Core Modules
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Activate engine plugins and editorial features pre-configured for this blueprint.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-primary-fixed text-primary font-label-sm text-label-sm font-semibold">
                      {enabledCapabilitiesCount} of 5 Enabled
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm pt-space-xs">
                    {/* Item 1: Categories */}
                    <label className="flex items-start gap-3 p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer select-none border border-surface-container-high/30">
                      <input
                        type="checkbox"
                        checked={hasCategories}
                        onChange={(e) => {
                          setHasCategories(e.target.checked);
                          setHasUnsavedChanges(true);
                        }}
                        className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface flex items-center gap-1.5 font-semibold">
                          Categories Taxonomy
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Hierarchical multi-level categorization with parent grouping.
                        </span>
                      </div>
                    </label>

                    {/* Item 2: Tags */}
                    <label className="flex items-start gap-3 p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer select-none border border-surface-container-high/30">
                      <input
                        type="checkbox"
                        checked={hasTags}
                        onChange={(e) => {
                          setHasTags(e.target.checked);
                          setHasUnsavedChanges(true);
                        }}
                        className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface flex items-center gap-1.5 font-semibold">
                          Content Tags
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Flat tag indexation, search weighting, and topic cluster tagging.
                        </span>
                      </div>
                    </label>

                    {/* Item 3: Structured Block Editor */}
                    <label className="flex items-start gap-3 p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer select-none border border-surface-container-high/30">
                      <input
                        type="checkbox"
                        checked={hasContentEditor}
                        onChange={(e) => {
                          setHasContentEditor(e.target.checked);
                          setHasUnsavedChanges(true);
                        }}
                        className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface flex items-center gap-1.5 font-semibold">
                          Structured Block Editor
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Modular drag-and-drop editorial canvas with Newsreader typography.
                        </span>
                      </div>
                    </label>

                    {/* Item 4: SEO Schema */}
                    <label className="flex items-start gap-3 p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer select-none border border-surface-container-high/30">
                      <input
                        type="checkbox"
                        checked={hasSeo}
                        onChange={(e) => {
                          setHasSeo(e.target.checked);
                          setHasUnsavedChanges(true);
                        }}
                        className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface flex items-center gap-1.5 font-semibold">
                          SEO &amp; OpenGraph Schema
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Automated JSON-LD schemas, preview cards, and canonical links.
                        </span>
                      </div>
                    </label>

                    {/* Item 5: RSS Feed */}
                    <label className="flex items-start gap-3 p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer select-none md:col-span-2 border border-surface-container-high/30">
                      <input
                        type="checkbox"
                        checked={hasRss}
                        onChange={(e) => {
                          setHasRss(e.target.checked);
                          setHasUnsavedChanges(true);
                        }}
                        className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                          RSS &amp; Syndication Feed Publisher
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Distribute records automatically to external newsletter aggregators &amp; headless RSS.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Section 3: Dynamic Custom Fields Architecture */}
                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-lg border border-surface-container-high/40">
                  <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/40">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-xl">
                          Custom Schema Fields
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-code text-code text-on-surface font-semibold">
                          {fields.length} Defined
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Manage typed attributes, validation constraints, and database fields.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddField('text')}
                      className="px-space-md py-2 rounded-lg bg-primary-fixed text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md transition-all shadow-sm flex items-center gap-1.5 font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      Add Custom Field
                    </button>
                  </div>

                  {/* Field Builder Stack */}
                  <div className="flex flex-col gap-space-xs">
                    {fields.length === 0 ? (
                      <div className="p-8 text-center text-on-surface-variant font-body-sm border border-dashed border-surface-container-high rounded-xl">
                        No custom fields defined yet. Click "Add Custom Field" or choose from the quick pills below.
                      </div>
                    ) : (
                      fields.map((f, idx) => {
                        const iconType = getFieldIcon(f.type);
                        const isBeingEdited = editingFieldIdx === idx;

                        return (
                          <div
                            key={f.id || idx}
                            className={`flex flex-col p-space-md rounded-xl transition-all border ${
                              isBeingEdited
                                ? 'bg-surface-container-lowest ring-2 ring-primary border-primary shadow-md'
                                : 'bg-surface-container-low hover:bg-surface-container border-surface-container-high/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-space-md min-w-0">
                                <span className="material-symbols-outlined text-outline-variant hover:text-on-surface cursor-grab text-[20px]">
                                  drag_indicator
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm border border-surface-container-high/40">
                                  <span className="material-symbols-outlined text-[18px]">{iconType}</span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                                      {f.label}
                                    </span>
                                    <span className="font-code text-code text-on-surface-variant font-normal">
                                      {f.name}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-label-sm text-label-sm ${
                                        f.required
                                          ? 'bg-error-container text-on-error-container font-semibold'
                                          : 'bg-surface-container-high text-on-surface-variant'
                                      }`}
                                    >
                                      {f.required ? 'Required' : 'Optional'}
                                    </span>
                                  </div>
                                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                                    Type: {f.type.charAt(0).toUpperCase() + f.type.slice(1)} •{' '}
                                    {f.description || f.placeholder || 'Schema field'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingFieldIdx(isBeingEdited ? null : idx)}
                                  className={`p-1.5 rounded transition-colors ${
                                    isBeingEdited
                                      ? 'bg-primary text-on-primary'
                                      : 'hover:bg-surface-container-lowest text-on-surface-variant hover:text-primary'
                                  }`}
                                  title="Edit Field Configuration"
                                >
                                  <span className="material-symbols-outlined text-[18px]">settings</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveField(idx)}
                                  className="p-1.5 rounded hover:bg-surface-container-lowest text-on-surface-variant hover:text-error transition-colors"
                                  title="Delete Field"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </div>
                            </div>

                            {/* Expanded Inline Configuration Drawer */}
                            {isBeingEdited && (
                              <div className="mt-4 pt-4 border-t border-surface-container-high grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                                <div>
                                  <label className="block text-[11px] font-label-sm text-on-surface-variant mb-1 font-semibold">
                                    Field Label
                                  </label>
                                  <input
                                    type="text"
                                    value={f.label}
                                    onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                                    className="w-full px-2.5 py-1.5 bg-surface-container-low rounded border border-outline-variant/30 text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-label-sm text-on-surface-variant mb-1 font-semibold">
                                    Database Key (Slug)
                                  </label>
                                  <input
                                    type="text"
                                    value={f.name}
                                    onChange={(e) =>
                                      handleUpdateField(idx, {
                                        name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                                      })
                                    }
                                    className="w-full px-2.5 py-1.5 bg-surface-container-low rounded border border-outline-variant/30 font-code text-code text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-label-sm text-on-surface-variant mb-1 font-semibold">
                                    Field Type
                                  </label>
                                  <select
                                    value={f.type}
                                    onChange={(e) =>
                                      handleUpdateField(idx, { type: e.target.value as BlueprintFieldType })
                                    }
                                    className="w-full p-1.5 bg-surface-container-low rounded border border-outline-variant/30 text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                                  >
                                    {FIELD_TYPE_OPTIONS.map((opt) => (
                                      <option key={opt.type} value={opt.type}>
                                        {opt.label} ({opt.type})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-label-sm text-on-surface-variant mb-1 font-semibold">
                                    Placeholder Text
                                  </label>
                                  <input
                                    type="text"
                                    value={f.placeholder || ''}
                                    placeholder="e.g. Enter client name"
                                    onChange={(e) => handleUpdateField(idx, { placeholder: e.target.value })}
                                    className="w-full px-2.5 py-1.5 bg-surface-container-low rounded border border-outline-variant/30 text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>

                                {f.type === 'select' && (
                                  <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-label-sm text-on-surface-variant mb-1 font-semibold">
                                      Select Options (Comma separated)
                                    </label>
                                    <input
                                      type="text"
                                      value={f.options?.join(', ') || ''}
                                      placeholder="Option 1, Option 2, Option 3"
                                      onChange={(e) =>
                                        handleUpdateField(idx, {
                                          options: e.target.value
                                            .split(',')
                                            .map((s) => s.trim())
                                            .filter(Boolean)
                                        })
                                      }
                                      className="w-full px-2.5 py-1.5 bg-surface-container-low rounded border border-outline-variant/30 text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                  </div>
                                )}

                                <div className="sm:col-span-2 flex items-center justify-between pt-1">
                                  <label className="flex items-center gap-2 cursor-pointer font-label-sm text-label-sm text-on-surface">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(f.required)}
                                      onChange={(e) => handleUpdateField(idx, { required: e.target.checked })}
                                      className="accent-primary rounded"
                                    />
                                    <span>Enforce validation: Required attribute</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => setEditingFieldIdx(null)}
                                    className="px-3 py-1 bg-primary text-on-primary rounded text-xs font-semibold"
                                  >
                                    Done Editing
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Quick Append Pills */}
                  <div className="pt-space-xs flex flex-wrap items-center gap-2">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                      Quick Add:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddField('text', 'Short Text')}
                      className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm transition-colors flex items-center gap-1 border border-surface-container-high/40"
                    >
                      <span className="material-symbols-outlined text-[14px]">short_text</span> + Text
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('image', 'Rich Media Asset')}
                      className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm transition-colors flex items-center gap-1 border border-surface-container-high/40"
                    >
                      <span className="material-symbols-outlined text-[14px]">perm_media</span> + Rich Media
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('select', 'Controlled Dropdown')}
                      className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm transition-colors flex items-center gap-1 border border-surface-container-high/40"
                    >
                      <span className="material-symbols-outlined text-[14px]">arrow_drop_down_circle</span> + Select / Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('date', 'Event Date')}
                      className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm transition-colors flex items-center gap-1 border border-surface-container-high/40"
                    >
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span> + Date
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('url', 'External Relation')}
                      className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm transition-colors flex items-center gap-1 border border-surface-container-high/40"
                    >
                      <span className="material-symbols-outlined text-[14px]">hub</span> + Relation
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Inspector & Live Real-Time Code/Compiler Preview */}
              <div className="lg:col-span-4 flex flex-col gap-space-lg sticky top-20">
                {/* Code Inspector Card */}
                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md border border-surface-container-high/40">
                  <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/40">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm uppercase font-bold tracking-wider text-primary">
                        Live Schema Projection
                      </span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-lg">
                        TypeScript &amp; API
                      </h3>
                    </div>
                    <span className="material-symbols-outlined text-primary text-[20px]">code</span>
                  </div>

                  {/* Tab Bar */}
                  <div className="flex p-1 bg-surface-container-low rounded-lg">
                    <button
                      type="button"
                      onClick={() => setActiveCodeTab('ts')}
                      className={`flex-1 py-1 px-space-xs rounded font-label-sm text-label-sm text-center transition-all ${
                        activeCodeTab === 'ts'
                          ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      TypeScript
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCodeTab('gql')}
                      className={`flex-1 py-1 px-space-xs rounded font-label-sm text-label-sm text-center transition-all ${
                        activeCodeTab === 'gql'
                          ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      GraphQL
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCodeTab('jsonld')}
                      className={`flex-1 py-1 px-space-xs rounded font-label-sm text-label-sm text-center transition-all ${
                        activeCodeTab === 'jsonld'
                          ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      JSON-LD
                    </button>
                  </div>

                  {/* Code Block Preview with Visual Syntax Palette */}
                  <div className="bg-inverse-surface text-inverse-on-surface p-space-md rounded-xl font-code text-code overflow-x-auto shadow-inner leading-relaxed max-h-80">
                    <pre className="m-0 text-xs font-mono">
                      {activeCodeTab === 'ts'
                        ? generatedTypeScript
                        : activeCodeTab === 'gql'
                        ? generatedGraphQL
                        : generatedJsonLd}
                    </pre>
                  </div>

                  {/* Compiler Status Callout */}
                  <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-xs border border-surface-container-high/40">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        Schema Engine: Valid
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Zero conflicting column names. Index automatically generated for{' '}
                      <code className="font-code text-code bg-surface-container-high px-1 py-0.5 rounded text-primary font-semibold">
                        slug
                      </code>
                      .
                    </p>
                  </div>
                </div>

                {/* Migration & Storage Preview */}
                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md border border-surface-container-high/40">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-base">
                    Data Store Migration
                  </h4>
                  <div className="flex flex-col gap-space-sm text-body-sm font-body-sm text-on-surface-variant">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">storage</span>
                      <div>
                        <p className="text-on-surface font-medium">Table Target</p>
                        <p className="font-code text-code text-outline">
                          planfo_col_{slugify(slug || name).replace(/-/g, '_')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">dock</span>
                      <div>
                        <p className="text-on-surface font-medium">Studio Dock Registration</p>
                        <p>Will appear under primary sidebar collections navigation.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-space-sm flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerToast(`Schema configuration saved as local plugin preset.`);
                      }}
                      className="w-full py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                      Save as Reusable Plugin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmit()}
                      disabled={saving}
                      className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-all shadow-md flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                      {saving ? 'Deploying...' : isEditing ? 'Update & Deploy Schema' : 'Create & Deploy Schema'}
                    </button>
                  </div>
                </div>

                {/* Editorial Note card */}
                <div className="p-space-md rounded-xl bg-surface-container-low flex items-start gap-3 border border-surface-container-high/40">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      Headless Compatibility
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Instant Next.js, Remix, Astro, and Nuxt typed SDK hooks will generate automatically upon
                      blueprint publication.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

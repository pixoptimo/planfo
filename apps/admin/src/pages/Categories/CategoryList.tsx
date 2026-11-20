import React, { useState, useEffect } from 'react';
import type { Category } from '@cms/schemas';
import { api } from '../../api/client.js';
import { slugify } from '../../utils/slugify.js';
import { useAuth } from '../../context/AuthContext.js';

export const CategoryList: React.FC = () => {
  const { can } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isCatalogEnabled, setIsCatalogEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [type, setType] = useState<'post' | 'product'>('post');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catsData, tagsData, settingsData] = await Promise.all([
        api.get<Category[]>('/api/categories'),
        api.get<string[]>('/api/categories/tags/all'),
        api.get<{ featurePacks?: { catalog?: boolean } }>('/api/settings').catch(() => null)
      ]);
      setCategories(catsData);
      setTags(tagsData);
      if (settingsData?.featurePacks?.catalog) {
        setIsCatalogEnabled(true);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const openModal = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setName(cat.name);
      setSlug(cat.slug);
      setSlugManuallyEdited(true);
      setType(cat.type);
      setDescription(cat.description || '');
    } else {
      setEditingCat(null);
      setName('');
      setSlug('');
      setSlugManuallyEdited(false);
      setType('post');
      setDescription('');
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingCat) {
        const updated = await api.put<Category>(`/api/categories/${editingCat.id}`, {
          name,
          slug: slug || undefined,
          type,
          description
        });
        setCategories(categories.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await api.post<Category>('/api/categories', {
          name,
          slug: slug || undefined,
          type,
          description
        });
        setCategories([...categories, created]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Delete category "${catName}"?`)) return;
    try {
      await api.delete(`/api/categories/${id}`);
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-8 w-full font-body-md text-on-surface antialiased">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label-xs text-label-xs uppercase tracking-widest text-primary font-bold">
              04 / Taxonomy & Indexing
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <h1 className="font-headline-lg text-headline-lg font-serif text-on-surface tracking-tight">
            Categories & Tags
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant pt-1">
            {isCatalogEnabled
              ? 'Organize articles and products into structured category archives and search facets.'
              : 'Organize articles and content into structured category archives and topic tags.'}
          </p>
        </div>

        {can('categories.create') && (
          <button
            type="button"
            onClick={() => openModal()}
            className="px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01] self-start sm:self-center"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Category</span>
          </button>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Article Categories */}
        <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-surface-container-high/40 flex items-center justify-between bg-surface-container-low/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shadow-2xs">
                <span className="material-symbols-outlined text-[18px]">folder</span>
              </div>
              <div>
                <h2 className="font-title-md text-title-md font-semibold text-on-surface">Article Categories</h2>
                <span className="font-label-xs text-label-xs text-on-surface-variant">Blog & long-form routing</span>
              </div>
            </div>
            <span className="font-label-xs text-label-xs px-2.5 py-1 rounded-full bg-surface-container text-primary font-bold">
              {categories.filter((c) => c.type === 'post').length} Total
            </span>
          </div>

          <div className="divide-y divide-surface-container-high/30">
            {loading ? (
              <div className="p-8 text-center text-on-surface-variant font-body-sm">Loading categories...</div>
            ) : categories.filter((c) => c.type === 'post').length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-body-sm">No article categories yet.</div>
            ) : (
              categories
                .filter((c) => c.type === 'post')
                .map((cat) => (
                  <div key={cat.id} className="p-5 flex items-center justify-between hover:bg-surface-container-low/40 transition-colors">
                    <div>
                      <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">{cat.name}</h3>
                      <p className="font-code text-code text-[11px] text-on-surface-variant mt-0.5">
                        /blog/category/{cat.slug}
                      </p>
                      {cat.description && (
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">{cat.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {can('categories.update') && (
                        <button
                          type="button"
                          onClick={() => openModal(cat)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      )}
                      {can('categories.delete') && (
                        <button
                          type="button"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Product Categories (or Active Tags) */}
        {isCatalogEnabled ? (
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-surface-container-high/40 flex items-center justify-between bg-surface-container-low/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center shadow-2xs">
                  <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                </div>
                <div>
                  <h2 className="font-title-md text-title-md font-semibold text-on-surface">Product Categories</h2>
                  <span className="font-label-xs text-label-xs text-on-surface-variant">Storefront catalog routing</span>
                </div>
              </div>
              <span className="font-label-xs text-label-xs px-2.5 py-1 rounded-full bg-surface-container text-primary font-bold">
                {categories.filter((c) => c.type === 'product').length} Total
              </span>
            </div>

            <div className="divide-y divide-surface-container-high/30">
              {categories.filter((c) => c.type === 'product').length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant font-body-sm">No product categories yet.</div>
              ) : (
                categories
                  .filter((c) => c.type === 'product')
                  .map((cat) => (
                    <div key={cat.id} className="p-5 flex items-center justify-between hover:bg-surface-container-low/40 transition-colors">
                      <div>
                        <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">{cat.name}</h3>
                        <p className="font-code text-code text-[11px] text-on-surface-variant mt-0.5">
                          /products/category/{cat.slug}
                        </p>
                        {cat.description && (
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">{cat.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {can('categories.update') && (
                          <button
                            type="button"
                            onClick={() => openModal(cat)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        )}
                        {can('categories.delete') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        ) : (
          /* Active Content Tags placed in 2nd column when Catalog is disabled */
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-[20px]">sell</span>
                <h2 className="font-title-md text-title-md font-semibold text-on-surface">Active Content Tags</h2>
              </div>
              {tags.length === 0 ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  No tags used yet. Add tags when editing articles in the manuscript studio.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-surface-container text-on-surface font-label-xs text-label-xs font-semibold rounded-full border border-surface-container-high/40"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-6 border-t border-surface-container-high/40 mt-6">
              <span className="font-body-sm text-[12px] text-on-surface-variant">
                Tip: Storefront Product categories can be enabled in Site Settings → Feature Packs.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Aggregated Tags Section (Only shown below when catalog is enabled) */}
      {isCatalogEnabled && (
        <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-[20px]">sell</span>
            <h2 className="font-title-md text-title-md font-semibold text-on-surface">Active Content Tags</h2>
          </div>
          {tags.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              No tags used yet. Add tags when editing articles or products.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-surface-container text-on-surface font-label-xs text-label-xs font-semibold rounded-full border border-surface-container-high/40"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-surface-container-high/40 pb-3 mb-4">
              <h3 className="font-headline-sm text-headline-sm font-serif text-on-surface">
                {editingCat ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setName(newName);
                    if (!slugManuallyEdited || !slug) {
                      setSlug(slugify(newName));
                    }
                  }}
                  placeholder="e.g. Tutorials, Keyboards..."
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Slug (optional)
                  </label>
                  {name && (
                    <button
                      type="button"
                      onClick={() => {
                        setSlug(slugify(name));
                        setSlugManuallyEdited(false);
                      }}
                      className="font-label-xs text-label-xs text-primary hover:underline font-semibold"
                    >
                      Regenerate
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSlugManuallyEdited(val.trim().length > 0);
                    setSlug(val);
                  }}
                  placeholder="auto-generated"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-code text-code text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {isCatalogEnabled && (
                <div>
                  <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Applies To
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="post">Articles (Posts)</option>
                    <option value="product">Storefront Catalog (Products)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description for archive indexing..."
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-container-high/40">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-label-md text-label-md font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl shadow-sm transition-all"
                >
                  {editingCat ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

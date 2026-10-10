import React, { useState, useEffect } from 'react';
import { Plus, FolderTree, Trash2, Edit, Tag as TagIcon, Check, X } from 'lucide-react';
import type { Category } from '@cms/schemas';
import { api } from '../../api/client.js';
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
      setType(cat.type);
      setDescription(cat.description || '');
    } else {
      setEditingCat(null);
      setName('');
      setSlug('');
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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Categories & Tags</h1>
          <p className="text-xs text-slate-400 mt-1">
            {isCatalogEnabled
              ? 'Organize articles and products into structured category archives'
              : 'Organize articles and content into structured category archives'}
          </p>
        </div>

        {can('categories.create') && (
          <button
            type="button"
            onClick={() => openModal()}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition self-start"
          >
            <Plus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Article Categories */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderTree className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Article Categories</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {categories.filter((c) => c.type === 'post').length} Total
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {categories.filter((c) => c.type === 'post').length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No article categories yet.</div>
            ) : (
              categories.filter((c) => c.type === 'post').map((cat) => (
                <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{cat.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">/blog/category/{cat.slug}</p>
                    {cat.description && <p className="text-xs text-slate-400 mt-1">{cat.description}</p>}
                  </div>
                  <div className="flex items-center space-x-1">
                    {can('categories.update') && (
                      <button onClick={() => openModal(cat)} className="p-1 text-slate-400 hover:text-white" title="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {can('categories.delete') && (
                      <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1 text-slate-400 hover:text-red-400" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Product Categories (Only shown when catalog feature pack is enabled) */}
        {isCatalogEnabled ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderTree className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold text-white">Product Categories</h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {categories.filter((c) => c.type === 'product').length} Total
              </span>
            </div>

            <div className="divide-y divide-slate-800">
              {categories.filter((c) => c.type === 'product').length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No product categories yet.</div>
              ) : (
                categories.filter((c) => c.type === 'product').map((cat) => (
                  <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{cat.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">/products/category/{cat.slug}</p>
                      {cat.description && <p className="text-xs text-slate-400 mt-1">{cat.description}</p>}
                    </div>
                    <div className="flex items-center space-x-1">
                      {can('categories.update') && (
                        <button onClick={() => openModal(cat)} className="p-1 text-slate-400 hover:text-white" title="Edit">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {can('categories.delete') && (
                        <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1 text-slate-400 hover:text-red-400" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <TagIcon className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">Active Content Tags</h2>
              </div>
              {tags.length === 0 ? (
                <p className="text-xs text-slate-500">No tags used yet. Add tags when editing articles.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-6 border-t border-slate-800/60 mt-6">
              <span className="text-[11px] text-slate-500">
                Tip: Storefront Product categories can be enabled in Site Settings &rarr; Feature Packs.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Aggregated Tags Section (Only shown below when catalog is enabled) */}
      {isCatalogEnabled && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center space-x-2 mb-4">
            <TagIcon className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Active Content Tags</h2>
          </div>
          {tags.length === 0 ? (
            <p className="text-xs text-slate-500">No tags used yet. Add tags when editing articles or products.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base">
                {editingCat ? 'Edit Category' : 'Create Category'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tutorials, Keyboards..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Slug (optional)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-brand-500"
                />
              </div>

              {isCatalogEnabled && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Applies To
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="post">Articles (Posts)</option>
                    <option value="product">Storefront Catalog (Products)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold rounded-lg text-xs"
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

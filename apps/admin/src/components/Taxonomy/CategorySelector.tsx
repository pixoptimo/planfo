import React, { useState, useEffect } from 'react';
import { Plus, X, Check, Loader2, FolderPlus, Sparkles } from 'lucide-react';
import type { Category, CategoryType } from '@cms/schemas';
import { api } from '../../api/client.js';

interface CategorySelectorProps {
  value: string;
  onChange: (categorySlug: string) => void;
  type?: CategoryType;
  label?: string;
  disabled?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  type = 'post',
  label = 'Category',
  disabled = false
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentCreated, setRecentCreated] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const data = await api.get<Category[]>(`/api/categories?type=${type}`);
      setCategories(data || []);
    } catch {
      // If categories can't be fetched, fail silently or fallback to empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [type]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const created = await api.post<Category>('/api/categories', {
        name: newCatName.trim(),
        type
      });

      setCategories((prev) => [...prev, created]);
      onChange(created.slug);
      setRecentCreated(created.name);
      setNewCatName('');
      setIsCreating(false);

      setTimeout(() => {
        setRecentCreated(null);
      }, 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            disabled={disabled}
            className="flex items-center space-x-1 text-[11px] font-medium text-brand-400 hover:text-brand-300 transition disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
            <span>New Category</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        <select
          value={value || 'general'}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 disabled:opacity-50"
        >
          <option value="general">General</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {recentCreated && (
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Category "{recentCreated}" created and selected!</span>
          </div>
        )}

        {isCreating && (
          <form
            onSubmit={handleCreateCategory}
            className="p-3 bg-slate-950 border border-brand-500/30 rounded-lg space-y-2 animate-in fade-in slide-in-from-top-1"
          >
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span className="flex items-center space-x-1">
                <FolderPlus className="w-3.5 h-3.5 text-brand-400" />
                <span>Quick Create Category</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setError(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                autoFocus
                placeholder="Category name (e.g. Engineering)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                disabled={submitting}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={submitting || !newCatName.trim()}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold rounded-md text-xs flex items-center space-x-1 transition disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Create</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <p className="text-[11px] text-red-400 font-medium">{error}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

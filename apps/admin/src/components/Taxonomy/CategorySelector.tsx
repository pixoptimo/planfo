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
      //
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
    <div className="space-y-1.5 font-body-md text-on-surface antialiased">
      <div className="flex items-center justify-between">
        <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {label}
        </label>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            disabled={disabled}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline transition-colors disabled:opacity-50"
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
          className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        >
          <option value="general">General</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {recentCreated && (
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium bg-surface-container border border-primary/20 px-3 py-1.5 rounded-xl">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Category "{recentCreated}" created and selected!</span>
          </div>
        )}

        {isCreating && (
          <form
            onSubmit={handleCreateCategory}
            className="p-3.5 bg-surface-container-lowest border border-primary/30 rounded-xl space-y-2.5 shadow-sm animate-in fade-in slide-in-from-top-1"
          >
            <div className="flex items-center justify-between font-label-xs text-label-xs text-on-surface font-semibold">
              <span className="flex items-center gap-1.5">
                <FolderPlus className="w-3.5 h-3.5 text-primary" />
                <span>Quick Create Category</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setError(null);
                }}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Category name (e.g. Design Systems)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                disabled={submitting}
                className="flex-1 bg-surface-container-low border border-surface-container-high/40 rounded-lg px-2.5 py-1.5 font-body-sm text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={submitting || !newCatName.trim()}
                className="px-3 py-1.5 bg-primary hover:bg-primary-container text-on-primary font-semibold rounded-lg text-xs flex items-center gap-1 transition-all disabled:opacity-50 shadow-xs"
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

            {error && <p className="text-[11px] text-error">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

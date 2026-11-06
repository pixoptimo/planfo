import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Blueprint, BlueprintEntry } from '@cms/schemas';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/UI/StatusBadge.js';
import { getBlueprintIcon } from '../../utils/blueprintIcons.js';
import { getMediaUrl } from '../../utils/media.js';
import { useAuth } from '../../context/AuthContext.js';

export const DynamicEntryList: React.FC = () => {
  const { blueprintSlug } = useParams<{ blueprintSlug: string }>();
  const { can } = useAuth();

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [entries, setEntries] = useState<BlueprintEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (blueprintSlug) {
      loadData(blueprintSlug);
    }
  }, [blueprintSlug]);

  const loadData = async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ blueprint: Blueprint; entries: BlueprintEntry[] }>(
        `/api/blueprints/${slug}/entries`
      );
      setBlueprint(res.blueprint);
      setEntries(res.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entrySlug: string, title: string) => {
    if (!blueprintSlug) return;
    if (!confirm(`Are you sure you want to move "${title}" to Trash?`)) return;

    try {
      await api.delete(`/api/blueprints/${blueprintSlug}/entries/${entrySlug}`);
      setSuccess(`Moved "${title}" to Trash.`);
      setEntries(entries.filter((e) => e.slug !== entrySlug));
      window.dispatchEvent(new CustomEvent('trash-updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-on-surface-variant font-body-sm">
        <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>Loading collection entries...</span>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-12">
        <div className="p-8 bg-surface-container-lowest border border-surface-container-high/60 rounded-2xl text-center space-y-4 shadow-sm">
          <span className="material-symbols-outlined text-4xl text-error">error</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Blueprint Not Found</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            No blueprint exists matching identifier "{blueprintSlug}".
          </p>
          <Link
            to="/blueprints/studio"
            className="inline-flex items-center gap-2 font-label-md text-label-md font-semibold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Return to Blueprint Studio</span>
          </Link>
        </div>
      </div>
    );
  }

  const IconComp = getBlueprintIcon(blueprint.icon);
  const categories = Array.from(new Set(entries.map((e) => e.category).filter(Boolean)));

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.slug.toLowerCase().includes(search.toLowerCase()) ||
      Object.values(e.data || {}).some((v) =>
        String(v).toLowerCase().includes(search.toLowerCase())
      );
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto font-body-md text-on-surface antialiased">
      {/* Top Breadcrumb & Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-body-sm font-body-sm text-on-surface-variant mb-1">
            <Link to="/blueprints/studio" className="hover:text-primary transition-colors">
              Blueprint Studio
            </Link>
            <span className="text-outline-variant select-none">/</span>
            <span className="text-on-surface font-semibold">{blueprint.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-xs">
              <IconComp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-headline-lg text-headline-lg font-serif text-on-surface tracking-tight">
                {blueprint.name}
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant pt-0.5">
                {blueprint.description || `Manage ${blueprint.name.toLowerCase()} collection records.`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Link
            to="/blueprints/studio"
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Schema</span>
          </Link>

          {can('blueprints.entries.create') && (
            <Link
              to={`/blueprints/${blueprint.slug}/new`}
              className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.01]"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Create New {blueprint.singularName}</span>
            </Link>
          )}
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

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest border border-surface-container-high/40 p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 min-w-[260px]">
          <span className="material-symbols-outlined text-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${blueprint.name.toLowerCase()} by title, slug, or fields...`}
            className="w-full bg-surface-container-low border border-surface-container-high/30 rounded-xl pl-10 pr-4 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-container-low border border-surface-container-high/30 rounded-xl px-3.5 py-1.5 font-label-sm text-label-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All ({entries.length})</option>
              <option value="published">
                Published ({entries.filter((e) => e.status === 'published').length})
              </option>
              <option value="draft">
                Drafts ({entries.filter((e) => e.status === 'draft').length})
              </option>
            </select>
          </div>

          {blueprint.hasCategories && categories.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-surface-container-low border border-surface-container-high/30 rounded-xl px-3.5 py-1.5 font-label-sm text-label-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Entries Table */}
      {filteredEntries.length === 0 ? (
        <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto text-primary">
            <IconComp className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">No {blueprint.name} Found</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mx-auto mt-1">
              {search || statusFilter !== 'all'
                ? 'No items matched your current filter criteria.'
                : `Start by creating your first ${blueprint.singularName.toLowerCase()} entry.`}
            </p>
          </div>

          {can('blueprints.entries.create') && (
            <Link
              to={`/blueprints/${blueprint.slug}/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Create First {blueprint.singularName}</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="bg-surface-container-low text-on-surface-variant font-label-xs text-label-xs uppercase tracking-wider border-b border-surface-container-high/40">
                <tr>
                  <th className="px-6 py-3.5">Record</th>
                  {blueprint.fields.slice(0, 2).map((f) => (
                    <th key={f.id} className="px-6 py-3.5 hidden md:table-cell">
                      {f.label}
                    </th>
                  ))}
                  {blueprint.hasCategories && (
                    <th className="px-6 py-3.5 hidden sm:table-cell">Category</th>
                  )}
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 hidden lg:table-cell">Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/30 text-on-surface">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-container-low/40 transition-colors group">
                    {/* Record Title & Slug */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {entry.featuredImage ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container border border-surface-container-high/40 shrink-0 flex items-center justify-center">
                            <img
                              src={getMediaUrl(entry.featuredImage)}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  const fallback = parent.querySelector('.list-img-fallback');
                                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                            <div className="list-img-fallback hidden w-full h-full items-center justify-center text-on-surface-variant">
                              <span className="material-symbols-outlined text-[18px]">image</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-container border border-surface-container-high/40 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[18px]">category</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            to={`/blueprints/${blueprint.slug}/${entry.slug}`}
                            className="font-title-md text-title-md text-on-surface font-semibold hover:text-primary transition-colors block truncate"
                          >
                            {entry.title}
                          </Link>
                          <span className="font-code text-code text-on-surface-variant text-[11px] block truncate">
                            /{blueprint.slug}/{entry.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Preview of first 2 custom fields */}
                    {blueprint.fields.slice(0, 2).map((f) => {
                      const val = entry.data?.[f.name];
                      return (
                        <td key={f.id} className="px-6 py-4 hidden md:table-cell text-on-surface-variant font-body-sm">
                          {val !== undefined && val !== null && String(val) !== '' ? (
                            f.type === 'boolean' ? (
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-label-xs text-label-xs font-semibold ${
                                  val ? 'bg-surface-container-highest text-primary' : 'bg-surface-container text-on-surface-variant'
                                }`}
                              >
                                {val ? 'Yes' : 'No'}
                              </span>
                            ) : f.type === 'image' ? (
                              <img src={getMediaUrl(String(val))} alt="" className="w-7 h-7 rounded-lg object-cover shadow-2xs" />
                            ) : (
                              <span className="truncate max-w-[160px] block font-mono text-[11px]">
                                {String(val)}
                              </span>
                            )
                          ) : (
                            <span className="text-outline-variant font-mono">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Category */}
                    {blueprint.hasCategories && (
                      <td className="px-6 py-4 hidden sm:table-cell">
                        {entry.category ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-surface-container font-label-xs text-label-xs font-medium text-on-surface">
                            {entry.category}
                          </span>
                        ) : (
                          <span className="text-outline-variant">—</span>
                        )}
                      </td>
                    )}

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={entry.status} />
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 hidden lg:table-cell text-on-surface-variant text-[11px] font-mono">
                      {new Date(entry.updatedAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/blueprints/${blueprint.slug}/${entry.slug}`}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                          title="Edit Entry"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Link>

                        {can('blueprints.entries.delete') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.slug, entry.title)}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-lg transition-colors"
                            title="Delete Entry"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

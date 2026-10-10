import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowLeft,
  Sliders,
  Calendar,
  Layers,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Tag as TagIcon,
  FolderTree,
  Image as ImageIcon
} from 'lucide-react';
import type { Blueprint, BlueprintEntry } from '@cms/schemas';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/UI/StatusBadge.js';
import { getBlueprintIcon } from '../../utils/blueprintIcons.js';
import { useAuth } from '../../context/AuthContext.js';

export const DynamicEntryList: React.FC = () => {
  const { blueprintSlug } = useParams<{ blueprintSlug: string }>();
  const navigate = useNavigate();
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
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await api.delete(`/api/blueprints/${blueprintSlug}/entries/${entrySlug}`);
      setSuccess(`Deleted "${title}" successfully.`);
      setEntries(entries.filter((e) => e.slug !== entrySlug));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center space-x-2 text-slate-400 font-mono text-xs">
        <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
        <span>Loading collection entries...</span>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <h2 className="text-base font-bold text-white">Blueprint Not Found</h2>
          <p className="text-xs text-slate-400">
            No blueprint exists matching identifier "{blueprintSlug}".
          </p>
          <Link
            to="/blueprints/studio"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-brand-400 hover:text-brand-300"
          >
            <ArrowLeft className="w-4 h-4" />
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
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 mb-1">
            <Link to="/blueprints/studio" className="hover:text-brand-400 transition">
              Blueprint Studio
            </Link>
            <span>/</span>
            <span className="text-white">{blueprint.name}</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <IconComp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{blueprint.name}</h1>
              <p className="text-xs text-slate-400">
                {blueprint.description || `Manage ${blueprint.name.toLowerCase()} collection records.`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-start">
          <Link
            to="/blueprints/studio"
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs rounded-xl flex items-center space-x-1.5 border border-slate-800 transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Schema</span>
          </Link>

          {can('blueprints.entries.create') && (
            <Link
              to={`/blueprints/${blueprint.slug}/new`}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New {blueprint.singularName}</span>
            </Link>
          )}
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

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${blueprint.name.toLowerCase()} by title, slug, or fields...`}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
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
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <IconComp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No {blueprint.name} Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {search || statusFilter !== 'all'
                ? 'No items matched your current filter criteria.'
                : `Start by creating your first ${blueprint.singularName.toLowerCase()} entry.`}
            </p>
          </div>

          {can('blueprints.entries.create') && (
            <Link
              to={`/blueprints/${blueprint.slug}/new`}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create First {blueprint.singularName}</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Record</th>
                  {blueprint.fields.slice(0, 2).map((f) => (
                    <th key={f.id} className="px-5 py-3.5 hidden md:table-cell">
                      {f.label}
                    </th>
                  ))}
                  {blueprint.hasCategories && (
                    <th className="px-5 py-3.5 hidden sm:table-cell">Category</th>
                  )}
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 hidden lg:table-cell">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-850/50 transition group">
                    {/* Record Title & Slug */}
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        {entry.featuredImage ? (
                          <img
                            src={entry.featuredImage}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            to={`/blueprints/${blueprint.slug}/${entry.slug}`}
                            className="font-bold text-white hover:text-brand-400 transition truncate block text-sm"
                          >
                            {entry.title}
                          </Link>
                          <span className="text-[11px] font-mono text-slate-500">
                            /{blueprint.slug}/{entry.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Preview of first 2 custom fields */}
                    {blueprint.fields.slice(0, 2).map((f) => {
                      const val = entry.data?.[f.name];
                      return (
                        <td key={f.id} className="px-5 py-4 hidden md:table-cell text-slate-300">
                          {val !== undefined && val !== null && String(val) !== '' ? (
                            f.type === 'boolean' ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                  val ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {val ? 'Yes' : 'No'}
                              </span>
                            ) : f.type === 'image' ? (
                              <img src={String(val)} alt="" className="w-6 h-6 rounded object-cover" />
                            ) : (
                              <span className="truncate max-w-[150px] block font-mono text-[11px]">
                                {String(val)}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-600 font-mono">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Category */}
                    {blueprint.hasCategories && (
                      <td className="px-5 py-4 hidden sm:table-cell">
                        {entry.category ? (
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                            {entry.category}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    )}

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={entry.status} />
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 hidden lg:table-cell text-slate-400 text-[11px] font-mono">
                      {new Date(entry.updatedAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/blueprints/${blueprint.slug}/${entry.slug}`}
                          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>

                        {can('blueprints.entries.delete') && (
                          <button
                            onClick={() => handleDelete(entry.slug, entry.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
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

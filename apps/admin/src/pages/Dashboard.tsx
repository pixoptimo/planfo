import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  Plus,
  Eye,
  Sparkles,
  Send,
  Loader2,
  ExternalLink,
  ArrowRight,
  HardDrive
} from 'lucide-react';
import type { Page } from '@cms/schemas';
import { api } from '../api/client.js';
import { StatusBadge } from '../components/UI/StatusBadge.js';
import { useAuth } from '../context/AuthContext.js';

export const Dashboard: React.FC = () => {
  const { user, can } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const data = await api.get<Page[]>('/api/pages');
      setPages(Array.isArray(data) ? data : []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleBuild = async () => {
    setBuilding(true);
    setActionMessage(null);
    try {
      const res = await api.post<{ success: boolean; stats?: any }>('/api/publish');
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Static website built successfully! Generated ${res.stats?.pagesGenerated ?? pages.length} pages into generated/`
        });
      } else {
        setActionMessage({ type: 'error', text: 'Build encountered an issue.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Build failed.' });
    } finally {
      setBuilding(false);
    }
  };

  const pagesCount = pages.length;
  const draftsCount = pages.filter((p) => p.status === 'draft').length;
  const publishedCount = pages.filter((p) => p.status === 'published').length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Planfo CMS Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Beta v0.1
            </span>
            <span className="text-xs text-slate-400 font-mono">Zero Database &bull; Pure Static</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Planfo CMS Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your pages, generate static HTML, and publish directly to GitHub Pages.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/api/preview"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-2 transition border border-slate-700/60 shadow-sm"
          >
            <Eye className="w-4 h-4 text-brand-400" />
            <span>Preview</span>
          </a>

          <button
            type="button"
            onClick={handleBuild}
            disabled={building}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-2 transition border border-slate-700/60 shadow-sm disabled:opacity-50"
          >
            {building ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
            <span>Build</span>
          </button>

          <button
            type="button"
            onClick={handleBuild}
            disabled={building}
            className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition transform active:scale-95 disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-slate-950" />
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-white ml-4 font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Core Beta Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Pages */}
        <Link
          to="/pages"
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition group relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pages</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-white font-mono">
              {loading ? '...' : pagesCount}
            </span>
            <span className="text-xs text-slate-400">total pages</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center space-x-1 group-hover:text-brand-400 transition">
            <span>Manage all pages</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </p>
        </Link>

        {/* Drafts */}
        <Link
          to="/pages"
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition group relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Drafts</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-white font-mono">
              {loading ? '...' : draftsCount}
            </span>
            <span className="text-xs text-slate-400">in draft mode</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center space-x-1 group-hover:text-amber-400 transition">
            <span>Review unreleased edits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </p>
        </Link>

        {/* Published */}
        <Link
          to="/pages"
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition group relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Published</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-white font-mono">
              {loading ? '...' : publishedCount}
            </span>
            <span className="text-xs text-slate-400">live in generated output</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center space-x-1 group-hover:text-emerald-400 transition">
            <span>View public site structure</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </p>
        </Link>
      </div>

      {/* Pages Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-brand-400" />
            <div>
              <h2 className="font-semibold text-sm text-white">Website Pages</h2>
              <p className="text-[11px] text-slate-400">Home, About, Contact & custom pages stored in .planfo/content/pages/</p>
            </div>
          </div>

          {can('pages.create') && (
            <Link
              to="/pages/new"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5 text-brand-400" />
              <span>Create Page</span>
            </Link>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Page Title</th>
                <th className="px-6 py-3.5">Slug / URL</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Last Updated</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading pages from filesystem...
                  </td>
                </tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No pages found. Click "Create Page" to create your first page!
                  </td>
                </tr>
              ) : (
                pages.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/pages/${p.slug}`}
                          className="font-medium text-white hover:text-brand-400 transition"
                        >
                          {p.title}
                        </Link>
                        {p.slug === 'home' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Frontpage
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      /{p.slug === 'home' ? '' : p.slug}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status as any} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {new Date(p.updatedAt || p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <a
                          href={`/api/preview/page/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-400 hover:text-brand-400 transition flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </a>
                        <Link
                          to={`/pages/${p.slug}`}
                          className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
                        >
                          Edit →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

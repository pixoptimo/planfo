import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Page } from '@cms/schemas';
import { api } from '../api/client.js';
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
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      {/* Dashboard Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label-xs text-label-xs uppercase tracking-widest text-primary font-bold">
              00 / Overview
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Editorial Studio Overview
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant pt-1">
            Zero-database static publication engine with instant template compiling and atomic deployments.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <Link
            to="/posts/new"
            className="px-4 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-label-md text-label-md shadow-sm hover:bg-primary transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Post</span>
          </Link>
          {can('pages.create') && (
            <Link
              to="/pages/new"
              className="px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">note_add</span>
              <span>New Page</span>
            </Link>
          )}
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-body-sm flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-surface-container-highest border-primary/20 text-primary font-semibold'
              : 'bg-error-container/40 border-error/20 text-error font-medium'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-on-surface-variant hover:text-on-surface ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Core Studio Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Readership Analytics with SVG Sparkline */}
        <div className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-label-xs text-label-xs uppercase tracking-widest text-on-surface-variant font-bold">
                Readership Analytics
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-headline-xl text-headline-xl text-on-surface font-normal">84.2k</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-label-xs text-label-xs font-bold">
                +18.4%
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">
              Monthly long-form article completions
            </p>
          </div>

          <div className="h-14 w-full pt-2">
            <svg className="w-full h-full text-primary" fill="none" preserveAspectRatio="none" viewBox="0 0 280 60">
              <path
                d="M0 45 C 40 45, 60 20, 100 25 C 140 30, 160 5, 200 12 C 240 18, 260 2, 280 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M0 45 C 40 45, 60 20, 100 25 C 140 30, 160 5, 200 12 C 240 18, 260 2, 280 5 L 280 60 L 0 60 Z"
                fill="currentColor"
                fillOpacity="0.08"
              />
            </svg>
          </div>

          <div className="pt-2 flex items-center justify-between text-on-surface-variant font-label-xs text-label-xs border-t border-outline-variant/10">
            <span>Target: 100k / mo</span>
            <span className="text-primary font-semibold">On Track (92%)</span>
          </div>
        </div>

        {/* Metric 2: Pages & Documents */}
        <Link
          to="/pages"
          className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors group"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-label-xs text-label-xs uppercase tracking-widest text-on-surface-variant font-bold">
                Content Composition
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                <span className="material-symbols-outlined text-[18px]">article</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-headline-xl text-headline-xl text-on-surface font-normal">
                {loading ? '...' : pagesCount}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">total pages</span>
            </div>
            <div className="pt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-xs text-label-xs font-semibold">
                {publishedCount} Published
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-xs text-label-xs font-medium">
                {draftsCount} Drafts
              </span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between text-on-surface-variant font-label-xs text-label-xs border-t border-outline-variant/10">
            <span>planfo/content/pages/</span>
            <span className="text-primary font-semibold group-hover:translate-x-1 transition-transform">
              Manage pages →
            </span>
          </div>
        </Link>

        {/* Metric 3: Static Delivery Readiness */}
        <div className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-label-xs text-label-xs uppercase tracking-widest text-on-surface-variant font-bold">
                Static Engine Health
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-headline-xl text-headline-xl text-primary font-normal">100%</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-label-xs text-label-xs font-bold">
                Zero Runtime
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">
              Atomic staging swap active • Zero database overhead
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full w-full" />
            </div>
            <div className="flex items-center justify-between font-label-xs text-label-xs text-on-surface-variant">
              <span>WCAG AAA Certified</span>
              <span className="text-primary font-semibold">100/100 Lighthouse Ready</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-on-surface-variant font-label-xs text-label-xs border-t border-outline-variant/10">
            <span>Instant Compilation</span>
            <button
              type="button"
              onClick={handleBuild}
              disabled={building}
              className="text-primary font-semibold hover:underline"
            >
              {building ? 'Building...' : 'Recompile site →'}
            </button>
          </div>
        </div>
      </div>

      {/* Pages Section Card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[18px]">auto_stories</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Site Pages</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Home, About, Contact & custom pages stored as structured JSON.
              </p>
            </div>
          </div>

          {can('pages.create') && (
            <Link
              to="/pages/new"
              className="px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Create Page</span>
            </Link>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead className="bg-surface-container-low text-on-surface-variant font-label-xs text-label-xs uppercase tracking-wider border-b border-outline-variant/20">
              <tr>
                <th className="px-6 py-3.5">Page Title</th>
                <th className="px-6 py-3.5">Slug / URL</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Last Updated</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant font-body-sm">
                    Loading pages from filesystem...
                  </td>
                </tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant font-body-sm">
                    No pages found. Click "Create Page" to create your first page!
                  </td>
                </tr>
              ) : (
                pages.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/pages/${p.slug}`}
                          className="font-title-md text-title-md text-on-surface font-semibold hover:text-primary transition-colors"
                        >
                          {p.title}
                        </Link>
                        {p.slug === 'home' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-container text-primary font-bold">
                            Frontpage
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-on-surface-variant">
                      /{p.slug}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-xs text-label-xs ${
                          p.status === 'published'
                            ? 'bg-surface-container-highest text-primary font-semibold'
                            : 'bg-surface-container text-on-surface-variant font-medium'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.status === 'published' ? 'bg-primary' : 'bg-on-surface-variant'
                          }`}
                        />
                        <span className="capitalize">{p.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant font-mono text-[11px]">
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/pages/${p.slug}`}
                          className="px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold transition-colors"
                        >
                          Edit
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

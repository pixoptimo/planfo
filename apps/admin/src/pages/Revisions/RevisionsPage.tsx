import React, { useState } from 'react';
import { History, Search, FileText, BookOpen, ShoppingBag } from 'lucide-react';
import type { RevisionMeta, ContentType } from '@cms/schemas';
import { api } from '../../api/client.js';

export const RevisionsPage: React.FC = () => {
  const [contentType, setContentType] = useState<ContentType>('page');
  const [slug, setSlug] = useState('');
  const [revisions, setRevisions] = useState<RevisionMeta[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchRevisions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await api.get<RevisionMeta[]>(`/api/revisions/${contentType}/${slug.trim()}`);
      setRevisions(data);
    } catch {
      setRevisions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Revision Explorer</h1>
        <p className="text-xs text-slate-400 mt-1">Audit historical published versions and content snapshots stored on disk</p>
      </div>

      {/* Query Bar */}
      <form onSubmit={fetchRevisions} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-3">
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
        >
          <option value="page">Page</option>
          <option value="post">Post</option>
          <option value="product">Product</option>
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Enter slug (e.g. about-us, first-post)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition"
        >
          <Search className="w-4 h-4" />
          <span>Lookup Revisions</span>
        </button>
      </form>

      {/* Results */}
      {searched && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300">
              Showing versions for <strong className="text-brand-400">{contentType}/{slug}</strong>
            </span>
            <span className="text-xs text-slate-500 font-mono">{revisions.length} Snapshots</span>
          </div>

          <div className="divide-y divide-slate-800">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">Loading revisions from disk...</div>
            ) : revisions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No revisions found for this item.</div>
            ) : (
              revisions.map((rev) => (
                <div key={rev.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold font-mono text-emerald-400">
                        Version {rev.version}
                      </span>
                      <span className="text-xs text-white">{rev.summary || 'Snapshot'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      {new Date(rev.createdAt).toLocaleString()} • Published by {rev.authorEmail}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{rev.id}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

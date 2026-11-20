import React, { useState } from 'react';
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
    <div className="space-y-6 w-full font-body-md text-on-surface antialiased">
      {/* Header Banner */}
      <div className="pb-2">
        <div className="flex items-center gap-2">
          <span className="font-label-xs text-label-xs uppercase tracking-widest text-primary font-bold">
            08 / Version Control
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
        <h1 className="font-headline-lg text-headline-lg font-serif text-on-surface tracking-tight">
          Revision Explorer
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant pt-1">
          Audit historical published versions and content snapshots stored atomically on disk.
        </p>
      </div>

      {/* Query Bar */}
      <form
        onSubmit={fetchRevisions}
        className="bg-surface-container-lowest border border-surface-container-high/40 p-4 rounded-2xl shadow-sm flex flex-wrap items-center gap-3"
      >
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value as any)}
          className="bg-surface-container-low border border-surface-container-high/30 rounded-xl px-3.5 py-2 font-label-sm text-label-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="page">Page</option>
          <option value="post">Post</option>
          <option value="product">Product</option>
        </select>

        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Enter slug (e.g. about-us, building-resilience)..."
            className="w-full bg-surface-container-low border border-surface-container-high/30 rounded-xl px-4 py-2 font-code text-code text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          className="px-5 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          <span>Lookup Revisions</span>
        </button>
      </form>

      {/* Results */}
      {searched && (
        <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 px-6 border-b border-surface-container-high/40 flex items-center justify-between bg-surface-container-low/40">
            <span className="font-body-sm text-body-sm text-on-surface">
              Showing versions for <strong className="font-code text-primary">/{contentType}/{slug}</strong>
            </span>
            <span className="font-label-xs text-label-xs font-mono text-on-surface-variant font-semibold px-2.5 py-1 rounded-full bg-surface-container">
              {revisions.length} Snapshots
            </span>
          </div>

          <div className="divide-y divide-surface-container-high/30 text-on-surface">
            {loading ? (
              <div className="p-12 text-center text-on-surface-variant font-body-sm flex flex-col items-center gap-2">
                <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span>Loading revisions from atomic storage...</span>
              </div>
            ) : revisions.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant font-body-sm">
                No revisions found for this item.
              </div>
            ) : (
              revisions.map((rev) => (
                <div key={rev.id} className="p-5 flex items-center justify-between hover:bg-surface-container-low/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-label-xs text-label-xs px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-mono font-bold">
                        Version {rev.version}
                      </span>
                      <span className="font-title-sm text-title-sm font-semibold text-on-surface">
                        {rev.summary || 'Content Snapshot'}
                      </span>
                    </div>
                    <p className="font-code text-code text-[11px] text-on-surface-variant mt-1.5">
                      {new Date(rev.createdAt).toLocaleString()} • Published by {rev.authorEmail || 'Editorial Lead'}
                    </p>
                  </div>
                  <span className="font-code text-code text-xs text-on-surface-variant px-3 py-1 bg-surface-container rounded-lg">
                    {rev.id}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

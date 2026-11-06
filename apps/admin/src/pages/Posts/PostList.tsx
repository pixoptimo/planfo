import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '@cms/schemas';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';

export const PostList: React.FC = () => {
  const { can } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await api.get<Post[]>('/api/posts');
      setPosts(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Are you sure you want to move post "${title}" to Trash?`)) return;
    try {
      await api.delete(`/api/posts/${slug}`);
      setPosts(posts.filter((p) => p.slug !== slug));
      window.dispatchEvent(new CustomEvent('trash-updated'));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const filtered = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label-xs text-label-xs uppercase tracking-widest text-primary font-bold">
              01 / Publications
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Articles & Manuscript Library
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant pt-1">
            Manage longform essays, dispatches, revisions, and editorial syndication.
          </p>
        </div>

        {can('posts.create') && (
          <Link
            to="/posts/new"
            className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-label-md text-label-md shadow-sm hover:bg-primary transition-all flex items-center gap-2 self-start sm:self-center"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Compose Article</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/20">
        <div className="relative flex-1 min-w-[260px]">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search manuscripts by title, slug or author..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-xl font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-low rounded-xl px-3.5 py-2 font-label-sm text-label-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Articles ({posts.length})</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Articles Table Card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-on-surface-variant font-body-md flex flex-col items-center gap-2">
            <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span>Loading publication library...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant font-body-md space-y-3">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">menu_book</span>
            <p>No manuscripts match the selected search query or filter.</p>
            {can('posts.create') && (
              <Link
                to="/posts/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Create your first post</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="bg-surface-container-low text-on-surface-variant font-label-xs text-label-xs uppercase tracking-wider border-b border-outline-variant/20">
                <tr>
                  <th className="px-6 py-3.5">Manuscript Title</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Author</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Updated</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-surface-container-low/40 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.featuredImage ? (
                          <img
                            src={p.featuredImage}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
                            <span className="material-symbols-outlined text-[20px]">article</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            to={`/posts/${p.slug}`}
                            className="font-title-md text-title-md text-on-surface font-semibold hover:text-primary transition-colors block truncate"
                          >
                            {p.title}
                          </Link>
                          <span className="font-code text-code text-on-surface-variant text-[11px] block truncate">
                            /blog/{p.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-surface-container font-label-xs text-label-xs font-semibold text-on-surface capitalize">
                        {p.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant font-medium">
                      {p.author || 'Editorial Lead'}
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
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/api/preview/post/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                          title="Preview"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </a>

                        <Link
                          to={`/posts/${p.slug}`}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                          title="Edit in Studio"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Link>

                        {can('posts.delete') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(p.slug, p.title)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors"
                            title="Move to Trash"
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
        )}
      </div>
    </div>
  );
};

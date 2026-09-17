import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  BookOpen,
  ShoppingBag,
  Clock,
  Plus,
  ArrowUpRight,
  TrendingUp,
  HardDrive,
  FolderTree
} from 'lucide-react';
import type { DashboardStats } from '@cms/types';
import { api } from '../api/client.js';
import { StatusBadge } from '../components/UI/StatusBadge.js';
import { useAuth } from '../context/AuthContext.js';

export const Dashboard: React.FC = () => {
  const { user, can } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.get<DashboardStats>('/api/stats');
      setStats(data);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Pages', value: stats?.pagesCount ?? 0, icon: FileText, color: 'text-blue-400', link: '/pages' },
    { title: 'Blog Posts', value: stats?.postsCount ?? 0, icon: BookOpen, color: 'text-emerald-400', link: '/posts' },
    { title: 'Store Products', value: stats?.productsCount ?? 0, icon: ShoppingBag, color: 'text-purple-400', link: '/products' },
    { title: 'Pending Drafts', value: stats?.draftsCount ?? 0, icon: Clock, color: 'text-amber-400', link: '/pages' },
    { title: 'Media Files', value: stats?.mediaCount ?? 0, icon: HardDrive, color: 'text-cyan-400', link: '/media' },
    { title: 'Categories', value: stats?.categoriesCount ?? 0, icon: FolderTree, color: 'text-pink-400', link: '/categories' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {user?.name || user?.email}! 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your static website content, media assets, and trigger zero-downtime builds.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {can('pages.create') && (
            <Link
              to="/pages/new"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4 text-brand-400" />
              <span>New Page</span>
            </Link>
          )}
          {can('posts.create') && (
            <Link
              to="/posts/new"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>New Post</span>
            </Link>
          )}
          {can('products.create') && (
            <Link
              to="/products/new"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>New Product</span>
            </Link>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${card.color}`} />
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white font-mono block">
                  {loading ? '...' : card.value}
                </span>
                <span className="text-xs text-slate-400">{card.title}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            <h2 className="font-semibold text-sm text-white">Recently Updated Content</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Realtime from Filesystem</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Title / Item</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Modified</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading dashboard statistics...
                  </td>
                </tr>
              ) : !stats?.recentlyUpdated?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No content found in storage. Create your first page or post to begin!
                  </td>
                </tr>
              ) : (
                stats.recentlyUpdated.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-3.5 font-medium text-white">
                      <Link
                        to={`/${item.type}s/${item.slug}`}
                        className="hover:text-brand-400 transition"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-mono uppercase bg-slate-800 text-slate-300">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={item.status as any} />
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400 font-mono">
                      {new Date(item.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        to={`/${item.type}s/${item.slug}`}
                        className="text-xs text-brand-400 hover:underline font-semibold"
                      >
                        Edit →
                      </Link>
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

import React, { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  AlertTriangle,
  CheckCircle2,
  FileText,
  BookOpen,
  ShoppingBag,
  Boxes,
  FileCode,
  RotateCw,
  Clock,
  User,
  ShieldAlert,
  Loader2,
  FolderOpen,
  Image as ImageIcon
} from 'lucide-react';
import type { TrashedItem, TrashEntityType } from '@cms/schemas';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';

interface FilterTab {
  id: 'all' | TrashEntityType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FILTER_TABS: FilterTab[] = [
  { id: 'all', label: 'All Items', icon: Trash2 },
  { id: 'page', label: 'Pages', icon: FileText },
  { id: 'post', label: 'Posts', icon: BookOpen },
  { id: 'product', label: 'Products', icon: ShoppingBag },
  { id: 'blueprint', label: 'Blueprints', icon: Boxes },
  { id: 'blueprint-entry', label: 'Blueprint Entries', icon: FileCode },
  { id: 'media', label: 'Media', icon: ImageIcon }
];

export const TrashPage: React.FC = () => {
  const { can } = useAuth();
  const [items, setItems] = useState<TrashedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | TrashEntityType>('all');
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal States
  const [itemToDeletePermanently, setItemToDeletePermanently] = useState<TrashedItem | null>(null);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadTrashItems();
  }, []);

  const loadTrashItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<TrashedItem[]>('/api/trash');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trash items');
    } finally {
      setLoading(false);
    }
  };

  const notifyTrashUpdated = () => {
    window.dispatchEvent(new CustomEvent('trash-updated'));
  };

  const handleRestore = async (item: TrashedItem) => {
    setActionLoadingId(item.trashId);
    setError(null);
    setSuccess(null);

    try {
      await api.post(`/api/trash/${item.trashId}/restore`);
      setItems((prev) => prev.filter((i) => i.trashId !== item.trashId));
      setSuccess(`"${item.title}" successfully restored as draft!`);
      notifyTrashUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore item');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!itemToDeletePermanently) return;

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/api/trash/${itemToDeletePermanently.trashId}`);
      setItems((prev) => prev.filter((i) => i.trashId !== itemToDeletePermanently.trashId));
      setSuccess(`"${itemToDeletePermanently.title}" permanently deleted from system.`);
      setItemToDeletePermanently(null);
      notifyTrashUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Permanent delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmEmptyTrash = async () => {
    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.delete<{ message: string; deletedCount: number }>('/api/trash');
      setItems([]);
      setShowEmptyModal(false);
      setSuccess(res?.message || 'Trash has been completely emptied.');
      notifyTrashUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to empty trash');
    } finally {
      setIsDeleting(false);
    }
  };

  const getEntityBadge = (type: TrashEntityType) => {
    switch (type) {
      case 'page':
        return {
          label: 'Page',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: FileText
        };
      case 'post':
        return {
          label: 'Post',
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: BookOpen
        };
      case 'product':
        return {
          label: 'Product',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: ShoppingBag
        };
      case 'blueprint':
        return {
          label: 'Blueprint Schema',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: Boxes
        };
      case 'blueprint-entry':
        return {
          label: 'Blueprint Entry',
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          icon: FileCode
        };
      case 'media':
        return {
          label: 'Media File',
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: ImageIcon
        };
      default:
        return {
          label: type,
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          icon: Trash2
        };
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesFilter = activeFilter === 'all' || item.entityType === activeFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.originalSlug.toLowerCase().includes(q) ||
      (item.blueprintSlug && item.blueprintSlug.toLowerCase().includes(q)) ||
      (item.deletedBy && item.deletedBy.toLowerCase().includes(q));

    return matchesFilter && matchesSearch;
  });

  const countByType = (type: TrashEntityType) => {
    return items.filter((i) => i.entityType === type).length;
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 w-full pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-rose-400 mb-1">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Soft Delete Recovery & System Trash</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Trash</span>
            {items.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            All deleted items are stored in Trash before permanent filesystem removal. You can safely restore any item back to drafts or wipe items permanently.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={loadTrashItems}
            disabled={loading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg flex items-center space-x-1.5 border border-slate-700/80 transition"
            title="Refresh Trash"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {can('pages.delete') && (
            <button
              onClick={() => setShowEmptyModal(true)}
              disabled={items.length === 0 || loading}
              className={`px-4 py-2 font-bold text-xs rounded-lg flex items-center space-x-2 transition ${
                items.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Empty Trash</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-300 font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-300 font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {/* Info notice about safe restoration */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-slate-300">
        <ShieldAlert className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-200">Safe Restore Guarantee: </span>
          Restoring any item automatically resets its publishing status to <span className="text-amber-400 font-semibold font-mono">draft</span>. This guarantees that accidentally restored items will not immediately overwrite your public website until you review and publish them.
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.id === 'all' ? items.length : countByType(tab.id as TrashEntityType);
            const isActive = activeFilter === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                    : 'bg-slate-900/40 text-slate-400 border-transparent hover:bg-slate-800/60 hover:text-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-800/80 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, slug, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-12 text-center">
          <Loader2 className="w-6 h-6 text-brand-500 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-mono">Loading trash contents...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-500 mx-auto mb-4 shadow-inner">
            <Trash2 className="w-8 h-8 opacity-40 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            {items.length === 0 ? 'Trash is empty' : 'No matching items in trash'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {items.length === 0
              ? 'When you delete pages, posts, blueprints, or entries, they will be kept here safely so you can restore them anytime.'
              : 'Try clearing your search query or selecting another item filter tab above.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-800/80">
            {filteredItems.map((item) => {
              const badge = getEntityBadge(item.entityType);
              const BadgeIcon = badge.icon;
              const isItemBusy = actionLoadingId === item.trashId;

              return (
                <div
                  key={item.trashId}
                  className="p-4 sm:p-4.5 hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-400 flex-shrink-0 mt-0.5">
                      <BadgeIcon className="w-5 h-5 text-slate-300" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-semibold text-white text-sm tracking-tight truncate max-w-md">
                          {item.title}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium flex items-center space-x-1 ${badge.bg}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                        {item.blueprintSlug && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                            blueprint: {item.blueprintSlug}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1.5 flex-wrap gap-y-1">
                        <div className="flex items-center space-x-1 font-mono text-slate-400">
                          <FolderOpen className="w-3 h-3 text-slate-500" />
                          <span>{item.originalSlug}</span>
                        </div>
                        <span className="text-slate-600">&bull;</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Deleted: {formatDate(item.deletedAt)}</span>
                        </div>
                        {item.deletedBy && (
                          <>
                            <span className="text-slate-600">&bull;</span>
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3 text-slate-500" />
                              <span>By: {item.deletedBy}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                    <button
                      onClick={() => handleRestore(item)}
                      disabled={isItemBusy}
                      className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                      title="Restore as draft"
                    >
                      {isItemBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      <span>Restore</span>
                    </button>

                    {can('pages.delete') && (
                      <button
                        onClick={() => setItemToDeletePermanently(item)}
                        disabled={isItemBusy}
                        className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                        title="Delete permanently from filesystem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Permanently</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal: Single Item Permanent Delete */}
      {itemToDeletePermanently && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Permanently Delete Item?</h3>
                <p className="text-[11px] text-rose-300/80 font-mono">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-bold text-white font-mono">"{itemToDeletePermanently.title}"</span>?
              The item file will be purged from the filesystem permanently and cannot be recovered.
            </p>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div>Type: <span className="text-slate-200">{itemToDeletePermanently.entityType}</span></div>
              <div>Slug: <span className="text-slate-200">{itemToDeletePermanently.originalSlug}</span></div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setItemToDeletePermanently(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPermanentDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center space-x-2 shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Empty All Trash */}
      {showEmptyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Empty All Trash?</h3>
                <p className="text-[11px] text-rose-300/80 font-mono">Permanent wipe of {items.length} items</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to completely empty the Trash? All <span className="font-bold text-white">{items.length}</span> items currently in the trash directory will be wiped from disk permanently.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowEmptyModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEmptyTrash}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center space-x-2 shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Yes, Empty Trash</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

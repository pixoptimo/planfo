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
          bg: 'bg-surface-container text-on-surface-variant border-surface-container-high/40',
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
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-high/40 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-rose-400 mb-1">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Soft Delete Recovery & System Trash</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-serif text-on-surface tracking-tight flex items-center gap-2">
            <span>Trash</span>
            {items.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
            All deleted items are stored in Trash before permanent filesystem removal. You can safely restore any item back to drafts or wipe items permanently.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={loadTrashItems}
            disabled={loading}
            className="px-3 py-2 bg-surface-container hover:bg-surface-container-highest text-on-surface font-semibold text-xs rounded-lg flex items-center space-x-1.5 border border-surface-container-high/50/80 transition"
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
                  ? 'bg-surface-container text-on-surface-variant cursor-not-allowed border border-surface-container-high/40'
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
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-800 font-medium text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-800 hover:text-emerald-900 font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-700 font-medium text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-800 font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {/* Info notice about safe restoration */}
      <div className="bg-surface-container-low/60 border border-surface-container-high/40 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-on-surface">
        <ShieldAlert className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="leading-relaxed">
          <span className="font-semibold text-on-surface">Safe Restore Guarantee: </span>
          Restoring any item automatically resets its publishing status to <span className="text-amber-800 font-bold font-mono">draft</span>. This guarantees that accidentally restored items will not immediately overwrite your public website until you review and publish them.
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
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : 'bg-surface-container-high/40 text-on-surface-variant border-transparent hover:bg-surface-container-high/60 hover:text-on-surface'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-on-primary' : 'bg-surface-container text-on-surface-variant'
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
          <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, slug, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-lowest/80 border border-surface-container-high/40 rounded-lg pl-8 pr-3 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-surface-container-low/60 border border-surface-container-high/40 rounded-xl p-12 text-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-3" />
          <p className="text-xs text-on-surface-variant font-mono">Loading trash contents...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-surface-container-high/40 border border-surface-container-high/40 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high/60 border border-surface-container-high/50/50 flex items-center justify-center text-on-surface-variant mx-auto mb-4 shadow-inner">
            <Trash2 className="w-8 h-8 opacity-40 text-on-surface-variant" />
          </div>
          <h3 className="text-base font-semibold text-on-surface mb-1">
            {items.length === 0 ? 'Trash is empty' : 'No matching items in trash'}
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
            {items.length === 0
              ? 'When you delete pages, posts, blueprints, or entries, they will be kept here safely so you can restore them anytime.'
              : 'Try clearing your search query or selecting another item filter tab above.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-low/60 border border-surface-container-high/40 rounded-xl overflow-hidden shadow-sm">
          <div className="divide-y divide-surface-container-high/30">
            {filteredItems.map((item) => {
              const badge = getEntityBadge(item.entityType);
              const BadgeIcon = badge.icon;
              const isItemBusy = actionLoadingId === item.trashId;

              return (
                <div
                  key={item.trashId}
                  className="p-4 sm:p-4.5 hover:bg-surface-container-high/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-surface-container border border-surface-container-high/50/80 flex items-center justify-center text-on-surface-variant flex-shrink-0 mt-0.5">
                      <BadgeIcon className="w-5 h-5 text-on-surface" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-semibold text-on-surface text-sm tracking-tight truncate max-w-md">
                          {item.title}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium flex items-center space-x-1 ${badge.bg}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                        {item.blueprintSlug && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant border border-surface-container-high/50">
                            blueprint: {item.blueprintSlug}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] text-on-surface-variant mt-1.5 flex-wrap gap-y-1">
                        <div className="flex items-center space-x-1 font-mono text-on-surface-variant">
                          <FolderOpen className="w-3 h-3 text-on-surface-variant" />
                          <span>{item.originalSlug}</span>
                        </div>
                        <span className="text-outline-variant">&bull;</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-on-surface-variant" />
                          <span>Deleted: {formatDate(item.deletedAt)}</span>
                        </div>
                        {item.deletedBy && (
                          <>
                            <span className="text-outline-variant">&bull;</span>
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3 text-on-surface-variant" />
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
                      className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 hover:text-emerald-800 border border-emerald-500/20 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
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
                        className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-700 hover:text-rose-800 border border-rose-500/20 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-low/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-base">Permanently Delete Item?</h3>
                <p className="text-[11px] text-rose-700 font-mono font-medium">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-on-surface leading-relaxed">
              Are you sure you want to permanently delete <span className="font-bold text-on-surface font-mono">"{itemToDeletePermanently.title}"</span>?
              The item file will be purged from the filesystem permanently and cannot be recovered.
            </p>

            <div className="bg-surface-container-low/60 p-3 rounded-lg border border-surface-container-high/40 text-[11px] font-mono text-on-surface-variant space-y-1">
              <div>Type: <span className="text-on-surface font-semibold">{itemToDeletePermanently.entityType}</span></div>
              <div>Slug: <span className="text-on-surface font-semibold">{itemToDeletePermanently.originalSlug}</span></div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setItemToDeletePermanently(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-highest text-on-surface font-semibold text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPermanentDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center space-x-2 shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Trash2 className="w-3.5 h-3.5 text-white" />}
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Empty All Trash */}
      {showEmptyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-low/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-base">Empty All Trash?</h3>
                <p className="text-[11px] text-rose-700 font-mono font-medium">Permanent wipe of {items.length} items</p>
              </div>
            </div>

            <p className="text-xs text-on-surface leading-relaxed">
              Are you sure you want to completely empty the Trash? All <span className="font-bold text-on-surface">{items.length}</span> items currently in the trash directory will be wiped from disk permanently.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowEmptyModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-highest text-on-surface font-semibold text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEmptyTrash}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center space-x-2 shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Trash2 className="w-3.5 h-3.5 text-white" />}
                <span>Yes, Empty Trash</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

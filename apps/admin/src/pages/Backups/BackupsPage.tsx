import React, { useState, useEffect } from 'react';
import { Archive, Plus, Download, RotateCcw, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { BackupMetadata } from '@cms/schemas';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';

export const BackupsPage: React.FC = () => {
  const { can } = useAuth();
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const data = await api.get<BackupMetadata[]>('/api/backups');
      setBackups(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await api.post<BackupMetadata>('/api/backups');
      setBackups([created, ...backups]);
      setSuccess('Filesystem backup archive generated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup failed');
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (id: string) => {
    if (!confirm(`Are you sure you want to restore backup "${id}"? This will replace your current content in storage.`)) return;

    try {
      await api.post(`/api/backups/${id}/restore`);
      setSuccess(`Backup "${id}" restored successfully!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  const deleteBackup = async (id: string) => {
    if (!confirm(`Delete backup "${id}"?`)) return;

    try {
      await api.delete(`/api/backups/${id}`);
      setBackups(backups.filter((b) => b.id !== id));
      setSuccess('Backup deleted.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Filesystem Backups</h1>
          <p className="text-xs text-slate-400 mt-1">Create portable zip archives containing content, media, revisions, and settings</p>
        </div>

        {can('backups.create') && (
          <button
            type="button"
            onClick={createBackup}
            disabled={creating}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition disabled:opacity-50 self-start"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>{creating ? 'Creating Archive...' : 'Create New Backup'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Backups List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Backup Archive ID</th>
                <th className="px-6 py-3">Date & Time</th>
                <th className="px-6 py-3">Archive Size</th>
                <th className="px-6 py-3">Content Items</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading backups...</td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No backups found. Click "Create New Backup" above.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-3.5 font-mono text-xs text-white flex items-center space-x-2">
                      <Archive className="w-4 h-4 text-brand-400" />
                      <span>{b.id}</span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400 font-mono">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono text-slate-300">
                      {formatFileSize(b.size)}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400">
                      {b.contentsCount.pages} pages, {b.contentsCount.posts} posts, {b.contentsCount.products} products, {b.contentsCount.media} media
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <a
                          href={`/api/backups/${b.id}/download`}
                          className="p-1.5 text-slate-400 hover:text-brand-400 rounded transition"
                          title="Download Zip Archive"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        {can('backups.restore') && (
                          <button
                            type="button"
                            onClick={() => restoreBackup(b.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded transition"
                            title="Restore Storage from Backup"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {can('backups.delete') && (
                          <button
                            type="button"
                            onClick={() => deleteBackup(b.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded transition"
                            title="Delete Backup"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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

import React, { useState, useEffect } from 'react';
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
    <div className="space-y-6 w-full font-body-md text-on-surface antialiased">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label-xs text-label-xs uppercase tracking-widest text-primary font-bold">
              09 / Data & Disaster Recovery
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <h1 className="font-headline-lg text-headline-lg font-serif text-on-surface tracking-tight">
            Filesystem Backups
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant pt-1">
            Create portable zip snapshots containing markdown content, media, revisions, and site settings.
          </p>
        </div>

        {can('backups.create') && (
          <button
            type="button"
            onClick={createBackup}
            disabled={creating}
            className="px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01] disabled:opacity-50 self-start sm:self-center"
          >
            {creating ? (
              <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">archive</span>
            )}
            <span>{creating ? 'Creating Snapshot...' : 'Create New Backup'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-error-container/40 border border-error/20 rounded-2xl flex items-center gap-3 text-error font-body-sm">
          <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-surface-container-highest border border-primary/20 rounded-2xl flex items-center gap-3 text-primary font-body-sm font-semibold">
          <span className="material-symbols-outlined text-[20px] shrink-0">check_circle</span>
          <span>{success}</span>
        </div>
      )}

      {/* Backups List Card */}
      <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead className="bg-surface-container-low text-on-surface-variant font-label-xs text-label-xs uppercase tracking-wider border-b border-surface-container-high/40">
              <tr>
                <th className="px-6 py-3.5">Backup Archive ID</th>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5">Archive Size</th>
                <th className="px-6 py-3.5">Content Items</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/30 text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant font-body-sm">
                    <div className="flex flex-col items-center gap-2">
                      <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span>Loading backups...</span>
                    </div>
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant font-body-sm">
                    No backups found. Click "Create New Backup" above to generate a snapshot.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-container-low/40 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-on-surface flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[18px]">archive</span>
                      <span>{b.id}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant font-mono">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-bold text-primary">
                      {formatFileSize(b.size)}
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">
                      <span className="bg-surface-container px-2.5 py-1 rounded-full font-label-xs text-label-xs font-medium text-on-surface">
                        {b.contentsCount.pages} pages, {b.contentsCount.posts} posts, {b.contentsCount.products} products, {b.contentsCount.media} media
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/api/backups/${b.id}/download`}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                          title="Download ZIP"
                        >
                          <span className="material-symbols-outlined text-[18px]">download</span>
                        </a>

                        {can('backups.restore') && (
                          <button
                            type="button"
                            onClick={() => restoreBackup(b.id)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                            title="Restore Snapshot"
                          >
                            <span className="material-symbols-outlined text-[18px]">restore</span>
                          </button>
                        )}

                        {can('backups.delete') && (
                          <button
                            type="button"
                            onClick={() => deleteBackup(b.id)}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-lg transition-colors"
                            title="Delete Backup"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
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

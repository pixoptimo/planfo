import React, { useState, useEffect } from 'react';
import type { MediaItem } from '@cms/schemas';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';

export const MediaLibrary: React.FC = () => {
  const { can } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Preview Modal
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const data = await api.get<MediaItem[]>('/api/media');
      setItems(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('alt', file.name.replace(/\.[^/.]+$/, ''));

        const uploaded = await api.post<MediaItem>('/api/media/upload', formData);
        setItems((prev) => [uploaded, ...prev]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete media item "${item.originalName}"?`)) return;
    try {
      await api.delete(`/api/media/${item.id}`);
      setItems(items.filter((i) => i.id !== item.id));
      if (previewItem?.id === item.id) setPreviewItem(null);
      window.dispatchEvent(new CustomEvent('trash-updated'));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filtered = items.filter((i) =>
    i.originalName.toLowerCase().includes(search.toLowerCase()) ||
    i.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full font-body-md text-on-surface antialiased">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label-xs text-label-xs uppercase tracking-widest text-primary font-bold">
              03 / Digital Assets
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <h1 className="font-headline-lg text-headline-lg font-serif text-on-surface tracking-tight">
            Media Library
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant pt-1">
            High-performance image optimization, WebP compression, and asset management.
          </p>
        </div>

        {can('media.upload') && (
          <label className="cursor-pointer px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01] self-start sm:self-center">
            {uploading ? (
              <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">upload</span>
            )}
            <span>{uploading ? 'Optimizing & Uploading...' : 'Upload Media'}</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-surface-container-lowest border border-surface-container-high/40 p-4 rounded-2xl shadow-sm flex items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined text-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media files by filename or original title..."
            className="w-full bg-surface-container-low border border-surface-container-high/30 rounded-xl pl-10 pr-4 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="text-center py-20 text-on-surface-variant flex flex-col items-center gap-2">
          <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span>Loading asset library...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl p-14 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto text-primary">
            <span className="material-symbols-outlined text-[28px]">photo_library</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">No media files found</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mx-auto">
            {search
              ? 'No files matched your search term.'
              : 'Upload WebP, PNG, JPG, or SVG images to store them in atomic assets.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl overflow-hidden hover:border-primary/40 transition-all flex flex-col shadow-2xs"
            >
              <div
                onClick={() => setPreviewItem(item)}
                className="relative aspect-square bg-surface-container overflow-hidden cursor-pointer flex items-center justify-center"
              >
                <img
                  src={item.url}
                  alt={item.alt || item.originalName}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                />
                <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-surface-container-lowest/90 backdrop-blur border border-surface-container-high/40 text-primary uppercase shadow-xs">
                  {item.filename.endsWith('.webp') ? 'WEBP' : item.filename.endsWith('.svg') ? 'SVG' : 'IMG'}
                </span>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-label-sm text-label-sm font-semibold text-on-surface truncate" title={item.originalName}>
                    {item.originalName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      {formatFileSize(item.size)}
                    </span>
                    {item.compressionRatio !== undefined && item.compressionRatio > 0 && (
                      <span className="text-[9px] font-bold text-primary font-mono bg-surface-container px-1.5 py-0.2 rounded-full">
                        -{item.compressionRatio}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-surface-container-high/40">
                  <button
                    type="button"
                    onClick={() => copyUrl(item)}
                    className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                    title="Copy Image URL"
                  >
                    {copiedId === item.id ? (
                      <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    )}
                  </button>

                  {can('media.delete') && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-lg transition-colors"
                      title="Delete Image"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-surface-container-high/40 flex items-center justify-between bg-surface-container-low/40">
              <span className="font-title-md text-title-md font-semibold text-on-surface truncate max-w-md">
                {previewItem.originalName}
              </span>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 bg-surface-container flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img src={previewItem.url} alt="" className="max-h-full max-w-full object-contain rounded-xl shadow-sm" />
            </div>

            <div className="p-5 bg-surface-container-lowest border-t border-surface-container-high/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-body-sm font-body-sm">
              <div className="space-y-1.5">
                <p className="text-on-surface-variant">
                  File: <span className="font-mono text-on-surface font-semibold">{previewItem.filename}</span>
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-on-surface-variant text-xs">
                  <p>
                    Format:{' '}
                    <span className="font-mono text-primary font-bold uppercase">
                      {previewItem.format || (previewItem.filename.endsWith('.webp') ? 'webp' : 'svg')}
                    </span>
                  </p>
                  {previewItem.width && previewItem.height && (
                    <p>
                      Dimensions:{' '}
                      <span className="font-mono text-on-surface">
                        {previewItem.width} × {previewItem.height} px
                      </span>
                    </p>
                  )}
                  <p>
                    Size: <span className="font-mono text-primary font-bold">{formatFileSize(previewItem.size)}</span>
                  </p>
                </div>
                {previewItem.originalSize !== undefined && previewItem.originalSize > previewItem.size && (
                  <p className="text-on-surface-variant text-xs">
                    Optimization:{' '}
                    <span className="font-mono line-through">{formatFileSize(previewItem.originalSize)}</span> →{' '}
                    <span className="font-mono text-primary font-bold">{formatFileSize(previewItem.size)}</span>{' '}
                    <span className="text-primary font-semibold">({previewItem.compressionRatio}% saved)</span>
                  </p>
                )}
                <p className="text-on-surface-variant text-xs">
                  URL: <span className="font-mono text-primary font-semibold">{previewItem.url}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => copyUrl(previewItem)}
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copiedId === previewItem.id ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedId === previewItem.id ? 'Copied URL!' : 'Copy URL'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

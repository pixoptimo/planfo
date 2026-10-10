import React, { useState, useEffect } from 'react';
import { Upload, Search, Trash2, Copy, Check, Image as ImageIcon, X, ExternalLink } from 'lucide-react';
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Media Library</h1>
          <p className="text-xs text-slate-400 mt-1">Upload and manage images, illustrations, and static media files</p>
        </div>

        {can('media.upload') && (
          <label className="cursor-pointer px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition self-start">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Media'}</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media files by name or filename..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading media library...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No media files found.</p>
          <p className="text-xs text-slate-500 mt-1">Upload JPG, PNG, WEBP, GIF, or SVG images to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition flex flex-col"
            >
              <div
                onClick={() => setPreviewItem(item)}
                className="relative aspect-square bg-slate-950 overflow-hidden cursor-pointer flex items-center justify-center"
              >
                <img
                  src={item.url}
                  alt={item.alt || item.originalName}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                />
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900/90 backdrop-blur border border-slate-700 text-brand-400 uppercase shadow-sm">
                  {item.filename.endsWith('.webp') ? 'WEBP' : item.filename.endsWith('.svg') ? 'SVG' : 'IMG'}
                </span>
              </div>

              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-medium text-white truncate" title={item.originalName}>
                    {item.originalName}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatFileSize(item.size)}
                    </span>
                    {item.compressionRatio !== undefined && item.compressionRatio > 0 && (
                      <span className="text-[9px] font-bold text-emerald-400 font-mono bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                        -{item.compressionRatio}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => copyUrl(item)}
                    className="p-1 text-slate-400 hover:text-brand-400 rounded transition"
                    title="Copy Image URL"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {can('media.delete') && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-1 text-slate-400 hover:text-red-400 rounded transition"
                      title="Delete Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-semibold text-sm text-white truncate max-w-md">{previewItem.originalName}</span>
              <button onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-950 flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img src={previewItem.url} alt="" className="max-h-full max-w-full object-contain rounded-lg shadow" />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <p className="text-slate-400">File: <span className="font-mono text-slate-200">{previewItem.filename}</span></p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400">
                  <p>Format: <span className="font-mono text-brand-400 uppercase font-semibold">{previewItem.format || (previewItem.filename.endsWith('.webp') ? 'webp' : 'svg')}</span></p>
                  {previewItem.width && previewItem.height && (
                    <p>Dimensions: <span className="font-mono text-slate-200">{previewItem.width} × {previewItem.height} px</span></p>
                  )}
                  <p>Size: <span className="font-mono text-emerald-400 font-semibold">{formatFileSize(previewItem.size)}</span></p>
                </div>
                {previewItem.originalSize !== undefined && previewItem.originalSize > previewItem.size && (
                  <p className="text-slate-400">
                    Optimization: <span className="font-mono text-slate-400 line-through">{formatFileSize(previewItem.originalSize)}</span> → <span className="font-mono text-emerald-400 font-bold">{formatFileSize(previewItem.size)}</span> <span className="text-emerald-400">({previewItem.compressionRatio}% size reduction)</span>
                  </p>
                )}
                <p className="text-slate-400">URL: <span className="font-mono text-emerald-400">{previewItem.url}</span></p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => copyUrl(previewItem)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedId === previewItem.id ? 'Copied!' : 'Copy URL'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

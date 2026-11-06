import React, { useState, useEffect } from 'react';
import { Upload, Search, X, Check } from 'lucide-react';
import type { MediaItem } from '@cms/schemas';
import { api } from '../../api/client.js';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, alt?: string) => void;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen]);

  const loadMedia = async () => {
    try {
      setLoading(true);
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
        onSelect(uploaded.url, uploaded.alt);
        onClose();
        break; // Auto-select first uploaded
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = items.filter(
    (i) =>
      i.originalName.toLowerCase().includes(search.toLowerCase()) ||
      i.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-body-md text-on-surface antialiased">
      <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-container-high/40 flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-[18px]">photo_library</span>
            </div>
            <div>
              <h3 className="font-title-md text-title-md font-semibold text-on-surface">Select from Media Library</h3>
              <p className="font-body-sm text-[11px] text-on-surface-variant">Choose an existing asset or upload a new file</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-surface-container-high/40 bg-surface-container-lowest flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search media by filename or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-surface-container-high/30 rounded-xl pl-9 pr-4 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <label className="cursor-pointer bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-surface-container-low/20">
          {loading ? (
            <div className="text-center py-16 text-on-surface-variant font-body-sm flex flex-col items-center gap-2">
              <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span>Loading media library...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant font-body-sm space-y-2">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">image</span>
              <p>No media items found. Upload one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item.url, item.alt);
                    onClose();
                  }}
                  className="group relative aspect-square bg-surface-container border border-surface-container-high/40 rounded-xl overflow-hidden cursor-pointer hover:border-primary transition-all shadow-2xs"
                >
                  <img
                    src={item.url}
                    alt={item.alt || item.originalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-2">
                    <span className="text-[10px] text-white truncate font-mono bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                      {item.originalName}
                    </span>
                    <span className="self-end bg-primary text-on-primary p-1 rounded-full shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

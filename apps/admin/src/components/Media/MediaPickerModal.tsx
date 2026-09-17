import React, { useState, useEffect } from 'react';
import { X, Upload, Check, Image as ImageIcon, Search } from 'lucide-react';
import type { MediaItem } from '@cms/schemas';
import { api } from '../../api/client.js';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, alt?: string) => void;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const data = await api.get<MediaItem[]>('/api/media');
      setItems(data);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', file.name.replace(/\.[^/.]+$/, ''));

      const uploaded = await api.post<MediaItem>('/api/media/upload', formData);
      setItems((prev) => [uploaded, ...prev]);
      onSelect(uploaded.url, uploaded.alt);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = items.filter((i) =>
    i.originalName.toLowerCase().includes(search.toLowerCase()) ||
    i.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-brand-400" />
            <h3 className="font-semibold text-lg text-white">Select from Media Library</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search media..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <label className="cursor-pointer bg-brand-600 hover:bg-brand-500 text-slate-950 font-medium px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading media library...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No media items found. Upload one to get started!</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item.url, item.alt);
                    onClose();
                  }}
                  className="group relative aspect-square bg-slate-950 border border-slate-800 rounded-lg overflow-hidden cursor-pointer hover:border-brand-500 transition"
                >
                  <img
                    src={item.url}
                    alt={item.alt || item.originalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-2">
                    <span className="text-[10px] text-slate-300 truncate font-mono">{item.originalName}</span>
                    <span className="self-end bg-brand-500 text-slate-950 p-1 rounded-full">
                      <Check className="w-3 h-3" />
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

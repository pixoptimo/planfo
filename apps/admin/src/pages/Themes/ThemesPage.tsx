import React, { useState, useEffect, useRef } from 'react';
import {
  Palette,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowRight,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import type { ThemeInfo } from '@cms/schemas';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';

export const ThemesPage: React.FC = () => {
  const { can } = useAuth();
  const [themes, setThemes] = useState<ThemeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cleaningAll, setCleaningAll] = useState(false);
  const [confirmDeleteTheme, setConfirmDeleteTheme] = useState<ThemeInfo | null>(null);
  const [confirmCleanAll, setConfirmCleanAll] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveSiteUrl, setLiveSiteUrl] = useState<string>('http://localhost:3000');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadThemes();
    api.get<{ siteUrl: string }>('/api/system/info')
      .then((info) => {
        if (info?.siteUrl) setLiveSiteUrl(info.siteUrl);
      })
      .catch(() => {});
  }, []);

  const loadThemes = async () => {
    try {
      const data = await api.get<ThemeInfo[]>('/api/themes');
      setThemes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load themes');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    setActivatingId(id);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post<{ message: string; activeTheme: string; themes: ThemeInfo[] }>(
        `/api/themes/${id}/activate`
      );
      setThemes(res.themes);
      setSuccess(`Theme "${res.activeTheme}" is now active and the live static preview has been generated!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate theme');
    } finally {
      setActivatingId(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setError('Please select a valid .zip theme package.');
      return;
    }

    setInstalling(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('theme', file);

    try {
      const res = await api.post<{ message: string; themeId: string; themes: ThemeInfo[] }>(
        '/api/themes/install',
        formData
      );
      setThemes(res.themes);
      setSuccess(res.message || `Theme "${res.themeId}" installed successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install theme');
    } finally {
      setInstalling(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteTheme = async (theme: ThemeInfo) => {
    setDeletingId(theme.id);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.delete<{ message: string; activeTheme: string; themes: ThemeInfo[] }>(
        `/api/themes/${theme.id}`
      );
      setThemes(res.themes);
      setSuccess(res.message || `Theme "${theme.name}" removed successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete theme');
    } finally {
      setDeletingId(null);
      setConfirmDeleteTheme(null);
    }
  };

  const handleCleanAllThemes = async () => {
    setCleaningAll(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.delete<{ message: string; deletedCount: number; activeTheme: string; themes: ThemeInfo[] }>(
        '/api/themes'
      );
      setThemes(res.themes);
      setSuccess(res.message || 'All uploaded themes removed. Active theme reset to default.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove uploaded themes');
    } finally {
      setCleaningAll(false);
      setConfirmCleanAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading design themes...</span>
      </div>
    );
  }

  const activeTheme = themes.find((t) => t.isActive);

  return (
    <div className="space-y-6 w-full pb-20">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-brand-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Design Themes & Layouts</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Choose the presentation layout for your static website.
          </p>
        </div>

        {can('settings.update') && (
          <div className="flex flex-wrap items-center gap-2">
            {themes.some((t) => t.id !== 'planfo-default' && t.id !== 'aero-modern') && (
              <button
                type="button"
                disabled={cleaningAll || installing}
                onClick={() => setConfirmCleanAll(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50 shadow-sm"
              >
                {cleaningAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                )}
                <span>Remove Custom Themes</span>
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".zip"
              className="hidden"
            />
            <button
              type="button"
              disabled={installing || cleaningAll}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-2 transition shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {installing ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Upload className="w-4 h-4 text-slate-950" />
              )}
              <span>{installing ? 'Installing Theme...' : 'Upload Theme (.zip)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
          {liveSiteUrl && (
            <a
              href={liveSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold rounded-lg transition"
            >
              <span>View Live Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Active Theme Highlight Banner */}
      {activeTheme && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-brand-500/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-mono font-bold text-emerald-400 tracking-wider">
                  Active Design Theme
                </span>
                <span className="text-[11px] font-mono text-slate-500">v{activeTheme.version}</span>
              </div>
              <h2 className="text-lg font-bold text-white">{activeTheme.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{activeTheme.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Theme ID: {activeTheme.id}</span>
          </div>
        </div>
      )}

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {themes.map((theme) => {
          const isActive = theme.isActive;

          return (
            <div
              key={theme.id}
              className={`flex flex-col rounded-xl overflow-hidden bg-slate-900 transition duration-200 border ${
                isActive
                  ? 'border-emerald-500/50 shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Preview Thumbnail */}
              <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800">
                {theme.thumbnail ? (
                  <img
                    src={theme.thumbnail}
                    alt={theme.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-600">
                    <Palette className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <span className="text-xs font-mono">No Preview Available</span>
                  </div>
                )}

                {isActive && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500/90 text-slate-950 text-[10px] font-mono font-bold uppercase shadow-md flex items-center space-x-1 backdrop-blur-sm">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active Theme</span>
                  </div>
                )}

                {can('settings.update') && theme.id !== 'aero-modern' && (
                  <button
                    type="button"
                    title="Delete Theme"
                    disabled={deletingId === theme.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteTheme(theme);
                    }}
                    className="absolute top-3 left-3 p-1.5 rounded-lg bg-slate-950/80 hover:bg-red-500/30 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 transition backdrop-blur-sm shadow-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Card Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">{theme.name}</h3>
                    <span className="text-xs font-mono text-slate-500">v{theme.version}</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {theme.description || 'Custom theme for Aero CMS.'}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>By {theme.author || 'Aero Community'}</span>
                  </div>

                  {/* Supported Content Blueprints */}
                  {theme.supportedPacks && theme.supportedPacks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {theme.supportedPacks.map((pack) => (
                        <span
                          key={pack}
                          className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-950 text-slate-400 border border-slate-800"
                        >
                          {pack}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {isActive ? (
                    <>
                      <div className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Currently Deployed</span>
                      </div>
                      {can('settings.update') && theme.id !== 'aero-modern' && (
                        <button
                          type="button"
                          title="Remove Theme"
                          disabled={deletingId === theme.id}
                          onClick={() => setConfirmDeleteTheme(theme)}
                          className="px-2.5 py-1.5 bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 text-xs rounded-lg transition flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Remove</span>
                        </button>
                      )}
                    </>
                  ) : (
                    can('settings.update') && (
                      <>
                        <button
                          type="button"
                          disabled={activatingId === theme.id || deletingId === theme.id}
                          onClick={() => handleActivate(theme.id)}
                          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg flex items-center justify-center space-x-1.5 transition border border-slate-700 disabled:opacity-50"
                        >
                          {activatingId === theme.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                              <span>Activating...</span>
                            </>
                          ) : (
                            <>
                              <span>Activate Theme</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>

                        {theme.id !== 'aero-modern' && (
                          <button
                            type="button"
                            title="Delete Theme"
                            disabled={deletingId === theme.id}
                            onClick={() => setConfirmDeleteTheme(theme)}
                            className="p-2 bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 rounded-lg text-xs transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Single Theme Confirmation Modal */}
      {confirmDeleteTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-white">Delete Theme</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold text-white">"{confirmDeleteTheme.name}"</span>?
                {confirmDeleteTheme.isActive && (
                  <span className="block mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium text-[11px] text-left">
                    ⚠️ Note: This theme is currently active. Deleting it will automatically revert the site to the core default theme (<strong className="text-white">Aero Modern</strong>) and rebuild your site.
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={deletingId === confirmDeleteTheme.id}
                onClick={() => setConfirmDeleteTheme(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId === confirmDeleteTheme.id}
                onClick={() => handleDeleteTheme(confirmDeleteTheme)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {deletingId === confirmDeleteTheme.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Theme</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove All Uploaded Themes Confirmation Modal */}
      {confirmCleanAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-white">Remove All Uploaded Themes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This will permanently delete all custom and uploaded theme folders from the filesystem.
                The active theme will immediately revert to the default <span className="text-white font-semibold">Aero Modern</span> theme and the static website will be regenerated.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={cleaningAll}
                onClick={() => setConfirmCleanAll(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={cleaningAll}
                onClick={handleCleanAllThemes}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {cleaningAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove All Uploaded</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

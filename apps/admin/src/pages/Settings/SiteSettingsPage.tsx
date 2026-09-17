import React, { useState, useEffect } from 'react';
import { Save, Globe, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { SiteSettings } from '@cms/schemas';
import { api } from '../../api/client.js';
import { SEOFields } from '../../components/SEO/SEOFields.js';
import { MediaPickerModal } from '../../components/Media/MediaPickerModal.js';
import { useAuth } from '../../context/AuthContext.js';

export const SiteSettingsPage: React.FC = () => {
  const { can } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeMediaTarget, setActiveMediaTarget] = useState<'logo' | 'favicon' | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.get<SiteSettings>('/api/settings');
      setSettings(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await api.put<SiteSettings>('/api/settings', settings);
      setSettings(updated);
      setSuccess('Site settings and default SEO updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="text-center py-20 text-slate-500">Loading site configuration...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Site Settings & SEO</h1>
            <p className="text-xs text-slate-400 mt-1">Global website branding, URLs, metadata defaults, and social links</p>
          </div>

          {can('settings.update') && (
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-lg shadow-brand-500/20 transition disabled:opacity-50 self-start"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
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

        {/* General Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">General Website Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Site Name *
              </label>
              <input
                type="text"
                required
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Public Site URL *
              </label>
              <input
                type="text"
                required
                value={settings.siteUrl}
                onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                placeholder="https://example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Site Tagline / Headline
            </label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              placeholder="e.g. Blazing fast static websites"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Logo URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.logo || ''}
                  onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                  placeholder="/media/logo.png"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setActiveMediaTarget('logo')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Favicon URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.favicon || ''}
                  onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                  placeholder="/media/favicon.ico"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setActiveMediaTarget('favicon')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Global Default SEO */}
        <SEOFields
          seo={settings.defaultSEO}
          onChange={(newSeo) => setSettings({ ...settings, defaultSEO: newSeo })}
          defaultTitle={settings.siteName}
          defaultDescription={settings.tagline}
        />

        {/* Social Links & Analytics */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Social Links & Integrations</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Twitter / X Profile
              </label>
              <input
                type="text"
                value={settings.socialLinks?.twitter || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialLinks: { ...settings.socialLinks, twitter: e.target.value }
                  })
                }
                placeholder="https://twitter.com/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                GitHub Repository
              </label>
              <input
                type="text"
                value={settings.socialLinks?.github || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialLinks: { ...settings.socialLinks, github: e.target.value }
                  })
                }
                placeholder="https://github.com/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Google Analytics / Tracking ID
              </label>
              <input
                type="text"
                value={settings.analyticsId || ''}
                onChange={(e) => setSettings({ ...settings, analyticsId: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Footer Copyright Text
              </label>
              <input
                type="text"
                value={settings.footerText}
                onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>
      </form>

      <MediaPickerModal
        isOpen={Boolean(activeMediaTarget)}
        onClose={() => setActiveMediaTarget(null)}
        onSelect={(url) => {
          if (activeMediaTarget === 'logo') setSettings({ ...settings, logo: url });
          if (activeMediaTarget === 'favicon') setSettings({ ...settings, favicon: url });
        }}
      />
    </div>
  );
};

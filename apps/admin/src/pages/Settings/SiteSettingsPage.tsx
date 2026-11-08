import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Save, Globe, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, Package, Search, ArrowRight, RefreshCw, GitBranch, Server, Sliders, Cloud, ArrowRightLeft } from 'lucide-react';
import type { SiteSettings } from '@cms/schemas';
import { api } from '../../api/client.js';
import { MediaPickerModal } from '../../components/Media/MediaPickerModal.js';
import { useAuth } from '../../context/AuthContext.js';

export const SiteSettingsPage: React.FC = () => {
  const { can } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: 'general' | 'deployment' | 'features' | 'tools' =
    rawTab === 'deployment' || rawTab === 'features' || rawTab === 'tools' ? rawTab : 'general';

  const setActiveTab = (tab: 'general' | 'deployment' | 'features' | 'tools') => {
    if (tab === 'general') {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab });
    }
  };

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
      window.dispatchEvent(new CustomEvent('settings-updated', { detail: updated }));
      setSuccess('Site settings updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="text-center py-20 text-on-surface-variant font-mono text-xs">Loading site configuration...</div>;
  }

  return (
    <div className="space-y-6 w-full pb-20">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="border-b border-surface-container-high/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-serif text-on-surface tracking-tight flex items-center space-x-2">
                <Sliders className="w-6 h-6 text-primary" />
                <span>Settings</span>
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">Manage website branding, SEO directives, feature packs, and hosting configuration</p>
            </div>

            {can('settings.update') && activeTab !== 'tools' && (
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50 self-start"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                activeTab === 'general'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>General Settings</span>
            </button>

            <Link
              to="/settings/seo"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 flex items-center space-x-1.5 transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>SEO & Indexing</span>
            </Link>

            <button
              type="button"
              onClick={() => setActiveTab('deployment')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                activeTab === 'deployment'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Hosting & Deployment</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('features')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                activeTab === 'features'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Feature Packs</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tools')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                activeTab === 'tools'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>URL Tools</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-700 font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Feature Packs Section */}
        {activeTab === 'features' && (
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-surface-container-high/40 pb-3">
              <Package className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider font-mono">
                Planfo Feature Packs
              </h2>
            </div>
            <p className="text-xs text-on-surface-variant">
              Activate or deactivate modular capabilities for your site. Deactivated packs remain hidden to keep your CMS interface and static output lightweight.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Pages & Articles (Core - Always Active) */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-on-surface">Pages & Articles Blueprint</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 font-mono border border-emerald-500/20 font-semibold">
                      Core Active
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Manage static pages, blog articles, hierarchical categories, and menus.
                  </p>
                </div>
              </div>

              {/* Storefront Catalog Pack (Toggleable) */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex items-start justify-between">
                <div className="pr-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-on-surface">Storefront Catalog Pack</span>
                    {settings.featurePacks?.catalog ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono border border-primary/20 font-semibold">
                        Enabled
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono border border-surface-container-high/50 font-semibold">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Enables product catalog, pricing, SKU tracking, and product category pages.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.featurePacks?.catalog ?? false}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        featurePacks: {
                          ...settings.featurePacks,
                          catalog: e.target.checked
                        }
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Deployment & Hosting Section */}
        {activeTab === 'deployment' && (
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-surface-container-high/40 pb-3">
            <GitBranch className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider font-mono">
              Deployment & Hosting Architecture
            </h2>
          </div>
          <p className="text-xs text-on-surface-variant">
            Configure how and where your static website is published. Planfo runs with zero database, compiling clean static assets.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <label
              className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition ${
                (settings.deployment?.target ?? 'local') === 'github-pages'
                  ? 'bg-primary/10 border-primary text-primary font-semibold'
                  : 'bg-surface-container-low border-surface-container-high/40 text-on-surface-variant hover:border-surface-container-high/50'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <input
                  type="radio"
                  name="deployTarget"
                  value="github-pages"
                  checked={(settings.deployment?.target ?? 'local') === 'github-pages'}
                  onChange={() =>
                    setSettings({
                      ...settings,
                      deployment: {
                        ...settings.deployment,
                        target: 'github-pages'
                      }
                    })
                  }
                  className="accent-brand-500"
                />
                <span className="text-xs font-bold text-on-surface">Git & Cloud Hosting (GitHub Pages, Cloudflare, Netlify, Vercel)</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                1-click push to Git repositories, Cloudflare Pages, Netlify, Vercel, or GitHub Pages. Zero database costs.
              </p>
            </label>

            <label
              className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition ${
                (settings.deployment?.target ?? 'local') === 'server'
                  ? 'bg-primary/10 border-primary text-primary font-semibold'
                  : 'bg-surface-container-low border-surface-container-high/40 text-on-surface-variant hover:border-surface-container-high/50'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <input
                  type="radio"
                  name="deployTarget"
                  value="server"
                  checked={(settings.deployment?.target ?? 'local') === 'server'}
                  onChange={() =>
                    setSettings({
                      ...settings,
                      deployment: {
                        ...settings.deployment,
                        target: 'server'
                      }
                    })
                  }
                  className="accent-brand-500"
                />
                <span className="text-xs font-bold text-on-surface">Own Server (Self-Hosted)</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Atomic zero-downtime directory swap to web root on VPS, Hostinger, or cPanel.
              </p>
            </label>
          </div>

          {(settings.deployment?.target ?? 'local') === 'github-pages' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-surface-container-high/40">
              <div>
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                  GitHub Repository (owner/repo)
                </label>
                <input
                  type="text"
                  placeholder="e.g. username/my-bakery-shop"
                  value={settings.deployment?.gitRepo ?? ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      deployment: {
                        ...settings.deployment,
                        target: 'github-pages',
                        gitRepo: e.target.value
                      }
                    })
                  }
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                  Custom Domain / CNAME (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. www.mybakery.com"
                  value={settings.deployment?.cname ?? ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      deployment: {
                        ...settings.deployment,
                        target: 'github-pages',
                        cname: e.target.value,
                        customDomain: e.target.value
                      }
                    })
                  }
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
        </div>
      )}

        {/* General Info */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider font-mono">General Website Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                Site Name *
              </label>
              <input
                type="text"
                required
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                Public Site URL *
              </label>
              <input
                type="text"
                required
                value={settings.siteUrl}
                onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                placeholder="https://example.com"
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Site Tagline / Headline
            </label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              placeholder="e.g. Blazing fast static websites"
              className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                Logo URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.logo || ''}
                  onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                  placeholder="/media/logo.png"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setActiveMediaTarget('logo')}
                  className="p-2 bg-surface-container hover:bg-surface-container-highest text-primary rounded-lg text-xs"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                Favicon URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.favicon || ''}
                  onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                  placeholder="/media/favicon.ico"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setActiveMediaTarget('favicon')}
                  className="p-2 bg-surface-container hover:bg-surface-container-highest text-primary rounded-lg text-xs"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links & Analytics */}
        <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider font-mono">Social Links & Integrations</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
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
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
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
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                Google Analytics / Tracking ID
              </label>
              <input
                type="text"
                value={settings.analyticsId || ''}
                onChange={(e) => setSettings({ ...settings, analyticsId: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                Footer Copyright Text
              </label>
              <input
                type="text"
                value={settings.footerText}
                onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Dedicated SEO Settings Shortcut Card */}
        <div className="p-5 rounded-2xl bg-surface-container-low border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 flex-shrink-0 mt-0.5">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface flex items-center space-x-2">
                <span>SEO & Search Engine Indexing Settings</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono border border-primary/20 font-semibold">
                  Dedicated Tab
                </span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 max-w-xl leading-relaxed">
                Configure search engine visibility directives, fallback meta descriptions, social graph Open Graph banners, and preview live Google SERP snippets.
              </p>
            </div>
          </div>
          <Link
            to="/settings/seo"
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-highest text-primary font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition flex-shrink-0 self-start sm:self-auto border border-surface-container-high/50 hover:border-primary/40 shadow-sm"
          >
            <span>Open SEO Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    )}
  </form>

      {/* Global URL Migration & Search-Replace */}
      {activeTab === 'tools' && <UrlRewriterCard />}

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

interface UrlRewriteReport {
  dryRun: boolean;
  search: string;
  replace: string;
  totalMatches: number;
  filesChanged: number;
  files: Array<{
    file: string;
    matches: number;
  }>;
}

const UrlRewriterCard: React.FC = () => {
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [replace, setReplace] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<UrlRewriteReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!can('settings.update')) return null;

  const handleRewrite = async (dryRun: boolean) => {
    if (!search.trim()) {
      setError('Search term cannot be empty');
      return;
    }

    if (!dryRun && !window.confirm(`Are you sure you want to replace all occurrences of "${search}" with "${replace}" across all pages, posts, blueprints, and menus?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.post<UrlRewriteReport>('/api/settings/url-replace', {
        search: search.trim(),
        replace: replace.trim(),
        dryRun
      });
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'URL replacement failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl p-6 space-y-5">
      <div className="flex items-center space-x-2 border-b border-surface-container-high/40 pb-3">
        <RefreshCw className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider font-mono">
          Global URL & Permalink Search-and-Replace
        </h2>
      </div>

      <p className="text-xs text-on-surface-variant">
        Safely migrate domain names, ports (e.g. <code className="text-primary font-semibold">http://localhost:3000</code> to <code className="text-primary font-semibold">http://localhost:4000</code>), or URL prefixes across all JSON storage files (pages, blog posts, blueprints, products, and navigation menus) with atomic file writes and automatic site regeneration.
      </p>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-700 font-medium flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Search String / Old URL
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. http://localhost:3000 or /blog/hoodie"
            className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Replace With / New URL
          </label>
          <input
            type="text"
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            placeholder="e.g. http://localhost:4000 or /products/hoodie"
            className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          disabled={loading || !search.trim()}
          onClick={() => handleRewrite(true)}
          className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-highest text-primary font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Dry Run Preview</span>
        </button>

        <button
          type="button"
          disabled={loading || !search.trim()}
          onClick={() => handleRewrite(false)}
          className="px-3.5 py-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>Run Global Replace & Regenerate</span>
        </button>
      </div>

      {report && (
        <div className={`p-4 rounded-xl border text-xs space-y-2 ${
          report.dryRun
            ? 'bg-blue-500/10 border-blue-500/20 text-blue-800'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800'
        }`}>
          <div className="flex items-center space-x-2 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {report.dryRun
                ? `[Preview / Dry Run] Found ${report.totalMatches} matches in ${report.filesChanged} file(s).`
                : `Successfully replaced ${report.totalMatches} occurrences across ${report.filesChanged} file(s). Static site regenerated!`}
            </span>
          </div>

          {report.files.length > 0 ? (
            <div className="mt-2 space-y-1 pt-2 border-t border-surface-container-high/30 font-mono text-[11px]">
              {report.files.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-on-surface">
                  <span className="truncate pr-2">{item.file}</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-semibold text-[10px]">
                    {item.matches} {item.matches === 1 ? 'match' : 'matches'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-on-surface-variant text-xs italic">No matching instances found in any storage files.</p>
          )}
        </div>
      )}
    </div>
  );
};


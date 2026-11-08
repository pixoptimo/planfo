import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Save,
  Globe,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
  ExternalLink,
  Search,
  Eye,
  ShieldCheck,
  FileCode2,
  Share2,
  Cloud,
  Package,
  ArrowRightLeft
} from 'lucide-react';
import type { SiteSettings, SEO } from '@cms/schemas';
import { api } from '../../api/client.js';
import { MediaPickerModal } from '../../components/Media/MediaPickerModal.js';
import { useAuth } from '../../context/AuthContext.js';

export const SeoSettingsPage: React.FC = () => {
  const { can } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

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

  const updateSEO = <K extends keyof SEO>(field: K, value: SEO[K]) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        defaultSEO: {
          ...prev.defaultSEO,
          [field]: value
        }
      };
    });
  };

  const updateMultipleSEO = (updates: Partial<SEO>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        defaultSEO: {
          ...prev.defaultSEO,
          ...updates
        }
      };
    });
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
      setSuccess('Global SEO and search engine indexing settings updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="text-center py-20 text-on-surface-variant font-mono text-xs">Loading SEO configuration...</div>;
  }

  const seo = settings.defaultSEO || {
    title: '',
    description: '',
    canonical: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    robots: 'index,follow',
    noIndex: false
  };

  const isSiteWideNoIndex = Boolean(seo.noIndex || seo.robots?.includes('noindex'));
  const displayTitle = seo.title || settings.siteName || 'Website Title';
  const displayDesc =
    seo.description ||
    settings.tagline ||
    'Provide a meta description to tell search engine users what this website offers.';
  const displayUrl = settings.siteUrl ? settings.siteUrl.replace(/\/+$/, '') : 'https://example.com';

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-20">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Header with Settings Sub-Navigation Tabs */}
        <div className="border-b border-surface-container-high/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-serif text-on-surface tracking-tight flex items-center space-x-2">
                <Globe className="w-6 h-6 text-primary" />
                <span>Settings</span>
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Manage global search indexing directives, default meta tags, and social graph cards
              </p>
            </div>

            {can('settings.update') && (
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50 self-start"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving...' : 'Save SEO Settings'}</span>
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            <Link
              to="/settings"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 flex items-center space-x-1.5 transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>General Settings</span>
            </Link>

            <div className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-on-primary flex items-center space-x-1.5 shadow-sm">
              <Globe className="w-3.5 h-3.5" />
              <span>SEO & Indexing</span>
            </div>

            <Link
              to="/settings?tab=deployment"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 flex items-center space-x-1.5 transition"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Hosting & Deployment</span>
            </Link>

            <Link
              to="/settings?tab=features"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 flex items-center space-x-1.5 transition"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Feature Packs</span>
            </Link>

            <Link
              to="/settings?tab=tools"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 flex items-center space-x-1.5 transition"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>URL Tools</span>
            </Link>
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

        {/* 1. Global Search Engine Visibility / Indexing Directive */}
        <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-container-high/40 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider font-mono">
                Site-Wide Search Engine Visibility
              </h2>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                isSiteWideNoIndex
                  ? 'bg-amber-500/15 text-amber-800 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30'
              }`}
            >
              {isSiteWideNoIndex ? 'Site is No-Indexed' : 'Site is Search Indexed'}
            </span>
          </div>

          <label className="flex items-start space-x-3 p-4 bg-surface-container-low border border-surface-container-high/40 rounded-lg cursor-pointer hover:border-surface-container-high/50 transition">
            <input
              type="checkbox"
              checked={isSiteWideNoIndex}
              onChange={(e) => {
                const noIndexVal = e.target.checked;
                updateMultipleSEO({
                  noIndex: noIndexVal,
                  robots: noIndexVal ? 'noindex,nofollow' : 'index,follow'
                });
              }}
              className="mt-1 rounded border-surface-container-high/50 text-primary focus:ring-0 focus:ring-offset-0 bg-surface-container-lowest"
            />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-on-surface block text-sm">
                Discourage search engines from indexing this entire website
              </span>
              <p className="text-on-surface-variant leading-relaxed">
                Applies <code className="text-amber-800 font-mono text-[11px] font-semibold">noindex,nofollow</code> as the default across the entire site. Use this for development stages, staging portals, or internal private sites. (Individual pages can also override or be individually set to No-Index).
              </p>
            </div>
          </label>
        </div>

        {/* 2. Global Default Meta Tags */}
        <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-surface-container-high/40 pb-3">
            <Search className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider font-mono">
              Global Default Meta Tags
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider">
                  Default Meta Title
                </label>
                <span className="text-[11px] text-on-surface-variant font-mono">{seo.title.length}/60 chars</span>
              </div>
              <input
                type="text"
                value={seo.title}
                onChange={(e) => updateSEO('title', e.target.value)}
                placeholder={settings.siteName || 'Global Title Fallback'}
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                Used whenever an individual page does not have a customized meta title.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                Robots Meta Directive
              </label>
              <select
                value={seo.robots || 'index,follow'}
                onChange={(e) => {
                  const val = e.target.value;
                  updateMultipleSEO({
                    robots: val,
                    noIndex: val.includes('noindex')
                  });
                }}
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="index,follow">index, follow (Standard - Recommended for live sites)</option>
                <option value="noindex,follow">noindex, follow (Hide site, but follow internal links)</option>
                <option value="index,nofollow">index, nofollow (Index site, do not follow links)</option>
                <option value="noindex,nofollow">noindex, nofollow (Completely hidden from crawlers)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider">
                Default Meta Description
              </label>
              <span className="text-[11px] text-on-surface-variant font-mono">{seo.description.length}/160 chars</span>
            </div>
            <textarea
              rows={3}
              value={seo.description}
              onChange={(e) => updateSEO('description', e.target.value)}
              placeholder={settings.tagline || 'Concise description of the site for search snippets...'}
              className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg p-3 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
            <span className="text-[11px] text-on-surface-variant mt-1 block">
              Optimal length: 140-160 characters. Displayed beneath your title in Google search results.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Canonical Base URL
            </label>
            <input
              type="text"
              value={seo.canonical || settings.siteUrl}
              onChange={(e) => updateSEO('canonical', e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
            />
            <span className="text-[11px] text-on-surface-variant mt-1 block">
              Prevents duplicate content penalties by consolidating ranking signals to this origin.
            </span>
          </div>
        </div>

        {/* 3. Open Graph & Social Cards */}
        <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-surface-container-high/40 pb-3">
            <Share2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider font-mono">
              Open Graph & Social Graph Defaults
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                Default Social Title (og:title)
              </label>
              <input
                type="text"
                value={seo.ogTitle}
                onChange={(e) => updateSEO('ogTitle', e.target.value)}
                placeholder={displayTitle}
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                Default Social Image (og:image)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={seo.ogImage}
                  onChange={(e) => updateSEO('ogImage', e.target.value)}
                  placeholder="/media/og-banner.jpg"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="p-2 bg-surface-container hover:bg-surface-container-highest text-primary rounded-lg text-xs flex-shrink-0"
                  title="Choose from Media Library"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Default Social Description (og:description)
            </label>
            <textarea
              rows={2}
              value={seo.ogDescription}
              onChange={(e) => updateSEO('ogDescription', e.target.value)}
              placeholder={displayDesc}
              className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* 4. Live SERP & Social Previews */}
        <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-container-high/40 pb-3">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider font-mono">
                Live Search Engine & Social Previews
              </h2>
            </div>
            <div className="flex items-center space-x-1 bg-surface-container-low p-1 rounded-lg border border-surface-container-high/40">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  previewDevice === 'desktop' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  previewDevice === 'mobile' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Mobile
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Google SERP Snippet Preview */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Google Search Result Preview
              </span>
              <div
                className={`p-4 bg-surface-container-low border border-surface-container-high/40 rounded-xl space-y-1 ${
                  previewDevice === 'mobile' ? 'max-w-sm' : ''
                }`}
              >
                <div className="flex items-center space-x-2 text-xs text-on-surface-variant">
                  <div className="w-4 h-4 rounded-full bg-surface-container flex items-center justify-center text-[10px] text-primary font-bold">
                    G
                  </div>
                  <div className="truncate">
                    <span className="text-on-surface">{displayUrl}</span>
                  </div>
                </div>
                <div className="text-blue-700 hover:underline font-semibold text-base cursor-pointer truncate">
                  {displayTitle} | {settings.siteName}
                </div>
                <p className="text-xs text-on-surface line-clamp-2 leading-relaxed">{displayDesc}</p>
                {isSiteWideNoIndex && (
                  <div className="mt-2 text-[10px] text-amber-800 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block font-mono font-semibold">
                    ⚠️ Page will have noindex header
                  </div>
                )}
              </div>
            </div>

            {/* Social Sharing Card Preview */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Social Link Card Preview (Twitter / LinkedIn / Facebook)
              </span>
              <div className="bg-surface-container-low border border-surface-container-high/40 rounded-xl overflow-hidden max-w-md">
                {seo.ogImage ? (
                  <div className="aspect-[1.91/1] w-full bg-surface-container-lowest border-b border-surface-container-high/40 overflow-hidden">
                    <img
                      src={seo.ogImage.startsWith('http') ? seo.ogImage : `${displayUrl}${seo.ogImage}`}
                      alt="Social Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-[1.91/1] w-full bg-surface-container-lowest border-b border-surface-container-high/40 flex items-center justify-center text-on-surface-variant text-xs">
                    No social image selected (Recommended: 1200x630px)
                  </div>
                )}
                <div className="p-3.5 space-y-1">
                  <div className="text-[11px] text-on-surface-variant uppercase font-mono truncate">{displayUrl}</div>
                  <div className="text-sm font-bold text-on-surface truncate">{seo.ogTitle || displayTitle}</div>
                  <p className="text-xs text-on-surface line-clamp-2 leading-relaxed">
                    {seo.ogDescription || displayDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Sitemap & Robots Files Link Card */}
        <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-surface-container-high/40 pb-3">
            <FileCode2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider font-mono">
              Crawlers & Sitemap Files
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-surface-container-low border border-surface-container-high/40 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-on-surface block">XML Sitemap</span>
                <span className="text-[11px] text-on-surface-variant block font-mono">/sitemap.xml</span>
              </div>
              <a
                href={`${displayUrl}/sitemap.xml`}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-on-surface-variant hover:text-primary bg-surface-container-lowest hover:bg-surface-container rounded-lg transition"
                title="View Sitemap"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="p-4 bg-surface-container-low border border-surface-container-high/40 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-on-surface block">Robots Directives</span>
                <span className="text-[11px] text-on-surface-variant block font-mono">/robots.txt</span>
              </div>
              <a
                href={`${displayUrl}/robots.txt`}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-on-surface-variant hover:text-primary bg-surface-container-lowest hover:bg-surface-container rounded-lg transition"
                title="View Robots.txt"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </form>

      {/* Media Picker for Social Share Banner */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          updateSEO('ogImage', url);
          setIsMediaPickerOpen(false);
        }}
      />
    </div>
  );
};

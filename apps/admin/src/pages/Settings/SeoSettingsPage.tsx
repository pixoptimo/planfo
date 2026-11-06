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
    return <div className="text-center py-20 text-slate-500 font-mono text-xs">Loading SEO configuration...</div>;
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
    <div className="space-y-6 w-full pb-20">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Header with Settings Sub-Navigation Tabs */}
        <div className="border-b border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
                <Globe className="w-6 h-6 text-brand-400" />
                <span>Settings</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Manage global search indexing directives, default meta tags, and social graph cards
              </p>
            </div>

            {can('settings.update') && (
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-lg shadow-brand-500/20 transition disabled:opacity-50 self-start"
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
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 flex items-center space-x-1.5 transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>General Settings</span>
            </Link>

            <div className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-slate-950 flex items-center space-x-1.5 shadow-sm">
              <Globe className="w-3.5 h-3.5" />
              <span>SEO & Indexing</span>
            </div>

            <Link
              to="/settings?tab=deployment"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 flex items-center space-x-1.5 transition"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Hosting & Deployment</span>
            </Link>

            <Link
              to="/settings?tab=features"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 flex items-center space-x-1.5 transition"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Feature Packs</span>
            </Link>

            <Link
              to="/settings?tab=tools"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 flex items-center space-x-1.5 transition"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>URL Tools</span>
            </Link>
          </div>
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

        {/* 1. Global Search Engine Visibility / Indexing Directive */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Site-Wide Search Engine Visibility
              </h2>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                isSiteWideNoIndex
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isSiteWideNoIndex ? 'Site is No-Indexed' : 'Site is Search Indexed'}
            </span>
          </div>

          <label className="flex items-start space-x-3 p-4 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition">
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
              className="mt-1 rounded border-slate-700 text-brand-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
            />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-white block text-sm">
                Discourage search engines from indexing this entire website
              </span>
              <p className="text-slate-400 leading-relaxed">
                Applies <code className="text-amber-400 font-mono text-[11px]">noindex,nofollow</code> as the default across the entire site. Use this for development stages, staging portals, or internal private sites. (Individual pages can also override or be individually set to No-Index).
              </p>
            </div>
          </label>
        </div>

        {/* 2. Global Default Meta Tags */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Search className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Global Default Meta Tags
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Default Meta Title
                </label>
                <span className="text-[11px] text-slate-500 font-mono">{seo.title.length}/60 chars</span>
              </div>
              <input
                type="text"
                value={seo.title}
                onChange={(e) => updateSEO('title', e.target.value)}
                placeholder={settings.siteName || 'Global Title Fallback'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Used whenever an individual page does not have a customized meta title.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Default Meta Description
              </label>
              <span className="text-[11px] text-slate-500 font-mono">{seo.description.length}/160 chars</span>
            </div>
            <textarea
              rows={3}
              value={seo.description}
              onChange={(e) => updateSEO('description', e.target.value)}
              placeholder={settings.tagline || 'Concise description of the site for search snippets...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-brand-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Optimal length: 140-160 characters. Displayed beneath your title in Google search results.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Canonical Base URL
            </label>
            <input
              type="text"
              value={seo.canonical || settings.siteUrl}
              onChange={(e) => updateSEO('canonical', e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-brand-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Prevents duplicate content penalties by consolidating ranking signals to this origin.
            </span>
          </div>
        </div>

        {/* 3. Open Graph & Social Cards */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Share2 className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Open Graph & Social Graph Defaults
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Default Social Title (og:title)
              </label>
              <input
                type="text"
                value={seo.ogTitle}
                onChange={(e) => updateSEO('ogTitle', e.target.value)}
                placeholder={displayTitle}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Default Social Image (og:image)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={seo.ogImage}
                  onChange={(e) => updateSEO('ogImage', e.target.value)}
                  placeholder="/media/og-banner.jpg"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs flex-shrink-0"
                  title="Choose from Media Library"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Default Social Description (og:description)
            </label>
            <textarea
              rows={2}
              value={seo.ogDescription}
              onChange={(e) => updateSEO('ogDescription', e.target.value)}
              placeholder={displayDesc}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* 4. Live SERP & Social Previews */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-brand-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Live Search Engine & Social Previews
              </h2>
            </div>
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  previewDevice === 'desktop' ? 'bg-brand-600 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  previewDevice === 'mobile' ? 'bg-brand-600 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mobile
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Google SERP Snippet Preview */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Google Search Result Preview
              </span>
              <div
                className={`p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1 ${
                  previewDevice === 'mobile' ? 'max-w-sm' : ''
                }`}
              >
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-brand-400 font-bold">
                    G
                  </div>
                  <div className="truncate">
                    <span className="text-slate-200">{displayUrl}</span>
                  </div>
                </div>
                <div className="text-blue-400 hover:underline font-medium text-base cursor-pointer truncate">
                  {displayTitle} | {settings.siteName}
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{displayDesc}</p>
                {isSiteWideNoIndex && (
                  <div className="mt-2 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block font-mono">
                    ⚠️ Page will have noindex header
                  </div>
                )}
              </div>
            </div>

            {/* Social Sharing Card Preview */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Social Link Card Preview (Twitter / LinkedIn / Facebook)
              </span>
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-w-md">
                {seo.ogImage ? (
                  <div className="aspect-[1.91/1] w-full bg-slate-900 border-b border-slate-800 overflow-hidden">
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
                  <div className="aspect-[1.91/1] w-full bg-slate-900 border-b border-slate-800 flex items-center justify-center text-slate-500 text-xs">
                    No social image selected (Recommended: 1200x630px)
                  </div>
                )}
                <div className="p-3.5 space-y-1">
                  <div className="text-[11px] text-slate-400 uppercase font-mono truncate">{displayUrl}</div>
                  <div className="text-sm font-bold text-white truncate">{seo.ogTitle || displayTitle}</div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {seo.ogDescription || displayDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Sitemap & Robots Files Link Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <FileCode2 className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Crawlers & Sitemap Files
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">XML Sitemap</span>
                <span className="text-[11px] text-slate-400 block font-mono">/sitemap.xml</span>
              </div>
              <a
                href={`${displayUrl}/sitemap.xml`}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
                title="View Sitemap"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Robots Directives</span>
                <span className="text-[11px] text-slate-400 block font-mono">/robots.txt</span>
              </div>
              <a
                href={`${displayUrl}/robots.txt`}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
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

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Globe, Image as ImageIcon } from 'lucide-react';
import type { SEO } from '@cms/schemas';
import { MediaPickerModal } from '../Media/MediaPickerModal.js';

interface SEOFieldsProps {
  seo: SEO;
  onChange: (seo: SEO) => void;
  defaultTitle?: string;
  defaultDescription?: string;
}

export const SEOFields: React.FC<SEOFieldsProps> = ({
  seo,
  onChange,
  defaultTitle = '',
  defaultDescription = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  const displayTitle = seo.title || defaultTitle || 'Page Title';
  const displayDesc = seo.description || defaultDescription || 'No meta description provided. Search engines will extract a snippet from the page body.';

  const updateField = <K extends keyof SEO>(field: K, value: SEO[K]) => {
    onChange({
      ...seo,
      [field]: value
    });
  };

  return (
    <div className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
      >
        <div className="flex items-center space-x-3">
          <Globe className="w-5 h-5 text-brand-400" />
          <div>
            <h3 className="font-semibold text-white text-sm">Search Engine Optimization (SEO) & Social Graph</h3>
            <p className="text-xs text-slate-400">Meta tags, Open Graph previews, canonical URLs, and crawler directives</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-5 border-t border-slate-800 space-y-5">
          {/* SERP Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Google Search Result Preview
            </label>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="text-xs text-slate-400 flex items-center space-x-1.5 mb-1">
                <span>https://example.com</span>
                <span>›</span>
                <span>{seo.canonical ? seo.canonical.replace(/^https?:\/\/[^/]+/, '') : 'page'}</span>
              </div>
              <div className="text-base text-blue-400 font-medium hover:underline cursor-pointer truncate">
                {displayTitle}
              </div>
              <div className="text-xs text-slate-300 mt-1 line-clamp-2">
                {displayDesc}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                SEO Title (Meta Title)
              </label>
              <input
                type="text"
                value={seo.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder={defaultTitle || 'Custom SEO Title'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Recommended length: 50-60 characters</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Canonical URL
              </label>
              <input
                type="text"
                value={seo.canonical}
                onChange={(e) => updateField('canonical', e.target.value)}
                placeholder="https://example.com/canonical-url"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Meta Description
            </label>
            <textarea
              rows={2}
              value={seo.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder={defaultDescription || 'Summary of the page content for search engines...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Recommended length: 140-160 characters ({seo.description.length} chars)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Open Graph Title (Social)
              </label>
              <input
                type="text"
                value={seo.ogTitle}
                onChange={(e) => updateField('ogTitle', e.target.value)}
                placeholder="Title for Facebook / Twitter / LinkedIn"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Open Graph Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={seo.ogImage}
                  onChange={(e) => updateField('ogImage', e.target.value)}
                  placeholder="/media/og-banner.jpg"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setIsMediaOpen(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Open Graph Description
              </label>
              <input
                type="text"
                value={seo.ogDescription}
                onChange={(e) => updateField('ogDescription', e.target.value)}
                placeholder="Description for social link cards"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Robots Meta Directive
              </label>
              <select
                value={seo.robots}
                onChange={(e) => updateField('robots', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value="index,follow">index, follow (Default - Recommended)</option>
                <option value="noindex,follow">noindex, follow</option>
                <option value="index,nofollow">index, nofollow</option>
                <option value="noindex,nofollow">noindex, nofollow (Hidden)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <MediaPickerModal
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        onSelect={(url) => updateField('ogImage', url)}
      />
    </div>
  );
};

import React, { useState } from 'react';
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
  const displayDesc =
    seo.description ||
    defaultDescription ||
    'No meta description provided. Search engines will extract a snippet from the page body.';

  const updateField = <K extends keyof SEO>(field: K, value: SEO[K]) => {
    onChange({
      ...seo,
      [field]: value
    });
  };

  return (
    <div className="border border-surface-container-high/40 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm font-body-md text-on-surface antialiased">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-container-low/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shadow-2xs">
            <span className="material-symbols-outlined text-[18px]">travel_explore</span>
          </div>
          <div>
            <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">
              Search Engine Optimization (SEO) & Social Graph
            </h3>
            <p className="font-body-sm text-[11px] text-on-surface-variant">
              Meta tags, Open Graph previews, canonical URLs, and crawler directives
            </p>
          </div>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-surface-container-high/40 space-y-5 bg-surface-container-lowest">
          {/* SERP Preview */}
          <div>
            <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
              Google Search Result Snippet Preview
            </label>
            <div className="p-4 bg-surface-container-low border border-surface-container-high/40 rounded-xl space-y-1">
              <div className="text-xs text-on-surface-variant flex items-center gap-1.5 font-mono">
                <span>https://example.com</span>
                <span>›</span>
                <span className="text-primary font-semibold">
                  {seo.canonical ? seo.canonical.replace(/^https?:\/\/[^/]+/, '') : 'page'}
                </span>
              </div>
              <div className="text-base text-primary font-serif font-semibold hover:underline cursor-pointer truncate">
                {displayTitle}
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                {displayDesc}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                SEO Title (Meta Title)
              </label>
              <input
                type="text"
                value={seo.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder={defaultTitle || 'Custom SEO Title'}
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="font-body-sm text-[11px] text-on-surface-variant mt-1 block">
                Recommended length: 50-60 characters ({seo.title.length} chars)
              </span>
            </div>

            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Canonical URL
              </label>
              <input
                type="text"
                value={seo.canonical}
                onChange={(e) => updateField('canonical', e.target.value)}
                placeholder="https://example.com/canonical-url"
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-code text-code text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Meta Description
            </label>
            <textarea
              rows={2}
              value={seo.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder={defaultDescription || 'Summary of the page content for search engines...'}
              className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <span className="font-body-sm text-[11px] text-on-surface-variant mt-1 block">
              Recommended length: 140-160 characters ({seo.description.length} chars)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Open Graph Title (Social)
              </label>
              <input
                type="text"
                value={seo.ogTitle}
                onChange={(e) => updateField('ogTitle', e.target.value)}
                placeholder="Title for Facebook / Twitter / LinkedIn"
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Open Graph Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={seo.ogImage}
                  onChange={(e) => updateField('ogImage', e.target.value)}
                  placeholder="/media/og-banner.jpg"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-code text-code text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setIsMediaOpen(true)}
                  className="px-3 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">image</span>
                  <span>Select</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Open Graph Description
              </label>
              <input
                type="text"
                value={seo.ogDescription}
                onChange={(e) => updateField('ogDescription', e.target.value)}
                placeholder="Description for social link cards"
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Robots Meta Directive
              </label>
              <select
                value={seo.robots}
                onChange={(e) => updateField('robots', e.target.value)}
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
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

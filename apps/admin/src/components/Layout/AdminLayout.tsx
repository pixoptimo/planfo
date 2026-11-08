import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { SidebarRail } from './SidebarRail.js';
import { ProfileDropdown } from '../UI/ProfileDropdown.js';
import type { PublishResult } from '@cms/types';

export const AdminLayout: React.FC = () => {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If in the post editor, page editor, product editor, or blueprints studio/entry editor route, let the studio handle its custom stage
  const isPostEditor = location.pathname.startsWith('/posts/') && location.pathname !== '/posts';
  const isPageEditor = location.pathname.startsWith('/pages/') && location.pathname !== '/pages';
  const isProductEditor = location.pathname.startsWith('/products/') && location.pathname !== '/products';
  const isBlueprintStudio =
    location.pathname === '/blueprints/studio' ||
    location.pathname === '/blueprints' ||
    location.pathname === '/blueprints/new' ||
    location.pathname.startsWith('/blueprints/edit');
  const isBlueprintEntryEditor =
    location.pathname.startsWith('/blueprints/') &&
    !isBlueprintStudio &&
    (location.pathname.endsWith('/new') || location.pathname.split('/').filter(Boolean).length === 3);

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [liveSiteUrl, setLiveSiteUrl] = useState('http://localhost:3000');
  const [sitePort, setSitePort] = useState<number | null>(null);

  useEffect(() => {
    api.get<{ siteUrl: string; sitePort: number }>('/api/system/info')
      .then((data) => {
        if (data?.siteUrl) setLiveSiteUrl(data.siteUrl);
        if (data?.sitePort) setSitePort(data.sitePort);
      })
      .catch(() => {});
  }, []);

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishError(null);
    setShowPublishModal(true);
    try {
      const res = await api.post<PublishResult>('/api/publish');
      setPublishResult(res);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // If in Post Editor, Page Editor, Product Editor, or Blueprints Studio/Entry Editor, render the outlet directly
  if (isPostEditor || isPageEditor || isProductEditor || isBlueprintStudio || isBlueprintEntryEditor) {
    return (
      <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden font-body-md antialiased relative">
      {/* Sleek Global 64px Icon Rail Navigation */}
      <SidebarRail />

      {/* Main Content Stage */}
      <div className="pl-16 flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-high/60 flex items-center justify-between px-6 z-40 shrink-0 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant shrink-0">
              <span className="hover:text-on-surface cursor-pointer hidden sm:inline">Planfo Studio</span>
              <span className="material-symbols-outlined text-[16px] hidden sm:inline text-outline-variant">chevron_right</span>
              <span className="text-on-surface font-semibold capitalize truncate max-w-[150px] sm:max-w-none">
                {location.pathname.replace(/^\//, '').split('/')[0] || 'Overview'}
              </span>
            </div>
            <div className="h-4 w-px bg-surface-container-high/60 hidden sm:block" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container font-label-xs text-label-xs text-primary font-semibold shrink-0 hidden sm:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              v2.4 Live Tokens
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3">
            {/* Visit Live Website */}
            <a
              href={liveSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface hover:text-primary font-label-md text-label-md shadow-xs transition-all flex items-center gap-1.5 border border-surface-container-high/40"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Preview</span>
            </a>

            {/* Publish Changes Button */}
            {can('publish.all') && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-xs hover:bg-primary-container transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[16px]">publish</span>
                )}
                <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
              </button>
            )}

            {/* User Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </header>

        {/* View Body Container with 24px side padding on both sides */}
        <main className="flex-1 overflow-y-auto px-6 py-6 bg-surface">
          <Outlet />
        </main>
      </div>

      {/* Publishing Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              {isPublishing ? (
                <div className="p-3 rounded-full bg-primary-container text-on-primary-container">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : publishResult?.success ? (
                <div className="p-3 rounded-full bg-surface-container-highest text-primary">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-3 rounded-full bg-error-container text-error">
                  <AlertCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {isPublishing
                    ? 'Building Static Website...'
                    : publishResult?.success
                    ? 'Published Successfully!'
                    : 'Publish Failed'}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {isPublishing
                    ? 'Compiling content, templates, sitemap & assets'
                    : 'Static output generated and verified in generated/.'}
                </p>
              </div>
            </div>

            {publishResult?.success && (
              <div className="p-4 bg-surface-container-low rounded-xl space-y-2 font-code text-code text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="text-on-surface font-semibold">{publishResult.durationMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Pages:</span>
                  <span className="text-on-surface font-semibold">{publishResult.stats.pagesGenerated}</span>
                </div>
                <div className="flex justify-between">
                  <span>Posts:</span>
                  <span className="text-on-surface font-semibold">{publishResult.stats.postsGenerated}</span>
                </div>
                <div className="flex justify-between">
                  <span>Products/Catalog:</span>
                  <span className="text-on-surface font-semibold">{publishResult.stats.productsGenerated}</span>
                </div>
                <div className="flex justify-between text-primary font-semibold">
                  <span>Sitemap & Robots:</span>
                  <span>Generated (XML & TXT)</span>
                </div>
              </div>
            )}

            {publishError && (
              <div className="p-3 bg-error-container/40 rounded-xl text-error font-body-sm text-body-sm">
                {publishError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              {!isPublishing && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPublishModal(false)}
                    className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold"
                  >
                    Close
                  </button>
                  {publishResult?.success && (
                    <a
                      href={liveSiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md font-semibold flex items-center gap-1.5 shadow-sm hover:bg-primary transition-all"
                    >
                      <span>Visit Live Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

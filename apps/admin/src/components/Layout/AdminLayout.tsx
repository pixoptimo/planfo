import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  ShoppingBag,
  FolderTree,
  Image as ImageIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Users,
  History,
  Archive,
  LogOut,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Sparkles,
  Palette,
  Boxes,
  Package,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { getBlueprintIcon } from '../../utils/blueprintIcons.js';
import type { PublishResult } from '@cms/types';

export const AdminLayout: React.FC = () => {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [liveSiteUrl, setLiveSiteUrl] = useState('http://localhost:3000');
  const [sitePort, setSitePort] = useState<number | null>(null);
  const [isCatalogEnabled, setIsCatalogEnabled] = useState(false);
  const [customBlueprints, setCustomBlueprints] = useState<
    Array<{ id: string; name: string; slug: string; icon: string; entryCount?: number }>
  >([]);

  const loadCustomBlueprints = () => {
    api.get<Array<{ id: string; name: string; slug: string; icon: string; isBuiltIn?: boolean; entryCount?: number }>>('/api/blueprints')
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomBlueprints(data.filter((b) => !b.isBuiltIn));
        }
      })
      .catch(() => {});
  };

  React.useEffect(() => {
    api.get<{ siteUrl: string; sitePort: number }>('/api/system/info')
      .then((data) => {
        if (data?.siteUrl) {
          setLiveSiteUrl(data.siteUrl);
        }
        if (data?.sitePort) {
          setSitePort(data.sitePort);
        }
      })
      .catch(() => {});

    api.get<{ featurePacks?: { catalog?: boolean } }>('/api/settings')
      .then((data) => {
        if (data?.featurePacks?.catalog) {
          setIsCatalogEnabled(true);
        }
      })
      .catch(() => {});

    loadCustomBlueprints();

    window.addEventListener('blueprints-updated', loadCustomBlueprints);
    return () => {
      window.removeEventListener('blueprints-updated', loadCustomBlueprints);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishError(null);
    setPublishResult(null);
    setShowPublishModal(true);

    try {
      const result = await api.post<PublishResult>('/api/publish');
      setPublishResult(result);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setIsPublishing(false);
    }
  };

interface NavItem {
  section?: string;
  to?: string;
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  show?: boolean;
  badge?: string;
}

  const navItems: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/pages', label: 'Pages', icon: FileText, show: can('pages.read') },
    { to: '/media', label: 'Media', icon: ImageIcon, show: can('media.read') },
    { to: '/themes', label: 'Theme', icon: Palette, show: can('settings.read') },
    { to: '/settings', label: 'Settings', icon: SettingsIcon, show: can('settings.read') }
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Brand header */}
          <div className="h-16 px-6 border-b border-slate-800 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-md">
              P
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight block leading-tight">Planfo CMS</span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-wide uppercase font-semibold">Beta v0.1 &bull; Static</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              if (item.show === false) return null;
              const Icon = item.icon!;
              return (
                <NavLink
                  key={item.to}
                  to={item.to!}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                </NavLink>
              );
            })}

            {/* Planfo Beta Divider & Quick Actions */}
            <div className="pt-4 pb-2">
              <div className="border-t border-slate-800/80 my-2"></div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Actions
              </div>
              <div className="space-y-1.5 mt-2">
                <a
                  href="/api/preview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-800 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-brand-400" />
                  <span>Preview</span>
                </a>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-800 transition disabled:opacity-50"
                >
                  {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>Build</span>
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 shadow-md transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish</span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-brand-400 uppercase">
                {user?.name?.[0] || user?.email?.[0] || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.name || user?.email}</p>
                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 px-8 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-slate-400 font-mono">
              Static Generator: Ready {sitePort ? `(:${sitePort})` : ''}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href={liveSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
              title={`Visit Live Website (${liveSiteUrl})`}
            >
              <span>Visit Live Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {can('publish.all') && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition duration-150 transform active:scale-95 disabled:opacity-50"
              >
                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isPublishing ? 'Publishing...' : 'Publish Static Site'}</span>
              </button>
            )}
          </div>
        </header>

        {/* View body */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>

      {/* Publishing Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              {isPublishing ? (
                <div className="p-3 rounded-full bg-brand-500/10 text-brand-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : publishResult?.success ? (
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-3 rounded-full bg-red-500/10 text-red-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-white">
                  {isPublishing ? 'Building Static Website...' : publishResult?.success ? 'Published Successfully!' : 'Publish Failed'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isPublishing ? 'Compiling content, templates, sitemap & assets' : 'Static output generated and verified.'}
                </p>
              </div>
            </div>

            {publishResult?.success && (
              <div className="my-4 p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Duration:</span>
                  <span className="font-mono text-slate-200">{publishResult.durationMs} ms</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Pages Generated:</span>
                  <span className="font-mono text-slate-200">{publishResult.stats.pagesGenerated}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Posts Generated:</span>
                  <span className="font-mono text-slate-200">{publishResult.stats.postsGenerated}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Products Generated:</span>
                  <span className="font-mono text-slate-200">{publishResult.stats.productsGenerated}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sitemap & Robots:</span>
                  <span className="font-mono text-emerald-400">Generated (XML & TXT)</span>
                </div>
                {publishResult.deployment && (
                  <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
                    <span>Target Deployment:</span>
                    <span className="font-mono text-brand-400 font-semibold uppercase">
                      {publishResult.deployment.target === 'github-pages' ? 'GitHub Pages' : publishResult.deployment.target}
                    </span>
                  </div>
                )}
                {publishResult.deployment?.branch && (
                  <div className="flex justify-between text-slate-400">
                    <span>Release Branch:</span>
                    <span className="font-mono text-slate-200">{publishResult.deployment.branch}</span>
                  </div>
                )}
              </div>
            )}

            {publishError && (
              <div className="my-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                {publishError}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              {!isPublishing && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPublishModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Close
                  </button>
                  {publishResult?.success && (
                    <a
                      href={liveSiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition"
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

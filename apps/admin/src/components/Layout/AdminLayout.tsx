import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
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
  Palette,
  Boxes,
  Trash2,
  Eye,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { getBlueprintIcon } from '../../utils/blueprintIcons.js';
import type { PublishResult } from '@cms/types';

export const AdminLayout: React.FC = () => {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If in the post editor route (/posts/:slug), let the post editor handle its custom three-panel stage
  const isPostEditor = location.pathname.startsWith('/posts/') && location.pathname !== '/posts';

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [liveSiteUrl, setLiveSiteUrl] = useState('http://localhost:3000');
  const [sitePort, setSitePort] = useState<number | null>(null);
  const [projectName, setProjectName] = useState('My Website');
  const [customBlueprints, setCustomBlueprints] = useState<
    Array<{ id: string; name: string; slug: string; icon: string; entryCount?: number }>
  >([]);
  const [trashCount, setTrashCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const loadSettings = () => {
    api.get<{ siteName?: string; description?: string }>('/api/settings')
      .then((data) => {
        if (data?.siteName) {
          setProjectName(data.siteName);
        }
      })
      .catch(() => {});
  };

  const loadCustomBlueprints = () => {
    api.get<Array<{ id: string; name: string; slug: string; icon: string; isBuiltIn?: boolean; entryCount?: number }>>('/api/blueprints')
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomBlueprints(data.filter((b) => !b.isBuiltIn));
        }
      })
      .catch(() => {});
  };

  const loadTrashCount = () => {
    api.get<{ count: number }>('/api/trash/count')
      .then((res) => {
        if (typeof res?.count === 'number') {
          setTrashCount(res.count);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    api.get<{ siteUrl: string; sitePort: number }>('/api/system/info')
      .then((data) => {
        if (data?.siteUrl) setLiveSiteUrl(data.siteUrl);
        if (data?.sitePort) setSitePort(data.sitePort);
      })
      .catch(() => {});

    loadSettings();
    loadCustomBlueprints();
    loadTrashCount();

    window.addEventListener('settings-updated', loadSettings);
    window.addEventListener('blueprint-updated', loadCustomBlueprints);
    return () => {
      window.removeEventListener('settings-updated', loadSettings);
      window.removeEventListener('blueprint-updated', loadCustomBlueprints);
    };
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

  // If in Post Editor, render the outlet directly so it has full control over the 3-panel editorial stage
  if (isPostEditor) {
    return (
      <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
        <Outlet />
      </div>
    );
  }

  const navItems = [
    { section: 'Studio Workspace' },
    { to: '/', label: 'Overview', icon: 'grid_view', LucideIcon: LayoutDashboard, exact: true, show: true },
    { to: '/components-and-tokens', label: 'Components & Tokens', icon: 'widgets', LucideIcon: Boxes, show: true },
    { to: '/posts', label: 'Articles Library', icon: 'menu_book', LucideIcon: BookOpen, show: can('posts.read') },
    { to: '/pages', label: 'Pages', icon: 'article', LucideIcon: FileText, show: can('pages.read') },
    { to: '/blueprints/templates', label: 'Templates & Catalog', icon: 'dashboard_customize', LucideIcon: Boxes, show: true },

    ...customBlueprints.map((bp) => ({
      section: undefined,
      exact: false,
      to: `/blueprints/${bp.slug}`,
      label: bp.name,
      icon: 'category',
      LucideIcon: getBlueprintIcon(bp.icon),
      show: true,
      badge: bp.entryCount !== undefined ? String(bp.entryCount) : undefined
    })),

    { section: 'System Blueprints' },
    { to: '/blueprints/studio', label: 'Blueprints Studio', icon: 'widgets', LucideIcon: Boxes, show: can('blueprints.read') },
    { to: '/categories', label: 'Taxonomy & Tags', icon: 'folder_open', LucideIcon: FolderTree, show: can('categories.read') },
    { to: '/media', label: 'Media Library', icon: 'image', LucideIcon: ImageIcon, show: can('media.read') },
    { to: '/navigation', label: 'Navigation', icon: 'menu', LucideIcon: MenuIcon, show: can('menus.read') },
    { to: '/themes', label: 'Themes', icon: 'palette', LucideIcon: Palette, show: can('settings.read') },

    { section: 'Configuration' },
    { to: '/settings', label: 'Settings', icon: 'tune', LucideIcon: SettingsIcon, show: can('settings.read') },
    { to: '/users', label: 'Users & Roles', icon: 'person', LucideIcon: Users, show: can('users.read') },
    { to: '/revisions', label: 'Revisions', icon: 'history_edu', LucideIcon: History, show: can('revisions.read') },
    { to: '/backups', label: 'Backups', icon: 'archive', LucideIcon: Archive, show: can('backups.read') },
    { to: '/trash', label: 'Trash', icon: 'delete', LucideIcon: Trash2, show: true, badge: trashCount > 0 ? String(trashCount) : undefined }
  ];

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden font-body-md antialiased">
      {/* Editorial Studio Sidebar */}
      <aside className="w-72 bg-surface-container-low border-r border-outline-variant/30 flex flex-col justify-between py-6 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-30 shrink-0">
        <div className="flex flex-col gap-5 overflow-hidden">
          {/* Studio Brand Header */}
          <Link to="/" className="flex items-center gap-3 px-3 group">
            <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-on-primary-container text-[20px]">auto_stories</span>
            </div>
            <div className="min-w-0">
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight block leading-tight truncate">
                Editorial
              </span>
              <span className="font-label-xs text-label-xs text-primary font-bold uppercase tracking-wider block">
                {projectName || 'Studio Design'}
              </span>
            </div>
          </Link>

          {/* Categorized Navigation */}
          <nav className="flex flex-col gap-1 overflow-y-auto px-1 pr-1 max-h-[calc(100vh-220px)]">
            {navItems.map((item, idx) => {
              if (item.section) {
                return (
                  <span
                    key={idx}
                    className="font-label-xs text-label-xs text-on-surface-variant font-semibold uppercase tracking-wider block px-3 pt-3 pb-1"
                  >
                    {item.section}
                  </span>
                );
              }

              if (item.show === false) return null;

              return (
                <NavLink
                  key={item.to}
                  to={item.to!}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg font-label-md text-label-md transition-all ${
                      isActive
                        ? 'bg-surface-container-highest text-primary font-semibold shadow-xs'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`
                  }
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="font-label-xs text-label-xs px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Studio System Status & User Profile */}
        <div className="px-2 flex flex-col gap-3 pt-3 border-t border-outline-variant/20">
          <div className="p-2.5 rounded-lg bg-surface-container-lowest flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-label-xs text-label-xs text-on-surface-variant font-medium">Design Sync</span>
            </div>
            <span className="font-label-xs text-label-xs text-primary font-bold">v2.4</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-xs shrink-0 shadow-sm">
                {user?.name?.[0]?.toUpperCase() || 'E'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate leading-tight">
                  {user?.name || 'Lead Architect'}
                </span>
                <span className="font-label-xs text-label-xs text-on-surface-variant truncate">
                  {user?.email || 'system@editorial.studio'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Stage */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex items-center justify-between px-8 z-20 shrink-0">
          {/* Breadcrumbs & Status */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant shrink-0">
              <span className="hover:text-on-surface cursor-pointer">Editorial Studio</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-on-surface font-semibold capitalize">
                {location.pathname.replace(/^\//, '').split('/')[0] || 'Overview'}
              </span>
            </div>
            <div className="h-4 w-px bg-outline-variant hidden sm:block" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container font-label-xs text-label-xs text-primary font-semibold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              v2.4 Live Tokens
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-4">
            {/* Quick Post Creator Trigger */}
            <Link
              to="/posts/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md font-semibold transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Post</span>
            </Link>

            {/* Visit Live Website */}
            <a
              href={liveSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:text-primary font-label-md text-label-md shadow-sm transition-all flex items-center gap-1.5"
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
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[16px]">publish</span>
                )}
                <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
              </button>
            )}

            {/* User Profile Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm text-on-primary font-semibold text-label-xs">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* View Body Container */}
        <main className="flex-1 overflow-y-auto p-8 bg-surface">
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

import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { PlanfoLogo } from '../UI/PlanfoLogo.js';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { useSidebar } from '../../context/SidebarContext.js';

export const BLUEPRINT_MATERIAL_MAP: Record<string, string> = {
  FileText: 'description',
  BookOpen: 'menu_book',
  Star: 'star',
  Users: 'groups',
  Briefcase: 'business_center',
  Calendar: 'event',
  Award: 'military_tech',
  HelpCircle: 'help',
  Heart: 'favorite',
  Layers: 'layers',
  Globe: 'public',
  MessageSquare: 'forum',
  Folder: 'folder',
  Package: 'inventory_2',
  Bookmark: 'bookmark',
  Sparkles: 'auto_awesome',
  Tag: 'label',
  Compass: 'explore',
  Code: 'code',
  ShieldCheck: 'verified_user',
  ShoppingBag: 'shopping_bag',
  Store: 'storefront',
  Zap: 'bolt',
  Activity: 'monitoring',
  Grid: 'grid_view'
};

export function getBlueprintMaterialIcon(iconName?: string): string {
  if (!iconName) return 'category';
  if (BLUEPRINT_MATERIAL_MAP[iconName]) {
    return BLUEPRINT_MATERIAL_MAP[iconName];
  }
  if (/^[a-z0-9_]+$/.test(iconName)) {
    return iconName;
  }
  return 'category';
}

interface CustomBlueprintNav {
  id: string;
  name: string;
  slug: string;
  icon: string;
  entryCount?: number;
}

interface NavEntry {
  to: string;
  label: string;
  icon: string;
  exact?: boolean;
  show?: boolean;
  badge?: number | string;
  badgeColor?: 'primary' | 'rose';
  isActiveCheck?: (pathname: string) => boolean;
}

interface NavSection {
  title: string;
  items: NavEntry[];
}

export const SidebarRail: React.FC = () => {
  const { can } = useAuth();
  const location = useLocation();
  const { isCollapsed, toggleSidebar, sidebarWidthClass } = useSidebar();
  const [customBlueprints, setCustomBlueprints] = useState<CustomBlueprintNav[]>([]);
  const [trashCount, setTrashCount] = useState<number>(0);
  const [siteName, setSiteName] = useState<string>('My Website');

  const loadData = () => {
    // 1. Load Custom Blueprints
    api.get<Array<{ id: string; name: string; slug: string; icon: string; isBuiltIn?: boolean; entryCount?: number }>>('/api/blueprints')
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomBlueprints(data.filter((b) => !b.isBuiltIn));
        }
      })
      .catch(() => {});

    // 2. Load Trash Count
    api.get<{ count: number }>('/api/trash/count')
      .then((res) => {
        if (typeof res?.count === 'number') {
          setTrashCount(res.count);
        }
      })
      .catch(() => {});

    // 3. Load Site Settings / Name
    api.get<{ siteName?: string }>('/api/settings')
      .then((res) => {
        if (res?.siteName) {
          setSiteName(res.siteName);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
    window.addEventListener('blueprint-updated', loadData);
    window.addEventListener('blueprints-updated', loadData);
    window.addEventListener('settings-updated', loadData);
    window.addEventListener('trash-updated', loadData);
    window.addEventListener('content-updated', loadData);
    return () => {
      window.removeEventListener('blueprint-updated', loadData);
      window.removeEventListener('blueprints-updated', loadData);
      window.removeEventListener('settings-updated', loadData);
      window.removeEventListener('trash-updated', loadData);
      window.removeEventListener('content-updated', loadData);
    };
  }, []);

  const isBlueprintActive = (slug: string) => {
    return location.pathname.startsWith(`/blueprints/${slug}`) || location.pathname.startsWith(`/${slug}`);
  };

  const isStudioActive = () => {
    return (
      location.pathname === '/blueprints/studio' ||
      location.pathname === '/blueprints' ||
      location.pathname === '/blueprints/new' ||
      location.pathname.startsWith('/blueprints/edit')
    );
  };

  // Build the complete categorized navigation matching the full dashboard architecture
  const sections: NavSection[] = [
    {
      title: 'CONTENT',
      items: [
        {
          to: '/pages',
          label: 'Pages',
          icon: 'article',
          show: can('pages.read'),
          isActiveCheck: (p) => p.startsWith('/pages')
        },
        {
          to: '/posts',
          label: 'Posts',
          icon: 'menu_book',
          show: can('posts.read'),
          isActiveCheck: (p) => p.startsWith('/posts')
        }
      ]
    },
    {
      title: 'BLUEPRINTS & TAXONOMY',
      items: [
        {
          to: '/blueprints/studio',
          label: 'Blueprints',
          icon: 'schema',
          show: can('blueprints.read'),
          isActiveCheck: () => isStudioActive()
        },
        {
          to: '/categories',
          label: 'Categories & Tags',
          icon: 'folder_open',
          show: can('categories.read'),
          isActiveCheck: (p) => p.startsWith('/categories')
        },
        {
          to: '/blueprints/feature-packs',
          label: 'Feature Packs',
          icon: 'extension',
          show: can('blueprints.read'),
          isActiveCheck: (p) => p.startsWith('/blueprints/feature-packs')
        }
      ]
    },
    ...(customBlueprints.length > 0
      ? [
          {
            title: 'COLLECTIONS',
            items: customBlueprints.map((bp) => ({
              to: `/blueprints/${bp.slug}`,
              label: bp.name,
              icon: getBlueprintMaterialIcon(bp.icon),
              show: true,
              badge: bp.entryCount && bp.entryCount > 0 ? bp.entryCount : undefined,
              badgeColor: 'primary' as const,
              isActiveCheck: () => isBlueprintActive(bp.slug)
            }))
          }
        ]
      : []),
    {
      title: 'ASSETS & NAV',
      items: [
        {
          to: '/media',
          label: 'Media Library',
          icon: 'photo_library',
          show: can('media.read'),
          isActiveCheck: (p) => p.startsWith('/media')
        },
        {
          to: '/navigation',
          label: 'Navigation',
          icon: 'menu',
          show: can('menus.read'),
          isActiveCheck: (p) => p.startsWith('/navigation')
        },
        {
          to: '/themes',
          label: 'Themes',
          icon: 'palette',
          show: can('settings.read'),
          isActiveCheck: (p) => p.startsWith('/themes')
        }
      ]
    },
    {
      title: 'SYSTEM & CONFIG',
      items: [
        {
          to: '/users',
          label: 'Users & Roles',
          icon: 'manage_accounts',
          show: can('users.read'),
          isActiveCheck: (p) => p.startsWith('/users')
        },
        {
          to: '/settings',
          label: 'Site Settings & SEO',
          icon: 'tune',
          show: can('settings.read'),
          isActiveCheck: (p) => p.startsWith('/settings')
        },
        {
          to: '/revisions',
          label: 'Revisions',
          icon: 'history',
          show: can('revisions.read'),
          isActiveCheck: (p) => p.startsWith('/revisions')
        },
        {
          to: '/backups',
          label: 'Backups',
          icon: 'archive',
          show: can('backups.read'),
          isActiveCheck: (p) => p.startsWith('/backups')
        },
        {
          to: '/trash',
          label: 'Trash',
          icon: 'delete',
          show: true,
          badge: trashCount > 0 ? trashCount : undefined,
          badgeColor: 'rose' as const,
          isActiveCheck: (p) => p.startsWith('/trash')
        }
      ]
    }
  ];

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 ${sidebarWidthClass} bg-surface-container-lowest z-50 flex flex-col py-3 border-r border-surface-container-high/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)] select-none transition-all duration-300 ease-in-out`}
      aria-label="Admin Sidebar Navigation"
    >
      {/* Brand Logo, Toggle Header & Navigation */}
      <div className="flex flex-col w-full h-full min-h-0">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 w-full px-2 pb-2">
            <Link
              to="/"
              title="Planfo CMS Home"
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-surface-container transition-transform hover:scale-105 group relative"
            >
              <PlanfoLogo variant="icon" className="w-7 h-7" />
              <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60">
                Planfo Dashboard
              </div>
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              title="Expand sidebar"
              className="w-10 h-7 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_right</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full px-4 pb-3 border-b border-surface-container-high/40 mb-1">
            <Link
              to="/"
              title="Planfo CMS Home"
              className="flex flex-col min-w-0 transition-transform hover:scale-101"
            >
              <PlanfoLogo variant="full" className="h-6 w-auto" />
              <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-label-xs mt-1 truncate">
                <span className="font-semibold text-primary truncate max-w-[130px]" title={siteName}>
                  {siteName}
                </span>
                <span className="text-outline">•</span>
                <span className="text-outline">Static</span>
              </div>
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              title="Collapse sidebar"
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_left</span>
            </button>
          </div>
        )}

        {/* Scrollable Categorized Navigation Area */}
        <nav
          className={`flex flex-col gap-0.5 w-full flex-1 overflow-y-auto no-scrollbar py-1 ${
            isCollapsed ? 'items-center px-2' : 'px-3'
          }`}
        >
          {/* Dashboard / Overview Link */}
          {isCollapsed ? (
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
              <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60">
                Dashboard
              </div>
            </NavLink>
          ) : (
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all font-label-md text-label-md ${
                  isActive
                    ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">grid_view</span>
              <span className="truncate">Dashboard</span>
            </NavLink>
          )}

          {/* Categorized Sections */}
          {sections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => item.show !== false);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title || sIdx} className="w-full flex flex-col gap-0.5">
                {/* Section Header or Divider */}
                {isCollapsed ? (
                  <div className="my-1.5 w-8 h-px bg-surface-container-high/60 mx-auto shrink-0" />
                ) : (
                  <div className="px-3 pt-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-outline font-mono select-none">
                    {section.title}
                  </div>
                )}

                {/* Section Items */}
                {visibleItems.map((item) => {
                  const isActive = item.isActiveCheck
                    ? item.isActiveCheck(location.pathname)
                    : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

                  if (isCollapsed) {
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.exact}
                        className={`relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                          isActive
                            ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>

                        {/* Dot indicator for badges in collapsed mode */}
                        {item.badge !== undefined && (
                          <span
                            className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                              item.badgeColor === 'rose' ? 'bg-rose-500 animate-pulse' : 'bg-primary'
                            }`}
                          />
                        )}

                        {/* Hover Tooltip */}
                        <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60 flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badge !== undefined && (
                            <span
                              className={`font-code text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                item.badgeColor === 'rose'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-surface-container text-primary'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </NavLink>
                    );
                  }

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.exact}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all font-label-md text-label-md ${
                        isActive
                          ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate min-w-0">
                        <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`font-code text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            item.badgeColor === 'rose'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-surface-container text-primary'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { PlanfoLogo } from '../UI/PlanfoLogo.js';
import { ProfileDropdown } from '../UI/ProfileDropdown.js';
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

export const SidebarRail: React.FC = () => {
  const { can } = useAuth();
  const location = useLocation();
  const { isCollapsed, toggleSidebar, sidebarWidthClass } = useSidebar();
  const [customBlueprints, setCustomBlueprints] = useState<CustomBlueprintNav[]>([]);
  const [trashCount, setTrashCount] = useState<number>(0);

  const loadData = () => {
    api.get<Array<{ id: string; name: string; slug: string; icon: string; isBuiltIn?: boolean; entryCount?: number }>>('/api/blueprints')
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomBlueprints(data.filter((b) => !b.isBuiltIn));
        }
      })
      .catch(() => {});

    api.get<{ count: number }>('/api/trash/count')
      .then((res) => {
        if (typeof res?.count === 'number') {
          setTrashCount(res.count);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
    window.addEventListener('blueprint-updated', loadData);
    window.addEventListener('settings-updated', loadData);
    return () => {
      window.removeEventListener('blueprint-updated', loadData);
      window.removeEventListener('settings-updated', loadData);
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
      location.pathname.startsWith('/blueprints/edit') ||
      location.pathname === '/blueprints/feature-packs'
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 ${sidebarWidthClass} bg-surface-container-lowest z-50 flex flex-col justify-between py-3.5 border-r border-surface-container-high/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)] select-none transition-all duration-300 ease-in-out`}
      aria-label="Admin Sidebar Navigation"
    >
      {/* Top Section: Brand Logo & Toggle Header */}
      <div className="flex flex-col w-full">
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
          <div className="flex items-center justify-between w-full px-4 pb-3 border-b border-surface-container-high/40 mb-2">
            <Link
              to="/"
              title="Planfo CMS Home"
              className="flex items-center gap-2 transition-transform hover:scale-102"
            >
              <PlanfoLogo variant="full" className="h-6 w-auto" />
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              title="Collapse sidebar"
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_left</span>
            </button>
          </div>
        )}

        {/* Scrollable Navigation Items */}
        <nav
          className={`flex flex-col gap-1 w-full max-h-[calc(100vh-210px)] overflow-y-auto no-scrollbar py-1 ${
            isCollapsed ? 'items-center px-2' : 'px-3'
          }`}
        >
          {/* Overview */}
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
                Overview
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
              <span className="truncate">Overview</span>
            </NavLink>
          )}

          {/* Articles Library */}
          {can('posts.read') && (
            isCollapsed ? (
              <NavLink
                to="/posts"
                className={() =>
                  `relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                    location.pathname.startsWith('/posts')
                      ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">menu_book</span>
                <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60">
                  Articles Library
                </div>
              </NavLink>
            ) : (
              <NavLink
                to="/posts"
                className={() =>
                  `flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all font-label-md text-label-md ${
                    location.pathname.startsWith('/posts')
                      ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">menu_book</span>
                <span className="truncate">Articles Library</span>
              </NavLink>
            )
          )}

          {/* Pages */}
          {can('pages.read') && (
            isCollapsed ? (
              <NavLink
                to="/pages"
                className={() =>
                  `relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                    location.pathname.startsWith('/pages')
                      ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">article</span>
                <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60">
                  Pages
                </div>
              </NavLink>
            ) : (
              <NavLink
                to="/pages"
                className={() =>
                  `flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all font-label-md text-label-md ${
                    location.pathname.startsWith('/pages')
                      ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">article</span>
                <span className="truncate">Pages</span>
              </NavLink>
            )
          )}

          {/* Divider Before Blueprints */}
          {customBlueprints.length > 0 && (
            <div className={`my-1.5 shrink-0 ${isCollapsed ? 'w-8 h-px bg-surface-container-high/60 mx-auto' : 'w-full h-px bg-surface-container-high/40'}`} />
          )}

          {/* Dynamic Blueprints */}
          {customBlueprints.map((bp) => {
            const active = isBlueprintActive(bp.slug);
            const iconName = getBlueprintMaterialIcon(bp.icon);

            if (isCollapsed) {
              return (
                <Link
                  key={bp.id || bp.slug}
                  to={`/blueprints/${bp.slug}`}
                  className={`relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                    active
                      ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                  {bp.entryCount !== undefined && bp.entryCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                  )}
                  <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60 flex items-center gap-2">
                    <span>{bp.name}</span>
                    {bp.entryCount !== undefined && (
                      <span className="font-code text-[10px] text-primary font-bold bg-surface-container px-1.5 py-0.5 rounded">
                        {bp.entryCount}
                      </span>
                    )}
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={bp.id || bp.slug}
                to={`/blueprints/${bp.slug}`}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all font-label-md text-label-md ${
                  active
                    ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-3 truncate min-w-0">
                  <span className="material-symbols-outlined text-[20px] shrink-0">{iconName}</span>
                  <span className="truncate">{bp.name}</span>
                </div>
                {bp.entryCount !== undefined && bp.entryCount > 0 && (
                  <span className="font-code text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-primary shrink-0">
                    {bp.entryCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Divider Before Tools */}
          <div className={`my-1.5 shrink-0 ${isCollapsed ? 'w-8 h-px bg-surface-container-high/60 mx-auto' : 'w-full h-px bg-surface-container-high/40'}`} />

          {/* Blueprints Studio */}
          {can('blueprints.read') && (
            isCollapsed ? (
              <Link
                to="/blueprints/studio"
                className={`relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                  isStudioActive()
                    ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">schema</span>
                <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60">
                  Blueprints Studio
                </div>
              </Link>
            ) : (
              <Link
                to="/blueprints/studio"
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all font-label-md text-label-md ${
                  isStudioActive()
                    ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">schema</span>
                <span className="truncate">Blueprints Studio</span>
              </Link>
            )
          )}

          {/* Media Library */}
          {can('media.read') && (
            isCollapsed ? (
              <NavLink
                to="/media"
                className={() =>
                  `relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                    location.pathname.startsWith('/media')
                      ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">photo_library</span>
                <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60">
                  Media Library
                </div>
              </NavLink>
            ) : (
              <NavLink
                to="/media"
                className={() =>
                  `flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all font-label-md text-label-md ${
                    location.pathname.startsWith('/media')
                      ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">photo_library</span>
                <span className="truncate">Media Library</span>
              </NavLink>
            )
          )}

          {/* Navigation Manager */}
          {can('menus.read') && (
            isCollapsed ? (
              <NavLink
                to="/navigation"
                className={() =>
                  `relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                    location.pathname.startsWith('/navigation')
                      ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">menu</span>
                <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60">
                  Navigation Menus
                </div>
              </NavLink>
            ) : (
              <NavLink
                to="/navigation"
                className={() =>
                  `flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all font-label-md text-label-md ${
                    location.pathname.startsWith('/navigation')
                      ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">menu</span>
                <span className="truncate">Navigation</span>
              </NavLink>
            )
          )}

          {/* Themes */}
          {can('settings.read') && (
            isCollapsed ? (
              <NavLink
                to="/themes"
                className={() =>
                  `relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                    location.pathname.startsWith('/themes')
                      ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">palette</span>
                <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60">
                  Themes
                </div>
              </NavLink>
            ) : (
              <NavLink
                to="/themes"
                className={() =>
                  `flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all font-label-md text-label-md ${
                    location.pathname.startsWith('/themes')
                      ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">palette</span>
                <span className="truncate">Themes</span>
              </NavLink>
            )
          )}
        </nav>
      </div>

      {/* Bottom Section: Trash, Settings & User Profile */}
      <div className={`flex flex-col gap-1 w-full pt-2 border-t border-surface-container-high/60 shrink-0 ${isCollapsed ? 'items-center px-2' : 'px-3'}`}>
        {/* Trash */}
        {isCollapsed ? (
          <NavLink
            to="/trash"
            className={() =>
              `relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                location.pathname.startsWith('/trash')
                  ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
            {trashCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
            <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60 flex items-center gap-1.5">
              <span>Trash</span>
              {trashCount > 0 && (
                <span className="font-code text-[10px] text-rose-500 font-bold bg-rose-50 px-1.5 py-0.2 rounded">
                  {trashCount}
                </span>
              )}
            </div>
          </NavLink>
        ) : (
          <NavLink
            to="/trash"
            className={() =>
              `flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all font-label-md text-label-md ${
                location.pathname.startsWith('/trash')
                  ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`
            }
          >
            <div className="flex items-center gap-3 truncate min-w-0">
              <span className="material-symbols-outlined text-[20px] shrink-0">delete</span>
              <span className="truncate">Trash</span>
            </div>
            {trashCount > 0 && (
              <span className="font-code text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0">
                {trashCount}
              </span>
            )}
          </NavLink>
        )}

        {/* Settings */}
        {can('settings.read') && (
          isCollapsed ? (
            <NavLink
              to="/settings"
              className={() =>
                `relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                  location.pathname.startsWith('/settings')
                    ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
              <div className="fixed left-20 px-2.5 py-1.5 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-surface-container-high/60">
                Settings
              </div>
            </NavLink>
          ) : (
            <NavLink
              to="/settings"
              className={() =>
                `flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all font-label-md text-label-md ${
                  location.pathname.startsWith('/settings')
                    ? 'bg-primary-container/30 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">tune</span>
              <span className="truncate">Settings</span>
            </NavLink>
          )
        )}

        {/* Profile Dropdown */}
        <div className={`relative group pt-1 ${isCollapsed ? 'flex justify-center' : 'w-full'}`}>
          <ProfileDropdown />
        </div>
      </div>
    </aside>
  );
};

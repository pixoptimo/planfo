import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Menu as MenuIcon,
  CornerDownRight,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
  Compass,
  Tag,
  BookOpen,
  Package,
  Search,
  GripVertical,
  Settings,
  Check
} from 'lucide-react';
import type { Menu, MenuItem, Page, Post } from '@cms/schemas';
import { api } from '../../api/client.js';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface BlueprintMeta {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  entryCount?: number;
}

interface BlueprintEntryItem {
  id: string;
  title: string;
  slug: string;
  status?: string;
}

export const NavigationManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'edit' | 'locations'>('edit');

  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('main');
  const [menu, setMenu] = useState<Menu>({
    id: 'menu_main',
    name: 'Main Navigation',
    slug: 'main',
    location: 'header',
    locations: ['header', 'footer'],
    items: [],
    updatedAt: new Date().toISOString()
  });

  // Source Data
  const [pages, setPages] = useState<Page[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [blueprints, setBlueprints] = useState<BlueprintMeta[]>([]);
  const [blueprintEntriesMap, setBlueprintEntriesMap] = useState<Record<string, BlueprintEntryItem[]>>({});
  const [activeBlueprintSlug, setActiveBlueprintSlug] = useState<string>('templates');

  // Selection states
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedBlueprintEntryIds, setSelectedBlueprintEntryIds] = useState<string[]>([]);

  // Search filters
  const [pageSearch, setPageSearch] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [blueprintSearch, setBlueprintSearch] = useState('');

  // Accordion Open/Closed States (All items are accordions)
  const [accordionsOpen, setAccordionsOpen] = useState<{
    pages: boolean;
    posts: boolean;
    categories: boolean;
    blueprints: boolean;
    custom: boolean;
  }>({
    pages: true,
    posts: false,
    categories: false,
    blueprints: false,
    custom: false
  });

  const toggleAccordion = (key: keyof typeof accordionsOpen) => {
    setAccordionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Expanded menu item cards in structure tree
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Custom Link Form State
  const [customLinkLabel, setCustomLinkLabel] = useState('');
  const [customLinkUrl, setCustomLinkUrl] = useState('/');
  const [customLinkNoLink, setCustomLinkNoLink] = useState(false);

  // New Menu Modal State
  const [isCreatingMenu, setIsCreatingMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuLocations, setNewMenuLocations] = useState<string[]>([]);

  // Manage Locations state
  const [locationAssignments, setLocationAssignments] = useState<{
    header: string;
    footer: string;
  }>({
    header: 'main',
    footer: 'main'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [menusData, pagesData, postsData, categoriesData, blueprintsData] = await Promise.all([
        api.get<Menu[]>('/api/menus'),
        api.get<Page[]>('/api/pages').catch(() => [] as Page[]),
        api.get<any>('/api/posts').then((res) => (Array.isArray(res) ? res : res?.posts || [])).catch(() => [] as Post[]),
        api.get<any>('/api/categories').then((res) => (Array.isArray(res) ? res : res?.categories || [])).catch(() => [] as CategoryItem[]),
        api.get<any[]>('/api/blueprints').catch(() => [] as BlueprintMeta[])
      ]);

      setMenus(menusData);
      setPages(pagesData.filter((p) => p.status === 'published' || p.status === 'draft'));
      setPosts(postsData);
      setCategories(categoriesData);

      // Filter custom blueprints (exclude built-in pages & posts which have their own accordions)
      const customBps = (blueprintsData || []).filter(
        (b) => b.slug !== 'pages' && b.slug !== 'posts'
      );
      setBlueprints(customBps);

      // Fetch entries for custom blueprints
      const bpMap: Record<string, BlueprintEntryItem[]> = {};
      await Promise.all(
        customBps.map(async (bp) => {
          try {
            const res = await api.get<{ blueprint: any; entries: any[] }>(`/api/blueprints/${bp.slug}/entries`);
            bpMap[bp.slug] = (res.entries || []).map((e: any) => ({
              id: e.id || e.slug,
              title: e.title || e.name || 'Untitled',
              slug: e.slug,
              status: e.status
            }));
          } catch {
            bpMap[bp.slug] = [];
          }
        })
      );
      setBlueprintEntriesMap(bpMap);

      if (customBps.length > 0) {
        setActiveBlueprintSlug(customBps[0].slug);
      }

      // Active menu
      const active = menusData.find((m) => m.slug === selectedSlug) || menusData[0];
      if (active) {
        setSelectedSlug(active.slug);
        setMenu(active);
      }

      // Location assignments
      const headerMenu = menusData.find((m) => m.locations?.includes('header') || m.location === 'header');
      const footerMenu = menusData.find((m) => m.locations?.includes('footer') || m.location === 'footer');
      setLocationAssignments({
        header: headerMenu ? headerMenu.slug : 'main',
        footer: footerMenu ? footerMenu.slug : 'main'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load navigation data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMenu = (slug: string) => {
    setSelectedSlug(slug);
    const target = menus.find((m) => m.slug === slug);
    if (target) {
      setMenu(target);
      setError(null);
      setSuccess(null);
    }
  };

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName.trim()) return;

    try {
      setSaving(true);
      setError(null);
      const created = await api.post<Menu>('/api/menus', {
        name: newMenuName.trim(),
        locations: newMenuLocations,
        location: newMenuLocations[0] || '',
        items: []
      });

      const updatedList = await api.get<Menu[]>('/api/menus');
      setMenus(updatedList);
      setSelectedSlug(created.slug);
      setMenu(created);
      setIsCreatingMenu(false);
      setNewMenuName('');
      setNewMenuLocations([]);
      setSuccess(`Menu "${created.name}" created! Add items from the left.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create menu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMenu = async () => {
    if (menu.slug === 'main') {
      alert('The Main Navigation menu cannot be deleted.');
      return;
    }
    if (!confirm(`Delete the menu "${menu.name}"?`)) return;

    try {
      setSaving(true);
      setError(null);
      await api.delete(`/api/menus/${menu.slug}`);
      const updatedList = await api.get<Menu[]>('/api/menus');
      setMenus(updatedList);
      const fallback = updatedList[0] || {
        id: 'menu_main',
        name: 'Main Navigation',
        slug: 'main',
        locations: ['header', 'footer'],
        items: [],
        updatedAt: new Date().toISOString()
      };
      setSelectedSlug(fallback.slug);
      setMenu(fallback);
      setSuccess(`Menu "${menu.name}" deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete menu');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await api.put<Menu>(`/api/menus/${menu.slug}`, {
        name: menu.name,
        locations: menu.locations || [],
        location: menu.locations?.[0] || '',
        items: menu.items
      });
      setMenu(updated);

      const updatedList = await api.get<Menu[]>('/api/menus');
      setMenus(updatedList);
      setSuccess(`Menu "${updated.name}" saved! Site updated.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLocations = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      for (const m of menus) {
        const nextLocs: string[] = [];
        if (locationAssignments.header === m.slug) nextLocs.push('header');
        if (locationAssignments.footer === m.slug) nextLocs.push('footer');

        await api.put(`/api/menus/${m.slug}`, {
          name: m.name,
          locations: nextLocs,
          location: nextLocs[0] || '',
          items: m.items
        });
      }

      const refreshed = await api.get<Menu[]>('/api/menus');
      setMenus(refreshed);
      const active = refreshed.find((m) => m.slug === selectedSlug) || refreshed[0];
      if (active) setMenu(active);

      setSuccess('Theme display locations updated!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save menu locations');
    } finally {
      setSaving(false);
    }
  };

  // Add Pages
  const handleAddPagesToMenu = () => {
    if (selectedPageIds.length === 0) return;
    const selected = pages.filter((p) => selectedPageIds.includes(p.id));

    const newItems: MenuItem[] = selected.map((page) => ({
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: page.title,
      url: page.slug === 'home' ? '/' : `/${page.slug}`,
      target: '_self',
      noLink: false,
      children: []
    }));

    setMenu({ ...menu, items: [...menu.items, ...newItems] });
    setSelectedPageIds([]);
    setSuccess(`Added ${newItems.length} page(s).`);
  };

  // Add Posts
  const handleAddPostsToMenu = () => {
    if (selectedPostIds.length === 0) return;
    const selected = posts.filter((p) => selectedPostIds.includes(p.id));

    const newItems: MenuItem[] = selected.map((post) => ({
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: post.title,
      url: `/blog/${post.slug}`,
      target: '_self',
      noLink: false,
      children: []
    }));

    setMenu({ ...menu, items: [...menu.items, ...newItems] });
    setSelectedPostIds([]);
    setSuccess(`Added ${newItems.length} post(s).`);
  };

  // Add Categories
  const handleAddCategoriesToMenu = () => {
    if (selectedCategoryIds.length === 0) return;
    const selected = categories.filter((c) => selectedCategoryIds.includes(c.id));

    const newItems: MenuItem[] = selected.map((cat) => ({
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: cat.name,
      url: `/category/${cat.slug}`,
      target: '_self',
      noLink: false,
      children: []
    }));

    setMenu({ ...menu, items: [...menu.items, ...newItems] });
    setSelectedCategoryIds([]);
    setSuccess(`Added ${newItems.length} category item(s).`);
  };

  // Add Blueprint Entries
  const handleAddBlueprintEntriesToMenu = () => {
    if (selectedBlueprintEntryIds.length === 0) return;
    const entries = blueprintEntriesMap[activeBlueprintSlug] || [];
    const selected = entries.filter((e) => selectedBlueprintEntryIds.includes(e.id || e.slug));

    const newItems: MenuItem[] = selected.map((entry) => ({
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: entry.title,
      url: `/${activeBlueprintSlug}/${entry.slug}`,
      target: '_self',
      noLink: false,
      children: []
    }));

    setMenu({ ...menu, items: [...menu.items, ...newItems] });
    setSelectedBlueprintEntryIds([]);
    setSuccess(`Added ${newItems.length} item(s) from ${activeBlueprintSlug}.`);
  };

  // Add Custom Link
  const handleAddCustomLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLinkLabel.trim()) return;

    const newItem: MenuItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: customLinkLabel.trim(),
      url: customLinkNoLink ? '#' : (customLinkUrl.trim() || '/'),
      target: '_self',
      noLink: customLinkNoLink,
      children: []
    };

    setMenu({ ...menu, items: [...menu.items, newItem] });
    setCustomLinkLabel('');
    setCustomLinkUrl('/');
    setCustomLinkNoLink(false);
    setSuccess(`Added "${newItem.label}".`);
  };

  const addItem = () => {
    const newItem: MenuItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: 'New Link',
      url: '/',
      target: '_self',
      noLink: false,
      children: []
    };
    setMenu({ ...menu, items: [...menu.items, newItem] });
    setExpandedItems((prev) => ({ ...prev, [newItem.id]: true }));
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateItem = (index: number, partial: Partial<MenuItem>) => {
    const newItems = [...menu.items];
    newItems[index] = { ...newItems[index], ...partial };
    setMenu({ ...menu, items: newItems });
  };

  const removeItem = (index: number) => {
    setMenu({ ...menu, items: menu.items.filter((_, idx) => idx !== index) });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === menu.items.length - 1) return;

    const newItems = [...menu.items];
    const target = direction === 'up' ? index - 1 : index + 1;
    const temp = newItems[index];
    newItems[index] = newItems[target];
    newItems[target] = temp;
    setMenu({ ...menu, items: newItems });
  };

  const indentItem = (index: number) => {
    if (index === 0) return;
    const newItems = [...menu.items];
    const itemToIndent = newItems[index];
    const prevItem = newItems[index - 1];

    const updatedChildren = [...(prevItem.children || []), itemToIndent];
    newItems[index - 1] = { ...prevItem, children: updatedChildren };
    newItems.splice(index, 1);

    setMenu({ ...menu, items: newItems });
    setExpandedItems((prev) => ({ ...prev, [prevItem.id]: true }));
  };

  const outdentChildItem = (parentIndex: number, childIndex: number) => {
    const parent = menu.items[parentIndex];
    const childToOutdent = parent.children![childIndex];

    const updatedChildren = parent.children!.filter((_, idx) => idx !== childIndex);
    const newItems = [...menu.items];
    newItems[parentIndex] = { ...parent, children: updatedChildren };
    newItems.splice(parentIndex + 1, 0, childToOutdent);

    setMenu({ ...menu, items: newItems });
  };

  const addChildItem = (parentIndex: number) => {
    const parent = menu.items[parentIndex];
    const newChild: MenuItem = {
      id: `child_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: 'Dropdown Link',
      url: '/',
      target: '_self',
      noLink: false
    };

    const newChildren = [...(parent.children || []), newChild];
    updateItem(parentIndex, { children: newChildren });
    setExpandedItems((prev) => ({ ...prev, [parent.id]: true }));
  };

  const updateChildItem = (parentIndex: number, childIndex: number, partial: Partial<MenuItem>) => {
    const parent = menu.items[parentIndex];
    const newChildren = [...(parent.children || [])];
    newChildren[childIndex] = { ...newChildren[childIndex], ...partial };
    updateItem(parentIndex, { children: newChildren });
  };

  const removeChildItem = (parentIndex: number, childIndex: number) => {
    const parent = menu.items[parentIndex];
    const newChildren = (parent.children || []).filter((_, idx) => idx !== childIndex);
    updateItem(parentIndex, { children: newChildren });
  };

  const toggleLocation = (loc: string) => {
    const currentLocs = menu.locations || [];
    const nextLocs = currentLocs.includes(loc)
      ? currentLocs.filter((l) => l !== loc)
      : [...currentLocs, loc];
    setMenu({ ...menu, locations: nextLocs, location: nextLocs[0] || '' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant space-y-3">
        <Compass className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading navigation menus...</p>
      </div>
    );
  }

  // Filtered lists
  const filteredPages = pages.filter((p) =>
    p.title.toLowerCase().includes(pageSearch.toLowerCase()) || p.slug.toLowerCase().includes(pageSearch.toLowerCase())
  );
  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(postSearch.toLowerCase()) || p.slug.toLowerCase().includes(postSearch.toLowerCase())
  );
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase()) || c.slug.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const currentBlueprintEntries = (blueprintEntriesMap[activeBlueprintSlug] || []).filter((e) =>
    e.title.toLowerCase().includes(blueprintSearch.toLowerCase()) || e.slug.toLowerCase().includes(blueprintSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-high/40 pb-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-serif text-on-surface tracking-tight flex items-center space-x-2.5">
            <Compass className="w-6 h-6 text-primary" />
            <span>Navigation Menus</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Manage site menus, dropdown hierarchies, and theme display locations.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => setIsCreatingMenu(true)}
            className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition border border-surface-container-high/50"
          >
            <Plus className="w-4 h-4 text-primary" />
            <span>Create New Menu</span>
          </button>

          {activeTab === 'edit' ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Menu'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveLocations}
              disabled={saving}
              className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-surface-container-high/40">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center space-x-2 ${
            activeTab === 'edit'
              ? 'border-primary text-primary bg-surface-container-high/40 rounded-t-lg'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <MenuIcon className="w-4 h-4" />
          <span>Edit Menus</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('locations')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center space-x-2 ${
            activeTab === 'locations'
              ? 'border-primary text-primary bg-surface-container-high/40 rounded-t-lg'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Manage Locations</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-700 font-medium flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Create New Menu Dialog */}
      {isCreatingMenu && (
        <form
          onSubmit={handleCreateMenu}
          className="p-5 bg-surface-container-lowest border border-primary/40 rounded-xl space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-surface-container-high/40 pb-3">
            <h3 className="text-sm font-bold text-on-surface flex items-center space-x-2">
              <Plus className="w-4 h-4 text-primary" />
              <span>Create New Navigation Menu</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingMenu(false)}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                Menu Name *
              </label>
              <input
                type="text"
                required
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                placeholder="e.g. Header Nav, Footer Nav, Socials"
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                Display Location
              </label>
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center space-x-2 text-xs text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMenuLocations.includes('header')}
                    onChange={(e) => {
                      if (e.target.checked) setNewMenuLocations([...newMenuLocations, 'header']);
                      else setNewMenuLocations(newMenuLocations.filter((l) => l !== 'header'));
                    }}
                    className="rounded border-surface-container-high/50 bg-surface-container-lowest text-primary focus:ring-0"
                  />
                  <span>Header Navigation</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMenuLocations.includes('footer')}
                    onChange={(e) => {
                      if (e.target.checked) setNewMenuLocations([...newMenuLocations, 'footer']);
                      else setNewMenuLocations(newMenuLocations.filter((l) => l !== 'footer'));
                    }}
                    className="rounded border-surface-container-high/50 bg-surface-container-lowest text-primary focus:ring-0"
                  />
                  <span>Footer Navigation</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-surface-container-high/40">
            <button
              type="button"
              onClick={() => setIsCreatingMenu(false)}
              className="px-3.5 py-1.5 bg-surface-container text-on-surface hover:bg-surface-container-highest text-xs rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !newMenuName.trim()}
              className="px-4 py-1.5 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-lg transition disabled:opacity-50"
            >
              Create Menu
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: EDIT MENUS (WordPress-style Left Accordions + Right Menu Structure)  */}
      {/* ========================================================================= */}
      {activeTab === 'edit' && (
        <div className="space-y-6">
          {/* Menu Selector Bar */}
          <div className="p-3.5 bg-surface-container-lowest border border-surface-container-high/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center space-x-1.5">
                <MenuIcon className="w-4 h-4 text-primary" />
                <span>Select a menu to edit:</span>
              </label>
              <div className="relative">
                <select
                  value={selectedSlug}
                  onChange={(e) => handleSelectMenu(e.target.value)}
                  className="bg-surface-container-low border border-surface-container-high/50 rounded-lg px-3 py-1.5 text-xs text-on-surface font-semibold pr-8 focus:outline-none focus:border-primary"
                >
                  {menus.map((m) => {
                    const locs = m.locations && m.locations.length > 0 ? ` (${m.locations.join(', ')})` : '';
                    return (
                      <option key={m.slug} value={m.slug}>
                        {m.name}
                        {locs}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={() => handleSelectMenu(selectedSlug)}
                className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg transition"
              >
                Select
              </button>
              <span className="text-xs text-on-surface-variant">or</span>
              <button
                type="button"
                onClick={() => setIsCreatingMenu(true)}
                className="text-xs text-primary hover:underline font-semibold"
              >
                create a new menu
              </button>
            </div>

            {menu.slug !== 'main' && (
              <button
                type="button"
                onClick={handleDeleteMenu}
                className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center space-x-1 self-start md:self-auto font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete this menu</span>
              </button>
            )}
          </div>

          {/* Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ------------------------------------------------------------- */}
            {/* LEFT COLUMN: All Accordions (Pages, Posts, Categories, Blueprints, Custom) */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-3">
              <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">
                Add Menu Items
              </div>

              {/* Accordion 1: Pages */}
              <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('pages')}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-surface-container-high/50 transition"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Pages</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">
                      {pages.length}
                    </span>
                  </div>
                  {accordionsOpen.pages ? <ChevronUp className="w-4 h-4 text-on-surface-variant" /> : <ChevronDown className="w-4 h-4 text-on-surface-variant" />}
                </button>

                {accordionsOpen.pages && (
                  <div className="p-3 pt-0 border-t border-surface-container-high/40 space-y-2.5">
                    {pages.length > 4 && (
                      <div className="relative mt-2.5">
                        <Search className="w-3 h-3 text-on-surface-variant absolute left-2.5 top-2 pointer-events-none" />
                        <input
                          type="text"
                          value={pageSearch}
                          onChange={(e) => setPageSearch(e.target.value)}
                          placeholder="Search pages..."
                          className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg pl-7 pr-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                    )}

                    <div className="max-h-48 overflow-y-auto space-y-1 p-2 border border-surface-container-high/40 rounded-lg bg-surface-container-low/80 mt-2">
                      {filteredPages.length === 0 ? (
                        <div className="text-[11px] text-on-surface-variant p-2 text-center">No pages found</div>
                      ) : (
                        filteredPages.map((p) => {
                          const isChecked = selectedPageIds.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className="flex items-center space-x-2 text-xs text-on-surface hover:text-primary cursor-pointer py-1 px-1.5 rounded hover:bg-surface-container-high/60"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedPageIds([...selectedPageIds, p.id]);
                                  else setSelectedPageIds(selectedPageIds.filter((id) => id !== p.id));
                                }}
                                className="rounded border-surface-container-high/50 bg-surface-container-lowest text-primary focus:ring-0"
                              />
                              <span className="truncate flex-1 font-medium">{p.title}</span>
                              <span className="text-[10px] text-on-surface-variant font-mono">/{p.slug}</span>
                            </label>
                          );
                        })
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedPageIds.length === filteredPages.length) setSelectedPageIds([]);
                          else setSelectedPageIds(filteredPages.map((p) => p.id));
                        }}
                        className="text-[11px] text-on-surface-variant hover:text-on-surface underline"
                      >
                        {selectedPageIds.length === filteredPages.length && filteredPages.length > 0
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>

                      <button
                        type="button"
                        onClick={handleAddPagesToMenu}
                        disabled={selectedPageIds.length === 0}
                        className="px-3 py-1 bg-surface-container hover:bg-surface-container-highest text-primary text-xs font-semibold rounded-lg transition disabled:opacity-40"
                      >
                        Add to Menu
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Posts */}
              <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('posts')}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-surface-container-high/50 transition"
                >
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Posts</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">
                      {posts.length}
                    </span>
                  </div>
                  {accordionsOpen.posts ? <ChevronUp className="w-4 h-4 text-on-surface-variant" /> : <ChevronDown className="w-4 h-4 text-on-surface-variant" />}
                </button>

                {accordionsOpen.posts && (
                  <div className="p-3 pt-0 border-t border-surface-container-high/40 space-y-2.5">
                    {posts.length > 4 && (
                      <div className="relative mt-2.5">
                        <Search className="w-3 h-3 text-on-surface-variant absolute left-2.5 top-2 pointer-events-none" />
                        <input
                          type="text"
                          value={postSearch}
                          onChange={(e) => setPostSearch(e.target.value)}
                          placeholder="Search posts..."
                          className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg pl-7 pr-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                    )}

                    <div className="max-h-48 overflow-y-auto space-y-1 p-2 border border-surface-container-high/40 rounded-lg bg-surface-container-low/80 mt-2">
                      {filteredPosts.length === 0 ? (
                        <div className="text-[11px] text-on-surface-variant p-2 text-center">No posts found</div>
                      ) : (
                        filteredPosts.map((p) => {
                          const isChecked = selectedPostIds.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className="flex items-center space-x-2 text-xs text-on-surface hover:text-primary cursor-pointer py-1 px-1.5 rounded hover:bg-surface-container-high/60"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedPostIds([...selectedPostIds, p.id]);
                                  else setSelectedPostIds(selectedPostIds.filter((id) => id !== p.id));
                                }}
                                className="rounded border-surface-container-high/50 bg-surface-container-lowest text-primary focus:ring-0"
                              />
                              <span className="truncate flex-1 font-medium">{p.title}</span>
                              <span className="text-[10px] text-on-surface-variant font-mono">/blog/{p.slug}</span>
                            </label>
                          );
                        })
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedPostIds.length === filteredPosts.length) setSelectedPostIds([]);
                          else setSelectedPostIds(filteredPosts.map((p) => p.id));
                        }}
                        className="text-[11px] text-on-surface-variant hover:text-on-surface underline"
                      >
                        {selectedPostIds.length === filteredPosts.length && filteredPosts.length > 0
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>

                      <button
                        type="button"
                        onClick={handleAddPostsToMenu}
                        disabled={selectedPostIds.length === 0}
                        className="px-3 py-1 bg-surface-container hover:bg-surface-container-highest text-primary text-xs font-semibold rounded-lg transition disabled:opacity-40"
                      >
                        Add to Menu
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Categories */}
              <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('categories')}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-surface-container-high/50 transition"
                >
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Categories</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">
                      {categories.length}
                    </span>
                  </div>
                  {accordionsOpen.categories ? <ChevronUp className="w-4 h-4 text-on-surface-variant" /> : <ChevronDown className="w-4 h-4 text-on-surface-variant" />}
                </button>

                {accordionsOpen.categories && (
                  <div className="p-3 pt-0 border-t border-surface-container-high/40 space-y-2.5">
                    {categories.length > 4 && (
                      <div className="relative mt-2.5">
                        <Search className="w-3 h-3 text-on-surface-variant absolute left-2.5 top-2 pointer-events-none" />
                        <input
                          type="text"
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          placeholder="Search categories..."
                          className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg pl-7 pr-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                    )}

                    <div className="max-h-48 overflow-y-auto space-y-1 p-2 border border-surface-container-high/40 rounded-lg bg-surface-container-low/80 mt-2">
                      {filteredCategories.length === 0 ? (
                        <div className="text-[11px] text-on-surface-variant p-2 text-center">No categories found</div>
                      ) : (
                        filteredCategories.map((c) => {
                          const isChecked = selectedCategoryIds.includes(c.id);
                          return (
                            <label
                              key={c.id}
                              className="flex items-center space-x-2 text-xs text-on-surface hover:text-primary cursor-pointer py-1 px-1.5 rounded hover:bg-surface-container-high/60"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedCategoryIds([...selectedCategoryIds, c.id]);
                                  else setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== c.id));
                                }}
                                className="rounded border-surface-container-high/50 bg-surface-container-lowest text-primary focus:ring-0"
                              />
                              <span className="truncate flex-1 font-medium">{c.name}</span>
                              <span className="text-[10px] text-on-surface-variant font-mono">/category/{c.slug}</span>
                            </label>
                          );
                        })
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedCategoryIds.length === filteredCategories.length) setSelectedCategoryIds([]);
                          else setSelectedCategoryIds(filteredCategories.map((c) => c.id));
                        }}
                        className="text-[11px] text-on-surface-variant hover:text-on-surface underline"
                      >
                        {selectedCategoryIds.length === filteredCategories.length && filteredCategories.length > 0
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>

                      <button
                        type="button"
                        onClick={handleAddCategoriesToMenu}
                        disabled={selectedCategoryIds.length === 0}
                        className="px-3 py-1 bg-surface-container hover:bg-surface-container-highest text-primary text-xs font-semibold rounded-lg transition disabled:opacity-40"
                      >
                        Add to Menu
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 4: Blueprints */}
              <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('blueprints')}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-surface-container-high/50 transition"
                >
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Blueprints</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">
                      {blueprints.length}
                    </span>
                  </div>
                  {accordionsOpen.blueprints ? <ChevronUp className="w-4 h-4 text-on-surface-variant" /> : <ChevronDown className="w-4 h-4 text-on-surface-variant" />}
                </button>

                {accordionsOpen.blueprints && (
                  <div className="p-3 pt-0 border-t border-surface-container-high/40 space-y-2.5">
                    {blueprints.length === 0 ? (
                      <div className="text-[11px] text-on-surface-variant py-3 text-center">No custom blueprints found</div>
                    ) : (
                      <>
                        {/* Blueprint Selector */}
                        <div className="flex items-center space-x-2 mt-2.5">
                          <select
                            value={activeBlueprintSlug}
                            onChange={(e) => {
                              setActiveBlueprintSlug(e.target.value);
                              setSelectedBlueprintEntryIds([]);
                            }}
                            className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-2.5 py-1 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                          >
                            {blueprints.map((bp) => {
                              const count = (blueprintEntriesMap[bp.slug] || []).length;
                              return (
                                <option key={bp.slug} value={bp.slug}>
                                  {bp.name} ({count})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {currentBlueprintEntries.length > 4 && (
                          <div className="relative">
                            <Search className="w-3 h-3 text-on-surface-variant absolute left-2.5 top-2 pointer-events-none" />
                            <input
                              type="text"
                              value={blueprintSearch}
                              onChange={(e) => setBlueprintSearch(e.target.value)}
                              placeholder={`Search ${activeBlueprintSlug}...`}
                              className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg pl-7 pr-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-primary"
                            />
                          </div>
                        )}

                        <div className="max-h-48 overflow-y-auto space-y-1 p-2 border border-surface-container-high/40 rounded-lg bg-surface-container-low/80">
                          {currentBlueprintEntries.length === 0 ? (
                            <div className="text-[11px] text-on-surface-variant p-2 text-center">No entries in this blueprint</div>
                          ) : (
                            currentBlueprintEntries.map((e) => {
                              const id = e.id || e.slug;
                              const isChecked = selectedBlueprintEntryIds.includes(id);
                              return (
                                <label
                                  key={id}
                                  className="flex items-center space-x-2 text-xs text-on-surface hover:text-primary cursor-pointer py-1 px-1.5 rounded hover:bg-surface-container-high/60"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(evt) => {
                                      if (evt.target.checked) setSelectedBlueprintEntryIds([...selectedBlueprintEntryIds, id]);
                                      else setSelectedBlueprintEntryIds(selectedBlueprintEntryIds.filter((item) => item !== id));
                                    }}
                                    className="rounded border-surface-container-high/50 bg-surface-container-lowest text-primary focus:ring-0"
                                  />
                                  <span className="truncate flex-1 font-medium">{e.title}</span>
                                  <span className="text-[10px] text-on-surface-variant font-mono">/{activeBlueprintSlug}/{e.slug}</span>
                                </label>
                              );
                            })
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedBlueprintEntryIds.length === currentBlueprintEntries.length) setSelectedBlueprintEntryIds([]);
                              else setSelectedBlueprintEntryIds(currentBlueprintEntries.map((e) => e.id || e.slug));
                            }}
                            className="text-[11px] text-on-surface-variant hover:text-on-surface underline"
                          >
                            {selectedBlueprintEntryIds.length === currentBlueprintEntries.length && currentBlueprintEntries.length > 0
                              ? 'Deselect All'
                              : 'Select All'}
                          </button>

                          <button
                            type="button"
                            onClick={handleAddBlueprintEntriesToMenu}
                            disabled={selectedBlueprintEntryIds.length === 0}
                            className="px-3 py-1 bg-surface-container hover:bg-surface-container-highest text-primary text-xs font-semibold rounded-lg transition disabled:opacity-40"
                          >
                            Add to Menu
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 5: Custom Link */}
              <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('custom')}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-surface-container-high/50 transition"
                >
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Custom Link</span>
                  </div>
                  {accordionsOpen.custom ? <ChevronUp className="w-4 h-4 text-on-surface-variant" /> : <ChevronDown className="w-4 h-4 text-on-surface-variant" />}
                </button>

                {accordionsOpen.custom && (
                  <form onSubmit={handleAddCustomLink} className="p-3 pt-0 border-t border-surface-container-high/40 space-y-2.5">
                    <div className="mt-2.5">
                      <label className="block text-[11px] font-semibold text-on-surface uppercase mb-1">
                        Link Text *
                      </label>
                      <input
                        type="text"
                        required
                        value={customLinkLabel}
                        onChange={(e) => setCustomLinkLabel(e.target.value)}
                        placeholder="e.g. Products, About Us"
                        className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded-lg bg-surface-container-low border border-surface-container-high/40">
                      <input
                        type="checkbox"
                        checked={customLinkNoLink}
                        onChange={(e) => setCustomLinkNoLink(e.target.checked)}
                        className="rounded border-surface-container-high/50 bg-surface-container-lowest text-primary focus:ring-0"
                      />
                      <span className="text-[11px] font-medium text-on-surface">
                        No Link (Dropdown Trigger Only)
                      </span>
                    </label>

                    {!customLinkNoLink && (
                      <div>
                        <label className="block text-[11px] font-semibold text-on-surface uppercase mb-1">
                          URL / Path
                        </label>
                        <input
                          type="text"
                          value={customLinkUrl}
                          onChange={(e) => setCustomLinkUrl(e.target.value)}
                          placeholder="/path or https://..."
                          className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-lg px-2.5 py-1.5 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                    )}

                    <div className="pt-0.5 flex justify-end">
                      <button
                        type="submit"
                        disabled={!customLinkLabel.trim()}
                        className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-highest text-primary text-xs font-semibold rounded-lg transition disabled:opacity-40"
                      >
                        Add Custom Link
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Fast Blank Item */}
              <button
                type="button"
                onClick={addItem}
                className="w-full py-2 bg-surface-container-low border border-dashed border-surface-container-high/40 hover:border-primary/50 hover:bg-surface-container-high/50 text-on-surface-variant hover:text-on-surface text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>Add Blank Item</span>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* RIGHT COLUMN: Menu Structure (Cards Tree & Menu Settings)     */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="p-4 bg-surface-container-low/90 border-b border-surface-container-high/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                      Menu Name:
                    </label>
                    <input
                      type="text"
                      value={menu.name}
                      onChange={(e) => setMenu({ ...menu, name: e.target.value })}
                      className="bg-surface-container-low border border-surface-container-high/40 rounded-lg px-3 py-1.5 text-sm font-bold text-on-surface focus:outline-none focus:border-primary w-full max-w-sm"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-primary" />
                      <span>Add Item</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-1.5 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Save Menu'}</span>
                    </button>
                  </div>
                </div>

                {/* Subtitle / Counter */}
                <div className="px-4 py-2 bg-surface-container-low/40 border-b border-surface-container-high/40 text-[11px] text-on-surface-variant flex items-center justify-between">
                  <span>Reorder and arrange menu items. Click an item to edit options.</span>
                  <span className="font-mono text-on-surface-variant">{menu.items.length} item(s)</span>
                </div>

                {/* Tree Items */}
                <div className="p-4 space-y-2.5">
                  {menu.items.length === 0 ? (
                    <div className="p-10 text-center text-on-surface-variant space-y-2 border border-dashed border-surface-container-high/40 rounded-xl">
                      <Compass className="w-8 h-8 text-outline-variant mx-auto" />
                      <p className="text-xs font-semibold text-on-surface">This menu has no items.</p>
                      <p className="text-[11px] text-on-surface-variant">
                        Select pages, posts, categories, or blueprints from the left to add items.
                      </p>
                    </div>
                  ) : (
                    menu.items.map((item, idx) => {
                      const isExpanded = Boolean(expandedItems[item.id]);
                      const hasSub = Array.isArray(item.children) && item.children.length > 0;

                      return (
                        <div
                          key={item.id}
                          className="bg-surface-container-low border border-surface-container-high/40 hover:border-surface-container-high/50 rounded-xl overflow-hidden transition"
                        >
                          {/* Row Header */}
                          <div className="p-2.5 sm:p-3 bg-surface-container-low/60 flex items-center justify-between gap-2 select-none">
                            <div
                              onClick={() => toggleExpand(item.id)}
                              className="flex items-center space-x-2.5 flex-1 cursor-pointer truncate"
                            >
                              <GripVertical className="w-4 h-4 text-outline-variant hover:text-on-surface-variant flex-shrink-0" />
                              <span className="text-xs font-bold text-on-surface tracking-tight truncate">{item.label}</span>

                              {item.noLink ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 font-semibold border border-amber-500/20">
                                  Dropdown Trigger
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-mono truncate max-w-xs">
                                  {item.url || '/'}
                                </span>
                              )}

                              {hasSub && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-semibold">
                                  {item.children!.length} sub-link(s)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-1 flex-shrink-0">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => indentItem(idx)}
                                  title="Indent as sub-item of previous item"
                                  className="px-2 py-1 bg-surface-container hover:bg-surface-container-highest text-primary text-[10px] font-semibold rounded transition flex items-center space-x-1"
                                >
                                  <CornerDownRight className="w-3 h-3" />
                                  <span className="hidden sm:inline">Sub-item</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => moveItem(idx, 'up')}
                                disabled={idx === 0}
                                title="Move Up"
                                className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-20"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveItem(idx, 'down')}
                                disabled={idx === menu.items.length - 1}
                                title="Move Down"
                                className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-20"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleExpand(item.id)}
                                title="Edit Item"
                                className="p-1 text-on-surface-variant hover:text-on-surface"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                title="Remove Item"
                                className="p-1 text-on-surface-variant hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Settings */}
                          {isExpanded && (
                            <div className="p-3.5 border-t border-surface-container-high/40 bg-surface-container-low/90 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">
                                    Navigation Label
                                  </label>
                                  <input
                                    type="text"
                                    value={item.label}
                                    onChange={(e) => updateItem(idx, { label: e.target.value })}
                                    className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">
                                    URL Destination
                                  </label>
                                  {item.noLink ? (
                                    <div className="bg-surface-container-high/50 border border-surface-container-high/40 rounded-lg px-2.5 py-1.5 text-xs text-on-surface-variant italic">
                                      Dropdown Trigger (No URL)
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      value={item.url || ''}
                                      onChange={(e) => updateItem(idx, { url: e.target.value })}
                                      placeholder="/"
                                      className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-lg px-2.5 py-1.5 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                                    />
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 pt-1">
                                <label className="flex items-center space-x-2 text-xs text-on-surface cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(item.noLink)}
                                    onChange={(e) => {
                                      const isNoLink = e.target.checked;
                                      updateItem(idx, {
                                        noLink: isNoLink,
                                        url: isNoLink ? '#' : item.url === '#' ? '/' : item.url
                                      });
                                    }}
                                    className="rounded border-surface-container-high/50 bg-surface-container-lowest text-primary focus:ring-0"
                                  />
                                  <span>No Link (Dropdown trigger only)</span>
                                </label>

                                {!item.noLink && (
                                  <label className="flex items-center space-x-2 text-xs text-on-surface cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.target === '_blank'}
                                      onChange={(e) =>
                                        updateItem(idx, { target: e.target.checked ? '_blank' : '_self' })
                                      }
                                      className="rounded border-surface-container-high/50 bg-surface-container-lowest text-primary focus:ring-0"
                                    />
                                    <span>Open link in new tab</span>
                                  </label>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-surface-container-high/40">
                                <button
                                  type="button"
                                  onClick={() => removeItem(idx)}
                                  className="text-[11px] text-red-600 hover:text-red-700 hover:underline font-medium"
                                >
                                  Remove Item
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(item.id)}
                                  className="text-[11px] text-on-surface-variant hover:text-on-surface font-medium"
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Children Sub-links */}
                          <div className="pl-6 pr-3 pb-2.5 space-y-2 border-l-2 border-primary/20 ml-6 my-2">
                            {(item.children || []).map((child, childIdx) => (
                              <div
                                key={child.id}
                                className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-surface-container-lowest p-2 rounded-lg border border-surface-container-high/40"
                              >
                                <CornerDownRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                <input
                                  type="text"
                                  value={child.label}
                                  onChange={(e) => updateChildItem(idx, childIdx, { label: e.target.value })}
                                  placeholder="Sub-link Label"
                                  className="w-full sm:w-44 bg-surface-container-low border border-surface-container-high/40 rounded px-2 py-1 text-xs text-on-surface font-semibold"
                                />
                                <input
                                  type="text"
                                  value={child.url || ''}
                                  onChange={(e) => updateChildItem(idx, childIdx, { url: e.target.value })}
                                  placeholder="Sub-link URL"
                                  className="w-full sm:flex-1 bg-surface-container-low border border-surface-container-high/40 rounded px-2 py-1 text-xs font-mono text-on-surface"
                                />
                                <select
                                  value={child.target || '_self'}
                                  onChange={(e) => updateChildItem(idx, childIdx, { target: e.target.value as any })}
                                  className="bg-surface-container-low border border-surface-container-high/40 rounded px-2 py-1 text-[11px] text-on-surface"
                                >
                                  <option value="_self">Same Tab</option>
                                  <option value="_blank">New Tab</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => outdentChildItem(idx, childIdx)}
                                  title="Outdent to top-level menu item"
                                  className="px-2 py-1 text-[10px] bg-surface-container hover:bg-surface-container-highest text-on-surface rounded transition"
                                >
                                  Outdent
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeChildItem(idx, childIdx)}
                                  title="Remove Sub-link"
                                  className="p-1 text-on-surface-variant hover:text-red-600 ml-auto"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => addChildItem(idx)}
                              className="text-[11px] text-primary hover:underline flex items-center space-x-1.5 pt-0.5 font-semibold"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add sub-link</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Menu Settings */}
                <div className="p-4 bg-surface-container-low/60 border-t border-surface-container-high/40 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Display Location</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3 rounded-xl border cursor-pointer flex items-center space-x-3 transition ${
                        (menu.locations || []).includes('header')
                          ? 'bg-primary/10 border-primary/50 text-primary font-semibold'
                          : 'bg-surface-container-low border-surface-container-high/40 text-on-surface-variant hover:border-surface-container-high/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(menu.locations || []).includes('header')}
                        onChange={() => toggleLocation('header')}
                        className="rounded border-surface-container-high/50 bg-surface-container-lowest text-primary focus:ring-0"
                      />
                      <span className="text-xs font-bold text-on-surface">Header Navigation</span>
                    </label>

                    <label
                      className={`p-3 rounded-xl border cursor-pointer flex items-center space-x-3 transition ${
                        (menu.locations || []).includes('footer')
                          ? 'bg-primary/10 border-primary/50 text-primary font-semibold'
                          : 'bg-surface-container-low border-surface-container-high/40 text-on-surface-variant hover:border-surface-container-high/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(menu.locations || []).includes('footer')}
                        onChange={() => toggleLocation('footer')}
                        className="rounded border-surface-container-high/50 bg-surface-container-lowest text-primary focus:ring-0"
                      />
                      <span className="text-xs font-bold text-on-surface">Footer Navigation</span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-surface-container-high/40">
                    {menu.slug !== 'main' ? (
                      <button
                        type="button"
                        onClick={handleDeleteMenu}
                        className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center space-x-1 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Menu</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-on-surface-variant italic">Primary Main Navigation</span>
                    )}

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="px-5 py-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save Menu'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MANAGE LOCATIONS                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'locations' && (
        <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-xl overflow-hidden shadow-sm space-y-4">
          <div className="p-4 border-b border-surface-container-high/40">
            <h2 className="text-base font-bold text-on-surface flex items-center space-x-2">
              <Layers className="w-5 h-5 text-primary" />
              <span>Theme Display Locations</span>
            </h2>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-container-high/40 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="pb-3 px-3">Location</th>
                  <th className="pb-3 px-3">Assigned Menu</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/40 text-xs text-on-surface">
                <tr className="hover:bg-surface-container-high/30 transition">
                  <td className="py-3 px-3 font-semibold text-on-surface">Header Navigation</td>
                  <td className="py-3 px-3">
                    <select
                      value={locationAssignments.header}
                      onChange={(e) =>
                        setLocationAssignments({ ...locationAssignments, header: e.target.value })
                      }
                      className="bg-surface-container-low border border-surface-container-high/50 rounded-lg px-3 py-1.5 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary w-full max-w-xs"
                    >
                      <option value="">— Select a Menu —</option>
                      {menus.map((m) => (
                        <option key={m.slug} value={m.slug}>
                          {m.name} ({m.items.length} items)
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {locationAssignments.header && (
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectMenu(locationAssignments.header);
                          setActiveTab('edit');
                        }}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        Edit Menu
                      </button>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-surface-container-high/30 transition">
                  <td className="py-3 px-3 font-semibold text-on-surface">Footer Navigation</td>
                  <td className="py-3 px-3">
                    <select
                      value={locationAssignments.footer}
                      onChange={(e) =>
                        setLocationAssignments({ ...locationAssignments, footer: e.target.value })
                      }
                      className="bg-surface-container-low border border-surface-container-high/50 rounded-lg px-3 py-1.5 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary w-full max-w-xs"
                    >
                      <option value="">— Select a Menu —</option>
                      {menus.map((m) => (
                        <option key={m.slug} value={m.slug}>
                          {m.name} ({m.items.length} items)
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {locationAssignments.footer && (
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectMenu(locationAssignments.footer);
                          setActiveTab('edit');
                        }}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        Edit Menu
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-surface-container-low/60 border-t border-surface-container-high/40 flex justify-end">
            <button
              type="button"
              onClick={handleSaveLocations}
              disabled={saving}
              className="px-5 py-2 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

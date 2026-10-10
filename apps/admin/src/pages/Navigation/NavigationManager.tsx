import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Menu as MenuIcon, CornerDownRight, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Menu, MenuItem } from '@cms/schemas';
import { api } from '../../api/client.js';

export const NavigationManager: React.FC = () => {
  const [menu, setMenu] = useState<Menu>({
    id: 'menu_main',
    name: 'Main Navigation',
    slug: 'main',
    items: [],
    updatedAt: new Date().toISOString()
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const data = await api.get<Menu>('/api/menus/main');
      setMenu(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await api.put<Menu>('/api/menus/main', {
        name: menu.name,
        items: menu.items
      });
      setMenu(updated);
      setSuccess('Navigation menu saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save navigation menu');
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    const newItem: MenuItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: 'New Link',
      url: '/',
      target: '_self',
      children: []
    };
    setMenu({ ...menu, items: [...menu.items, newItem] });
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

  const addChildItem = (parentIndex: number) => {
    const parent = menu.items[parentIndex];
    const newChild: MenuItem = {
      id: `child_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: 'Dropdown Item',
      url: '/',
      target: '_self'
    };

    const newChildren = [...(parent.children || []), newChild];
    updateItem(parentIndex, { children: newChildren });
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

  if (loading) {
    return <div className="text-center py-20 text-slate-500">Loading navigation structure...</div>;
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Navigation Manager</h1>
          <p className="text-xs text-slate-400 mt-1">Configure main website navbar links, custom URLs, and multi-level dropdown menus</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={addItem}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4 text-brand-400" />
            <span>Add Menu Item</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Navigation'}</span>
          </button>
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

      {/* Menu items tree */}
      <div className="space-y-4">
        {menu.items.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
            No navigation items. Click "Add Menu Item" above to add your first link.
          </div>
        ) : (
          menu.items.map((item, idx) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              {/* Item row */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                <div className="w-6 text-center text-xs font-mono text-slate-500 font-bold">
                  {idx + 1}
                </div>

                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateItem(idx, { label: e.target.value })}
                  placeholder="Link Text"
                  className="w-full sm:w-48 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-brand-500"
                />

                <input
                  type="text"
                  value={item.url}
                  onChange={(e) => updateItem(idx, { url: e.target.value })}
                  placeholder="URL (e.g. /about-us or https://...)"
                  className="w-full sm:flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-brand-500"
                />

                <select
                  value={item.target || '_self'}
                  onChange={(e) => updateItem(idx, { target: e.target.value as any })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300"
                >
                  <option value="_self">Same Window</option>
                  <option value="_blank">New Tab (_blank)</option>
                </select>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-25"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 'down')}
                    disabled={idx === menu.items.length - 1}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-25"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dropdown / Children sub-items */}
              <div className="pl-9 space-y-2">
                {(item.children || []).map((child, childIdx) => (
                  <div key={child.id} className="flex items-center gap-2 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                    <CornerDownRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <input
                      type="text"
                      value={child.label}
                      onChange={(e) => updateChildItem(idx, childIdx, { label: e.target.value })}
                      placeholder="Sub-link Label"
                      className="w-40 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={child.url}
                      onChange={(e) => updateChildItem(idx, childIdx, { url: e.target.value })}
                      placeholder="Sub-link URL"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeChildItem(idx, childIdx)}
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addChildItem(idx)}
                  className="text-[11px] text-brand-400 hover:underline flex items-center space-x-1 pt-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add dropdown child link</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

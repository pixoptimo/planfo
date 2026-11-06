import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Boxes,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  Layers,
  Check,
  Power,
  ExternalLink
} from 'lucide-react';
import { FEATURE_PACKS, type FeaturePackDefinition } from '../../data/featurePacks.js';
import { getBlueprintIcon } from '../../utils/blueprintIcons.js';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import type { SiteSettings, Blueprint } from '@cms/schemas';

interface BlueprintWithCount extends Blueprint {
  entryCount?: number;
}

export const FeaturePacksPage: React.FC = () => {
  const { can } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [blueprints, setBlueprints] = useState<BlueprintWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingPackId, setTogglingPackId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, blueprintsData] = await Promise.all([
        api.get<SiteSettings>('/api/settings'),
        api.get<BlueprintWithCount[]>('/api/blueprints')
      ]);
      setSettings(settingsData);
      setBlueprints(blueprintsData);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load feature packs');
    } finally {
      setLoading(false);
    }
  };

  const isPackActive = (pack: FeaturePackDefinition): boolean => {
    if (!settings) return false;
    const currentPacks = (settings.featurePacks as Record<string, boolean>) || {};
    return Boolean(currentPacks[pack.id]);
  };

  const getConnectedBlueprints = (pack: FeaturePackDefinition): BlueprintWithCount[] => {
    return blueprints.filter((b) => {
      if (b.slug === pack.suggestedSlug) return true;
      // Check if blueprint has matching field names from this pack
      const fieldNames = new Set(pack.fields.map((f) => f.name));
      const matchCount = b.fields.filter((f) => fieldNames.has(f.name)).length;
      return matchCount >= 2;
    });
  };

  const handleTogglePack = async (pack: FeaturePackDefinition) => {
    if (!settings || !can('settings.update')) return;

    const currentlyActive = isPackActive(pack);
    const nextState = !currentlyActive;
    setTogglingPackId(pack.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const currentPacks = (settings.featurePacks as Record<string, boolean>) || {};
      const updated = await api.put<SiteSettings>('/api/settings', {
        ...settings,
        featurePacks: {
          ...currentPacks,
          [pack.id]: nextState
        }
      });
      setSettings(updated);
      setSuccessMsg(
        nextState
          ? `${pack.name} enabled! Its plugin fields and capabilities are now available to attach to any Blueprint or Page.`
          : `${pack.name} disabled.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to toggle feature pack');
    } finally {
      setTogglingPackId(null);
    }
  };

  const activePacksCount = FEATURE_PACKS.filter((p) => isPackActive(p)).length;

  return (
    <div className="space-y-6 w-full pb-20">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-emerald-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Schema Architect & Collections</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Blueprints Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Visually design custom schemas, configure custom fields (text, media, dropdowns, dates), and automatically instantiate new collections in the sidebar without touching code.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {can('blueprints.create') && (
            <Link
              to="/blueprints/studio?action=new"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Blueprint</span>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <Link
          to="/blueprints/studio"
          className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center space-x-2 transition"
        >
          <Boxes className="w-4 h-4" />
          <span>Schema Builder & Blueprints</span>
        </Link>
        <Link
          to="/blueprints/feature-packs"
          className="px-4 py-2.5 text-xs font-bold border-b-2 border-brand-500 text-brand-400 flex items-center space-x-2"
        >
          <Package className="w-4 h-4" />
          <span>Feature Packs Hub</span>
        </Link>
      </div>


      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Feature Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {FEATURE_PACKS.map((pack) => {
          const IconComp = getBlueprintIcon(pack.icon);
          const active = isPackActive(pack);
          const isToggling = togglingPackId === pack.id;
          const connectedBps = getConnectedBlueprints(pack);

          return (
            <div
              key={pack.id}
              className={`rounded-2xl border transition flex flex-col justify-between overflow-hidden relative ${
                active
                  ? 'bg-slate-900 border-slate-800 shadow-lg shadow-black/40 ring-1 ring-emerald-500/20'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-800 opacity-90'
              }`}
            >
              <div className="p-6">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
                        active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-white text-base">{pack.name}</h3>
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                          {pack.badge}
                        </span>
                        <span className="text-xs font-mono text-slate-500">Plugin ID: {pack.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Active / Inactive Status pill & Toggle switch */}
                  <div className="flex items-center space-x-3">
                    {active ? (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Enabled</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
                        Inactive
                      </span>
                    )}

                    {can('settings.update') && (
                      <button
                        type="button"
                        onClick={() => handleTogglePack(pack)}
                        disabled={isToggling}
                        title={active ? 'Click to disable plugin' : 'Click to enable plugin'}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-200 cursor-pointer ${
                          active ? 'bg-emerald-500' : 'bg-slate-800'
                        } ${isToggling ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 flex items-center justify-center ${
                            active ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        >
                          {isToggling && <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-900" />}
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 mt-4 leading-relaxed">{pack.description}</p>

                {/* Capabilities list */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-2">
                    Plugin Capabilities:
                  </div>
                  {pack.capabilities.map((cap, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>

                {/* Fields provided */}
                <div className="mt-4 pt-3 border-t border-slate-800/50">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    Included Fields ({pack.fields.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pack.fields.map((fld) => (
                      <span
                        key={fld.name}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800"
                      >
                        {fld.label} <span className="text-brand-400">({fld.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer action bar */}
              <div className="px-6 py-3.5 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-xs font-mono text-slate-400">
                  {connectedBps.length > 0 ? (
                    <span className="text-emerald-400 font-semibold">
                      Connected to: {connectedBps.map((b) => `/${b.slug}`).join(', ')}
                    </span>
                  ) : (
                    <span className="text-slate-500">No blueprint connected yet</span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {active ? (
                    <Link
                      to={`/blueprints/studio?pack=${pack.id}`}
                      className="px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition"
                    >
                      <span>Connect in Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleTogglePack(pack)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
                    >
                      {isToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                      <span>Enable Plugin</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

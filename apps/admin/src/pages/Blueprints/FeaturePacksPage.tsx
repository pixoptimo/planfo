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
  Check,
  Power
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
          ? `${pack.name} enabled! Its plugin fields and capabilities are ready to attach in Blueprints Studio.`
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
    <div className="w-full pb-20 font-body-md text-on-surface antialiased">
      {/* Sub-header Breadcrumb Bar */}
      <div className="w-full bg-surface-container-lowest px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm border-b border-surface-container-high/40 rounded-xl mb-6">
        <div className="flex items-center gap-2 text-body-sm font-body-sm min-w-0">
          <Link
            to="/blueprints/studio"
            className="text-on-surface-variant hover:text-primary cursor-pointer transition-colors font-medium"
          >
            Blueprints Studio
          </Link>
          <span className="text-outline-variant select-none">/</span>
          <span className="text-primary font-semibold">Feature Packs Hub</span>
          <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container font-code text-code text-primary font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            {activePacksCount} of {FEATURE_PACKS.length} Active
          </span>
        </div>
        <div className="flex items-center gap-2">
          {can('blueprints.create') && (
            <Link
              to="/blueprints/new"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-sm transition-all hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Blueprint</span>
            </Link>
          )}
        </div>
      </div>

      {/* Hero / Title Overview Section */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm w-fit uppercase tracking-wider font-semibold">
            <Package className="w-3.5 h-3.5" />
            <span>Plugin Marketplace &amp; Fast-Track Schemas</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1 font-serif text-3xl sm:text-4xl">
            Feature Packs Hub
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Attach pre-packaged schema modules and capability templates to any blueprint collection. Fast-track setup
            for eCommerce catalogs, portfolios, event booking, FAQs, and staff directories.
          </p>
        </div>

        {/* Quick Metrics Ribbon */}
        <div className="grid grid-cols-3 gap-2 p-2 bg-surface-container-lowest rounded-xl shadow-sm min-w-[300px] border border-surface-container-high/40">
          <div className="flex flex-col p-2.5 rounded-lg bg-surface-container-low text-center">
            <span className="font-code text-code text-on-surface-variant uppercase font-medium">Packs</span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold text-xl">
              {FEATURE_PACKS.length}
            </span>
            <span className="font-label-sm text-[10px] text-on-surface-variant">Available</span>
          </div>
          <div className="flex flex-col p-2.5 rounded-lg bg-surface-container-low text-center">
            <span className="font-code text-code text-on-surface-variant uppercase font-medium">Active</span>
            <span className="font-headline-sm text-headline-sm text-secondary font-bold text-xl">
              {activePacksCount}
            </span>
            <span className="font-label-sm text-[10px] text-on-surface-variant">Enabled</span>
          </div>
          <div className="flex flex-col p-2.5 rounded-lg bg-surface-container-low text-center">
            <span className="font-code text-code text-on-surface-variant uppercase font-medium">Ready</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold text-xl">100%</span>
            <span className="font-label-sm text-[10px] text-on-surface-variant">Type-Safe</span>
          </div>
        </div>
      </section>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1 pb-1 bg-surface-container-low p-1.5 rounded-xl border border-surface-container-high/40 mb-6">
        <Link
          to="/blueprints/studio"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md"
        >
          <Boxes className="w-4 h-4" />
          <span>Schema Builder &amp; Blueprints</span>
        </Link>
        <Link
          to="/blueprints/feature-packs"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest text-primary shadow-sm font-label-md text-label-md font-semibold transition-all"
        >
          <Package className="w-4 h-4" />
          <span>Feature Packs Hub</span>
        </Link>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 bg-error-container/40 border border-error/30 rounded-xl text-xs text-on-error-container flex items-center space-x-2 mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-error" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-primary-fixed/40 border border-primary/30 rounded-xl text-xs text-on-primary-fixed flex items-center space-x-2 mb-6">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-primary" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Feature Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        {FEATURE_PACKS.map((pack) => {
          const IconComp = getBlueprintIcon(pack.icon);
          const active = isPackActive(pack);
          const isToggling = togglingPackId === pack.id;
          const connectedBps = getConnectedBlueprints(pack);

          return (
            <div
              key={pack.id}
              className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden relative shadow-sm ${
                active
                  ? 'bg-surface-container-lowest border-primary/30 shadow-md ring-1 ring-primary/20'
                  : 'bg-surface-container-lowest/80 border-surface-container-high/50 hover:border-surface-container-high'
              }`}
            >
              <div className="p-6">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-xs ${
                        active
                          ? 'bg-primary-fixed text-primary'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-on-surface text-base font-serif">{pack.name}</h3>
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                          {pack.badge}
                        </span>
                        <span className="text-xs font-mono text-on-surface-variant">Plugin ID: {pack.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Active / Inactive Status pill & Toggle switch */}
                  <div className="flex items-center space-x-3">
                    {active ? (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary font-semibold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        <span>Enabled</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
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
                          active ? 'bg-primary' : 'bg-surface-container-high'
                        } ${isToggling ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 flex items-center justify-center ${
                            active ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        >
                          {isToggling && <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />}
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-on-surface-variant mt-4 leading-relaxed">{pack.description}</p>

                {/* Capabilities list */}
                <div className="mt-4 pt-4 border-t border-surface-container-high/40 space-y-1.5">
                  <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-mono mb-2">
                    Plugin Capabilities:
                  </div>
                  {pack.capabilities.map((cap, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs text-on-surface">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>

                {/* Fields provided */}
                <div className="mt-4 pt-3 border-t border-surface-container-high/40">
                  <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-mono mb-1.5">
                    Included Fields ({pack.fields.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pack.fields.map((fld) => (
                      <span
                        key={fld.name}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant border border-surface-container-high/40"
                      >
                        {fld.label} <span className="text-primary font-semibold">({fld.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer action bar */}
              <div className="px-6 py-3.5 bg-surface-container-low/60 border-t border-surface-container-high/40 flex items-center justify-between">
                <div className="text-xs font-mono text-on-surface-variant">
                  {connectedBps.length > 0 ? (
                    <span className="text-primary font-semibold">
                      Connected to: {connectedBps.map((b) => `/${b.slug}`).join(', ')}
                    </span>
                  ) : (
                    <span className="text-on-surface-variant">No blueprint connected yet</span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {active ? (
                    <Link
                      to={`/blueprints/new`}
                      className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs hover:bg-primary-container transition"
                    >
                      <span>Attach to Blueprint</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleTogglePack(pack)}
                      className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
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

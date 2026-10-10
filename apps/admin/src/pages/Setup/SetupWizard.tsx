import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket,
  Palette,
  Package,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import type { ThemeInfo, User } from '@cms/schemas';

export const SetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [themes, setThemes] = useState<ThemeInfo[]>([]);

  // Form State
  const [siteName, setSiteName] = useState('My Static Website');
  const [tagline, setTagline] = useState('High performance static website powered by Aero CMS');
  const [enableCatalog, setEnableCatalog] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState('aero-modern');

  const [adminName, setAdminName] = useState('Site Admin');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if setup is already complete
    api.get<{ isSetupRequired: boolean }>('/api/auth/setup-status')
      .then((res) => {
        if (!res.isSetupRequired) {
          navigate('/login', { replace: true });
        }
      })
      .catch(() => {});

    // Fetch themes
    api.get<ThemeInfo[]>('/api/themes')
      .then((data) => {
        setThemes(data);
        if (data.length > 0) {
          setSelectedThemeId(data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingThemes(false));
  }, [navigate]);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) {
      setError('Please enter a site name.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleNextStep2 = () => {
    setError(null);
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminEmail || !adminEmail.includes('@')) {
      setError('Please provide a valid administrator email.');
      return;
    }

    if (adminPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (adminPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post<{ user: User }>('/api/auth/setup', {
        siteName,
        tagline,
        enableCatalog,
        themeId: selectedThemeId,
        name: adminName,
        email: adminEmail,
        password: adminPassword
      });

      // Reload window or navigate to admin home to refresh auth state
      window.location.href = import.meta.env.BASE_URL || '/admin/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="max-w-2xl w-full mx-auto space-y-8">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-slate-950 font-black text-2xl shadow-xl shadow-brand-500/20 mb-2">
            A
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Aero CMS QuickLaunch
          </h1>
          <p className="text-sm text-slate-400">
            Let's configure your zero-database file static website in 3 simple steps
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-lg border ${
              step === 1
                ? 'border-brand-500/40 bg-brand-500/10 text-brand-400 font-bold'
                : step > 1
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-800 bg-slate-900 text-slate-500'
            }`}
          >
            <span>1. Identity & Packs</span>
          </div>

          <div className="w-4 h-[1px] bg-slate-800"></div>

          <div
            className={`flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-lg border ${
              step === 2
                ? 'border-brand-500/40 bg-brand-500/10 text-brand-400 font-bold'
                : step > 2
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-800 bg-slate-900 text-slate-500'
            }`}
          >
            <span>2. Design Theme</span>
          </div>

          <div className="w-4 h-[1px] bg-slate-800"></div>

          <div
            className={`flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-lg border ${
              step === 3
                ? 'border-brand-500/40 bg-brand-500/10 text-brand-400 font-bold'
                : 'border-slate-800 bg-slate-900 text-slate-500'
            }`}
          >
            <span>3. Master Account</span>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Site Identity & Feature Packs */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Step 1: Website Identity & Feature Packs</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set your public site title and choose which content capabilities you want enabled.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Website Title *
                </label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. Acme Tech Studio"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tagline / Short Summary
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Modern static website powered by Aero"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Feature Packs Selection */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select Feature Packs
                </label>

                <div className="space-y-3">
                  {/* Core Pages & Articles */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">Pages & Articles Blueprint</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold">
                          Core
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Manage static pages, blog articles, categories, and navigation.
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>

                  {/* Storefront Catalog Pack */}
                  <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition">
                    <div className="pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">Storefront Catalog Pack</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          Optional
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Enable product catalogs, pricing, and product SKU management.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={enableCatalog}
                      onChange={(e) => setEnableCatalog(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-500 bg-slate-900 border-slate-700 focus:ring-brand-500"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition"
              >
                <span>Continue to Theme</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Choose Design Theme */}
        {step === 2 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Step 2: Choose Initial Design Theme</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your starting presentation layout. You can switch or install new themes anytime.
              </p>
            </div>

            {loadingThemes ? (
              <div className="text-center py-12 text-slate-500 font-mono text-xs">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                <span>Loading available design themes...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themes.map((theme) => {
                  const isSelected = selectedThemeId === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`cursor-pointer rounded-xl overflow-hidden border p-4 transition ${
                        isSelected
                          ? 'bg-slate-950 border-brand-500 ring-2 ring-brand-500/30 shadow-lg shadow-brand-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="aspect-[16/10] bg-slate-900 rounded-lg overflow-hidden border border-slate-800/80 mb-3 flex items-center justify-center">
                        {theme.thumbnail ? (
                          <img src={theme.thumbnail} alt={theme.name} className="w-full h-full object-cover object-top" />
                        ) : (
                          <Palette className="w-8 h-8 text-slate-600" />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{theme.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{theme.description}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg flex items-center space-x-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep2}
                className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition"
              >
                <span>Continue to Master Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Master Admin Account */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Step 3: Create Master Administrator</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                This account will have full administrative privileges and manage all publishing.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Name
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password (min 8 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={submitting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-2 shadow-xl shadow-brand-500/20 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Launching Aero CMS...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    <span>Launch Aero CMS Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

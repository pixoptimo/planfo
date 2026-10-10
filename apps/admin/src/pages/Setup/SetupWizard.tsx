import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { api } from '../../api/client.js';
import type { User } from '@cms/schemas';

export const SetupWizard: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [siteName, setSiteName] = useState('My Website');
  const [tagline, setTagline] = useState('Built with Planfo CMS — Database-free static website builder');
  const [usernameOrEmail, setUsernameOrEmail] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if initial setup is actually required
    api.get<{ isSetupRequired: boolean }>('/api/auth/setup-status')
      .then((res) => {
        if (!res?.isSetupRequired) {
          navigate('/', { replace: true });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Try preloading existing project name if settings already exist
    api.get<{ siteName?: string; description?: string }>('/api/settings')
      .then((data) => {
        if (data?.siteName && data.siteName !== 'My Static Website') {
          setSiteName(data.siteName);
        }
        if (data?.description) {
          setTagline(data.description);
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!siteName.trim()) {
      setError('Please provide a Project Name / Site Title.');
      return;
    }

    if (!usernameOrEmail.trim() || usernameOrEmail.trim().length < 3) {
      setError('Please provide an Admin Username or Email Address (at least 3 characters).');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post<{ user: User }>('/api/auth/setup', {
        siteName: siteName.trim(),
        tagline: tagline.trim(),
        usernameOrEmail: usernameOrEmail.trim(),
        password,
        themeId: 'planfo-default'
      });

      // Redirect immediately to the CMS Dashboard
      window.location.href = import.meta.env.BASE_URL || '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
        Checking installation state...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100 font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950 to-slate-950 pointer-events-none"></div>

      <div className="relative max-w-xl w-full mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-black text-2xl shadow-xl shadow-cyan-500/20 mb-1">
            ⚡
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome to Planfo CMS
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Welcome to the installation process. Just fill in the information below and you'll be on your way to managing and publishing your static website.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* WordPress-style Installation Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="border-b border-slate-800 pb-4 mb-6">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Information needed</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Please provide the following details. You can always change these settings later in your Planfo dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Project / Site Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Site Title / Project Name <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. My Website"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            {/* Tagline / Summary */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="In a few words, explain what this site is about."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">In a few words, explain what this site is about.</p>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800/80 pt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Administrator Account
              </h3>
            </div>

            {/* Username or Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username or Email Address <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="e.g. admin or you@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                You will use this username or email address to log in to Planfo CMS.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a secure password (min 6 characters)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            {/* Default Theme notice */}
            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Default Theme: <strong className="text-white">Planfo Default</strong> (Included)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">Ready</span>
            </div>

            {/* Install Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Installing Planfo CMS...</span>
                  </>
                ) : (
                  <span>Install Planfo CMS</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500">
          <p>Planfo CMS Beta v0.1 &bull; Database-free static website builder</p>
        </div>
      </div>
    </div>
  );
};

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
      <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface-variant font-mono text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-primary" />
        Checking installation state...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-on-surface font-body-md antialiased">
      <div className="relative max-w-xl w-full mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container font-black text-2xl shadow-sm mb-1">
            <span className="material-symbols-outlined text-[28px]">auto_stories</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-serif text-on-surface tracking-tight">
            Welcome to Planfo CMS
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
            Welcome to the installation process. Just fill in the information below and you'll be on your way to managing and publishing your static website.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-error-container/40 border border-error/20 rounded-2xl text-xs text-error flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Installation Card */}
        <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="border-b border-surface-container-high/40 pb-4 mb-6">
            <h2 className="font-title-md text-title-md font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
              <span>Information Needed</span>
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Please provide the following details. You can always change these settings later in your Planfo dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Project / Site Name */}
            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Site Title / Project Name <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. My Website"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl pl-10 pr-4 py-2.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary transition"
                />
              </div>
            </div>

            {/* Tagline / Summary */}
            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="In a few words, explain what this site is about."
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-4 py-2.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary transition"
              />
              <p className="font-body-sm text-[11px] text-on-surface-variant mt-1">In a few words, explain what this site is about.</p>
            </div>

            {/* Divider */}
            <div className="border-t border-surface-container-high/40 pt-4">
              <h3 className="font-label-xs text-label-xs font-bold text-on-surface uppercase tracking-wider mb-4">
                Administrator Account
              </h3>
            </div>

            {/* Username or Email */}
            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Username or Email Address <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="e.g. admin or you@example.com"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl pl-10 pr-4 py-2.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary transition"
                />
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant mt-1">
                You will use this username or email address to log in to Planfo CMS.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Password <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a secure password (min 6 characters)"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl pl-10 pr-10 py-2.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Confirm Password <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl pl-10 pr-4 py-2.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary transition"
                />
              </div>
            </div>

            {/* Default Theme notice */}
            <div className="p-3.5 bg-surface-container-low border border-surface-container-high/40 rounded-xl flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Default Theme: <strong className="text-on-surface">Planfo Default</strong> (Included)</span>
              </div>
              <span className="font-label-xs text-label-xs px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-mono font-semibold">
                Ready
              </span>
            </div>

            {/* Install Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-50"
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
        <div className="text-center font-body-sm text-body-sm text-on-surface-variant">
          <p>Planfo CMS v1.0 • Database-free static website builder</p>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api/client.js';
import { PlanfoLogo } from '../components/UI/PlanfoLogo.js';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ isSetupRequired: boolean }>('/api/auth/setup-status')
      .then((res) => {
        if (res?.isSetupRequired) {
          navigate('/setup', { replace: true });
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 font-body-md text-on-surface antialiased">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl p-8 backdrop-blur-sm relative">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <PlanfoLogo variant="full" className="h-8 w-auto" />
          </div>
          <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Editorial Studio</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Sign in to your Planfo website manager</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-label-sm text-label-sm font-semibold text-on-surface uppercase tracking-wider mb-1.5">
              Username or Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin or admin@example.com"
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-10 pr-4 py-2.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm font-semibold text-on-surface uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-10 pr-4 py-2.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs text-on-surface-variant/80">
            <span>Dev Admin: <strong className="text-on-surface font-mono">admin</strong> / <strong className="text-on-surface font-mono">admin123</strong></span>
            <button
              type="button"
              onClick={() => {
                setEmail('admin');
                setPassword('admin123');
              }}
              className="text-primary hover:text-primary/80 font-medium hover:underline transition"
            >
              Fill Default
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <span>Sign In to Studio</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-col items-center gap-1.5 text-center">
          <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
            Default Credentials
          </span>
          <p className="font-code text-[12px] text-primary bg-surface-container px-2.5 py-1 rounded-md">
            admin <span className="text-on-surface-variant">•</span> admin123
          </p>
        </div>
      </div>
    </div>
  );
};

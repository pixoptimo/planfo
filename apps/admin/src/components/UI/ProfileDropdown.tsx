import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

interface ProfileDropdownProps {
  className?: string;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initial = (user?.name || user?.email || 'A').slice(0, 1).toUpperCase();
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Admin');
  const roleName = user?.role === 'admin' ? 'Lead Architect' : user?.role ? user.role.toUpperCase() : 'Editor';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 p-1 rounded-full hover:bg-surface-container transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm text-on-primary font-bold text-xs">
          {initial}
        </div>
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant hidden sm:inline select-none">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high/60 py-2.5 z-50 animate-in fade-in slide-in-from-top-1 text-on-surface select-none">
          {/* User Info Header */}
          <div className="px-4 py-2 border-b border-surface-container-high/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                {initial}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md font-semibold text-on-surface truncate leading-tight">
                  {displayName}
                </span>
                <span className="font-body-xs text-body-xs text-on-surface-variant truncate">
                  {user?.email || 'admin@planfo.com'}
                </span>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-container/30 text-primary font-label-xs text-label-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {roleName}
              </span>
              <span className="text-[10px] text-on-surface-variant font-code">v2.4 Active</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="py-1">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-body-sm text-body-sm text-on-surface hover:bg-surface-container hover:text-primary transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">dashboard</span>
              <span>Overview &amp; Metrics</span>
            </Link>

            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-body-sm text-body-sm text-on-surface hover:bg-surface-container hover:text-primary transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">settings</span>
              <span>Site Settings</span>
            </Link>

            <Link
              to="/settings/seo"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-body-sm text-body-sm text-on-surface hover:bg-surface-container hover:text-primary transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">travel_explore</span>
              <span>SEO &amp; Indexing</span>
            </Link>

            <Link
              to="/themes"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-body-sm text-body-sm text-on-surface hover:bg-surface-container hover:text-primary transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">palette</span>
              <span>Themes &amp; Layout</span>
            </Link>
          </div>

          <div className="h-px bg-surface-container-high/40 my-1" />

          {/* Logout Button */}
          <div className="px-2 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-body-sm text-body-sm text-error hover:bg-error-container/20 transition-colors font-medium text-left"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


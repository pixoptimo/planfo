import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'published' | 'draft' | 'review' | 'live' | 'archived' | 'neutral' | 'violet';
  pulse?: boolean;
  icon?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  pulse = false,
  icon,
  className = ''
}) => {
  const variantClasses = {
    published: 'bg-surface-container-highest text-primary font-semibold',
    draft: 'bg-surface-container text-on-surface-variant font-medium',
    review: 'bg-tertiary-fixed text-on-tertiary-fixed font-semibold',
    live: 'bg-secondary text-on-secondary font-bold shadow-sm',
    archived: 'bg-surface-container-high text-on-surface-variant',
    neutral: 'bg-surface-container text-on-surface-variant font-medium',
    violet: 'bg-primary-container text-on-primary-container font-semibold'
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-xs text-label-xs ${variantClasses} ${className}`}
    >
      {pulse && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'live' ? 'bg-white animate-ping' : 'bg-primary animate-pulse'
          }`}
        />
      )}
      {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
      {children}
    </span>
  );
};

export interface TagProps {
  label: string;
  onRemove?: () => void;
  active?: boolean;
}

export const Tag: React.FC<TagProps> = ({ label, onRemove, active = false }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md transition-colors ${
        active
          ? 'bg-on-surface text-inverse-on-surface font-medium shadow-sm'
          : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
      }`}
    >
      <span>#{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-secondary-fixed transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      )}
    </span>
  );
};


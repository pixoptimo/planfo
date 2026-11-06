import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'coral' | 'pill' | 'icon' | 'ghost' | 'surface';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'h-8 px-2.5 rounded-lg font-label-xs text-label-xs gap-1.5',
    md: 'h-9 px-3.5 rounded-lg font-label-md text-label-md gap-2',
    lg: 'h-10 px-5 rounded-lg font-label-lg text-label-lg gap-2',
  }[size];

  const variantClasses = {
    primary: 'bg-primary-container text-on-primary-container shadow-sm hover:bg-primary active:scale-[0.98]',
    secondary: 'bg-surface-container text-primary hover:bg-surface-container-high active:scale-[0.98]',
    coral: 'bg-secondary-container text-white shadow-sm hover:opacity-90 active:scale-[0.98]',
    pill: 'rounded-full bg-primary-container text-on-primary-container shadow-sm hover:shadow active:scale-[0.98]',
    icon: 'w-10 h-10 p-0 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface active:scale-[0.96]',
    ghost: 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low active:scale-[0.98]',
    surface: 'bg-surface-container-lowest text-on-surface hover:text-primary shadow-sm hover:shadow active:scale-[0.98]',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${variant === 'icon' ? 'w-10 h-10 p-0 rounded-xl' : sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          )}
        </>
      )}
    </button>
  );
};


import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: string;
  shortcut?: string;
  prefixUrl?: string;
  pill?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  icon,
  shortcut,
  prefixUrl,
  pill = false,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className={`block font-label-md text-label-md font-semibold ${error ? 'text-error' : 'text-on-surface'}`}>
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {prefixUrl ? (
          <div className="flex items-center rounded-lg bg-surface-container-low overflow-hidden w-full focus-within:ring-2 focus-within:ring-primary/20">
            <span className="px-3.5 py-2.5 bg-surface-container font-label-md text-label-md text-on-surface-variant shrink-0 font-mono">
              {prefixUrl}
            </span>
            <input
              ref={ref}
              className="grow h-10 px-3 bg-transparent font-body-md text-body-md text-on-surface focus:outline-none"
              {...props}
            />
          </div>
        ) : (
          <>
            {icon && (
              <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[18px] pointer-events-none">
                {icon}
              </span>
            )}
            <input
              ref={ref}
              className={`w-full h-10 px-3.5 ${pill ? 'rounded-full' : 'rounded-lg'} ${icon ? 'pl-10' : ''} ${
                shortcut ? 'pr-14' : ''
              } bg-surface-container-low font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant transition-all focus:outline-none focus:bg-surface-container-lowest ${
                error
                  ? 'bg-error-container/30 shadow-[0_0_0_2px_#ba1a1a] pr-10'
                  : 'focus:shadow-[0_0_0_2px_#6d4aff]'
              } ${className}`}
              {...props}
            />
            {error && (
              <span className="material-symbols-outlined absolute right-3 text-error text-[20px] pointer-events-none">
                error
              </span>
            )}
            {shortcut && !error && (
              <span className="absolute right-3 px-2 py-0.5 rounded-md bg-surface-container font-label-xs text-label-xs text-on-surface-variant font-semibold pointer-events-none">
                {shortcut}
              </span>
            )}
          </>
        )}
      </div>

      {error ? (
        <p className="font-body-sm text-body-sm text-error flex items-center gap-1.5 font-medium">
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';


import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  showToolbar?: boolean;
  wordCount?: string;
  autosaveNotice?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  helperText,
  error,
  showToolbar = false,
  wordCount,
  autosaveNotice,
  className = '',
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        {label && (
          <label className={`block font-label-md text-label-md font-semibold ${error ? 'text-error' : 'text-on-surface'}`}>
            {label}
          </label>
        )}
        {wordCount && (
          <span className="font-label-xs text-label-xs text-on-surface-variant font-mono">
            {wordCount}
          </span>
        )}
      </div>

      <div className="rounded-xl bg-surface-container-low overflow-hidden focus-within:shadow-[0_0_0_2px_#6d4aff] transition-shadow">
        {showToolbar && (
          <div className="flex items-center justify-between px-3 py-2 bg-surface-container">
            <div className="flex items-center gap-1">
              <button type="button" className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[16px]">format_bold</span>
              </button>
              <button type="button" className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[16px]">format_italic</span>
              </button>
              <button type="button" className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[16px]">format_quote</span>
              </button>
              <button type="button" className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[16px]">link</span>
              </button>
              <button type="button" className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[16px]">code</span>
              </button>
            </div>
            <span className="font-label-xs text-label-xs text-primary font-semibold">Markdown Active</span>
          </div>
        )}

        <textarea
          ref={ref}
          rows={rows}
          className={`w-full p-3.5 bg-transparent font-body-md text-body-md text-on-surface resize-none focus:outline-none ${className}`}
          {...props}
        />

        {autosaveNotice && (
          <div className="px-3.5 py-2 bg-surface-container-lowest/60 flex items-center justify-between text-on-surface-variant">
            <span className="font-label-xs text-label-xs">{autosaveNotice}</span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant cursor-pointer">aspect_ratio</span>
          </div>
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

Textarea.displayName = 'Textarea';


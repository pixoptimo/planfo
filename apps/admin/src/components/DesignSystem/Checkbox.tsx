import React from 'react';

export interface CheckboxProps {
  label: string;
  description?: string;
  checked?: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false
}) => {
  return (
    <label
      className={`flex items-start gap-3 select-none group ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center shrink-0 transition-all ${
          checked || indeterminate
            ? 'bg-primary-container text-on-primary-container shadow-xs'
            : 'bg-surface-container group-hover:bg-surface-container-high'
        }`}
      >
        {checked ? (
          <span className="material-symbols-outlined text-[16px]">check</span>
        ) : indeterminate ? (
          <span className="material-symbols-outlined text-[16px]">remove</span>
        ) : null}
      </div>
      <div>
        <span className="font-label-md text-label-md text-on-surface font-semibold block group-hover:text-primary transition-colors">
          {label}
        </span>
        {description && (
          <span className="font-body-sm text-body-sm text-on-surface-variant block">
            {description}
          </span>
        )}
      </div>
    </label>
  );
};


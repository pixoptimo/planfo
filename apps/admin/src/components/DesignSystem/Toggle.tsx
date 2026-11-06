import React from 'react';

export interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  variant?: 'primary' | 'coral';
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  description,
  checked,
  onChange,
  variant = 'primary',
  disabled = false
}) => {
  return (
    <div
      className={`flex items-center justify-between select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
    >
      <div>
        <span
          className={`font-label-md text-label-md font-semibold block ${
            variant === 'coral' && checked ? 'text-secondary' : 'text-on-surface'
          }`}
        >
          {label}
        </span>
        {description && (
          <span className="font-body-sm text-body-sm text-on-surface-variant block">
            {description}
          </span>
        )}
      </div>

      <div
        className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors ${
          disabled
            ? 'bg-surface-container-high justify-start'
            : checked
            ? variant === 'coral'
              ? 'bg-secondary-container justify-end'
              : 'bg-primary-container justify-end'
            : 'bg-surface-container justify-start'
        }`}
      >
        <div className="w-5 h-5 rounded-full bg-surface-container-lowest shadow-sm" />
      </div>
    </div>
  );
};


import React from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label?: string;
  icon?: string;
  title?: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
  size = 'sm'
}: SegmentedControlProps<T>) {
  return (
    <div className={`p-1 rounded-xl bg-surface-container flex items-center ${className}`}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg transition-all ${
              size === 'sm' ? 'py-1.5 px-2.5 font-label-xs text-label-xs' : 'py-2 px-3.5 font-label-md text-label-md'
            } ${
              isSelected
                ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface font-medium'
            }`}
          >
            {opt.icon && (
              <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
            )}
            {opt.label && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}


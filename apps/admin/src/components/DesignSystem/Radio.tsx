import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  name
}) => {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`flex items-start gap-3 cursor-pointer p-2.5 rounded-xl transition-colors ${
              isSelected ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <div
              className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                isSelected
                  ? 'bg-surface-container-lowest shadow ring-2 ring-primary'
                  : 'bg-surface-container'
              }`}
            >
              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
            <div>
              <span
                className={`font-label-md text-label-md block font-semibold ${
                  isSelected ? 'text-primary font-bold' : 'text-on-surface'
                }`}
              >
                {opt.label}
              </span>
              {opt.description && (
                <span className="font-body-sm text-body-sm text-on-surface-variant block">
                  {opt.description}
                </span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
};


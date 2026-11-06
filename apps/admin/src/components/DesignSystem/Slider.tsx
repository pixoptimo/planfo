import React from 'react';

export interface SliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  badgeText?: string;
  unit?: string;
  onChange: (val: number) => void;
  minLabel?: string;
  maxLabel?: string;
  targetLabel?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  badgeText,
  unit = 'px',
  onChange,
  minLabel,
  maxLabel,
  targetLabel
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-title-md text-title-md text-on-surface font-semibold">{label}</div>
          {description && (
            <div className="font-body-sm text-body-sm text-on-surface-variant">{description}</div>
          )}
        </div>
        <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-label-xs text-label-xs font-bold shadow-sm">
          {badgeText || `${value} ${unit} Active`}
        </span>
      </div>

      <div className="space-y-2 pt-1">
        <div className="relative flex items-center h-4 group cursor-pointer">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
          />
          {/* Background track */}
          <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
            <div
              className="h-full bg-primary-container rounded-full transition-all duration-75"
              style={{ width: `${percentage}%` }}
            />
          </div>
          {/* Custom thumb */}
          <div
            className="absolute -translate-x-1/2 w-5 h-5 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center pointer-events-none ring-2 ring-primary transition-all duration-75 group-hover:scale-110"
            style={{ left: `${percentage}%` }}
          >
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
        </div>

        <div className="flex items-center justify-between font-label-xs text-label-xs text-on-surface-variant font-mono">
          <span>{minLabel || `Min ${min}${unit}`}</span>
          {targetLabel && <span className="font-bold text-primary">{targetLabel}</span>}
          <span>{maxLabel || `Max ${max}${unit}`}</span>
        </div>
      </div>
    </div>
  );
};


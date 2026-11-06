import React from 'react';

export interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  description?: string;
  icon?: string;
  target?: string;
  statusText?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  description,
  icon = 'trending_up',
  target,
  statusText
}) => {
  return (
    <div className="rounded-2xl p-6 bg-surface-container-lowest shadow-sm flex flex-col justify-between space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <span className="font-label-xs text-label-xs uppercase tracking-widest text-on-surface-variant font-bold">
            {title}
          </span>
          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-headline-xl text-headline-xl text-on-surface font-normal">
            {value}
          </span>
          {change && (
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-label-xs text-label-xs font-bold">
              {change}
            </span>
          )}
        </div>
        {description && (
          <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">{description}</p>
        )}
      </div>

      {/* SVG Sparkline */}
      <div className="h-14 w-full pt-2">
        <svg className="w-full h-full text-primary" fill="none" preserveAspectRatio="none" viewBox="0 0 280 60">
          <path
            d="M0 45 C 40 45, 60 20, 100 25 C 140 30, 160 5, 200 12 C 240 18, 260 2, 280 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M0 45 C 40 45, 60 20, 100 25 C 140 30, 160 5, 200 12 C 240 18, 260 2, 280 5 L 280 60 L 0 60 Z"
            fill="currentColor"
            fillOpacity="0.08"
          />
        </svg>
      </div>

      {(target || statusText) && (
        <div className="pt-4 flex items-center justify-between text-on-surface-variant font-label-xs text-label-xs">
          {target && <span>{target}</span>}
          {statusText && <span className="text-primary font-semibold">{statusText}</span>}
        </div>
      )}
    </div>
  );
};

export interface BlockInserterTileProps {
  icon: string;
  title: string;
  badge?: string;
  active?: boolean;
  onClick: () => void;
  accentColor?: string;
}

export const BlockInserterTile: React.FC<BlockInserterTileProps> = ({
  icon,
  title,
  badge,
  active = false,
  onClick,
  accentColor
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 p-2.5 rounded-lg text-left transition-all group ${
        active
          ? 'bg-primary-fixed text-on-primary-fixed shadow-sm'
          : 'bg-surface-container-low hover:bg-primary hover:text-on-primary'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <span
          className={`material-symbols-outlined text-[20px] transition-colors ${
            active ? 'text-primary' : 'text-primary group-hover:text-on-primary'
          } ${accentColor || ''}`}
        >
          {icon}
        </span>
        {badge && (
          <span
            className={`font-code text-code opacity-70 ${
              active ? 'bg-primary text-on-primary px-1 rounded' : 'group-hover:text-on-primary'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <span
        className={`font-label-sm text-label-sm font-semibold transition-colors ${
          active ? 'text-on-primary-fixed' : 'text-on-surface group-hover:text-on-primary'
        }`}
      >
        {title}
      </span>
    </button>
  );
};


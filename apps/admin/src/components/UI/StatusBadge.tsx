import React from 'react';
import type { ContentStatus } from '@cms/schemas';

interface StatusBadgeProps {
  status: ContentStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'published':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-xs text-label-xs font-semibold bg-surface-container-highest text-primary ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Published</span>
        </span>
      );
    case 'archived':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-xs text-label-xs font-medium bg-surface-container text-on-surface-variant ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant" />
          <span>Archived</span>
        </span>
      );
    case 'draft':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-xs text-label-xs font-medium bg-surface-container text-on-surface-variant ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
          <span>Draft</span>
        </span>
      );
  }
};

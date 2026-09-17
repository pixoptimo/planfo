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
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400"></span>
          Published
        </span>
      );
    case 'archived':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 ${className}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400"></span>
          Archived
        </span>
      );
    case 'draft':
    default:
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 ${className}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-400"></span>
          Draft
        </span>
      );
  }
};

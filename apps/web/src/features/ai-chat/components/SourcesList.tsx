'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import type { AiChatResponse } from '../types/ai-chat.types';

export function SourcesList({
  sources,
  title,
  showMore,
  showLess,
  scoreLabel,
}: {
  sources: NonNullable<AiChatResponse['sources']>;
  title: string;
  showMore: string;
  showLess: string;
  scoreLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? sources : sources.slice(0, 3);

  if (sources.length === 0) return null;

  return (
    <details className="mt-4 rounded-xl border border-outline-variant/40 bg-surface-container-low/60 p-3">
      <summary className="cursor-pointer list-none font-semibold text-on-surface">
        <span className="inline-flex items-center gap-2">
          <Icon name="source" size={18} className="text-primary" />
          {title} ({sources.length})
        </span>
      </summary>
      <ul className="mt-3 space-y-2">
        {visible.map((source, index) => (
          <li
            key={`${source.s3_key ?? source.source_file ?? source.title ?? 'source'}-${index}`}
            className="rounded-lg bg-surface px-3 py-2 text-body-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-on-surface">
                  {source.title ?? source.source_file ?? source.s3_key ?? source.type}
                </p>
                {source.source_file && (
                  <p className="truncate text-xs text-on-surface-variant">{source.source_file}</p>
                )}
              </div>
              {source.score !== undefined && (
                <span className="flex-shrink-0 text-xs text-outline">
                  {scoreLabel} {(source.score * 100).toFixed(1)}%
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      {sources.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 text-body-sm font-semibold text-primary hover:underline"
        >
          {expanded ? showLess : showMore}
        </button>
      )}
    </details>
  );
}

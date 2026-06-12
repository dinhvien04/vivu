'use client';

import Image from 'next/image';
import { Icon } from '@/components/icon';

export function ImagePreview({
  previewUrl,
  filename,
  removeLabel,
  onRemove,
}: {
  previewUrl: string;
  filename: string;
  removeLabel: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-outline-variant/50 bg-surface-container-low p-2">
      <div className="relative h-16 w-20 overflow-hidden rounded-lg bg-surface-container">
        <Image
          src={previewUrl}
          alt={filename}
          fill
          sizes="80px"
          className="object-cover"
          unoptimized
        />
      </div>
      <p className="min-w-0 flex-1 truncate text-body-sm text-on-surface">{filename}</p>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-error"
      >
        <Icon name="close" size={20} />
      </button>
    </div>
  );
}

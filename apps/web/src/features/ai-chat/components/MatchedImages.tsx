import Image from 'next/image';
import type { AiChatResponse } from '../types/ai-chat.types';

export function MatchedImages({
  images,
  title,
  scoreLabel,
}: {
  images: NonNullable<AiChatResponse['matched_images']>;
  title: string;
  scoreLabel: string;
}) {
  if (images.length === 0) return null;

  return (
    <section className="mt-4">
      <h4 className="mb-2 text-label-caps uppercase text-on-surface-variant">{title}</h4>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.slice(0, 6).map((image, index) => (
          <div
            key={`${image.s3_key ?? image.place_slug ?? 'image'}-${index}`}
            className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface"
          >
            {image.image_url ? (
              <div className="relative aspect-[4/3] bg-surface-container">
                <Image
                  src={image.image_url}
                  alt={image.location_name ?? 'AI match'}
                  fill
                  sizes="(max-width: 640px) 50vw, 220px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : null}
            <div className="p-2">
              <p className="truncate text-body-sm font-semibold text-on-surface">
                {image.location_name ?? image.s3_key ?? '—'}
              </p>
              {image.score !== undefined && (
                <p className="text-xs text-on-surface-variant">
                  {scoreLabel}: {(image.score * 100).toFixed(1)}%
                </p>
              )}
              {!image.image_url && image.s3_key && (
                <p className="mt-1 truncate text-xs text-outline">{image.s3_key}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

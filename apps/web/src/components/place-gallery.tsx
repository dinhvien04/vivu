'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from './icon';
import { transformCloudinary } from '../lib/image';
import type { Photo } from '@vivu/types';

interface PlaceGalleryProps {
  /** Cover image URL — used when `photos` is empty or as the first slide. */
  heroImageUrl: string | null;
  photos: Photo[];
  /** Used as the alt text fallback for slides without a caption. */
  title: string;
}

interface Slide {
  /** Stable id (photo id or `hero`). */
  id: string;
  url: string;
  alt: string;
}

const HERO_TRANSFORM = { width: 1600, height: 700 } as const;
const THUMB_TRANSFORM = { width: 240, height: 160 } as const;
const LIGHTBOX_TRANSFORM = { width: 1920, height: 1080, crop: 'fit' as const };

/**
 * Hero + thumbnail slider for place detail pages.
 *
 * - Renders a 16:7 hero image with previous/next arrows and dot indicators.
 * - Click any thumbnail to switch the active slide.
 * - Click the hero or hit Enter/Space to open a fullscreen lightbox.
 * - Keyboard: ArrowLeft/ArrowRight cycle slides, Escape closes the lightbox.
 *
 * No third-party slider dependency — simple state machine over the photo
 * array keeps bundle size small and avoids hydration mismatches.
 */
export function PlaceGallery({ heroImageUrl, photos, title }: PlaceGalleryProps) {
  const t = useTranslations('gallery');
  const slides = useMemo<Slide[]>(() => {
    const list: Slide[] = [];
    const seen = new Set<string>();
    if (heroImageUrl) {
      list.push({ id: 'hero', url: heroImageUrl, alt: title });
      seen.add(heroImageUrl);
    }
    for (const photo of photos) {
      if (seen.has(photo.url)) continue;
      seen.add(photo.url);
      list.push({ id: photo.id, url: photo.url, alt: photo.alt ?? title });
    }
    return list;
  }, [heroImageUrl, photos, title]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const total = slides.length;
  const safeIndex = total === 0 ? 0 : ((activeIndex % total) + total) % total;
  const current = slides[safeIndex];

  const goPrev = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((i) => (i + 1) % total);
  }, [total]);

  // Wire up keyboard navigation while the lightbox is open.
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, goPrev, goNext]);

  // Lock body scroll when lightbox is open.
  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  if (total === 0 || !current) {
    return (
      <div className="relative aspect-[16/7] overflow-hidden rounded-xl shadow-lg">
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-secondary-container to-surface-container-high text-primary">
          <span className="px-8 text-center font-h2 text-h2">{title}</span>
        </div>
      </div>
    );
  }

  const heroSrc = transformCloudinary(current.url, HERO_TRANSFORM) ?? current.url;
  const lightboxSrc = transformCloudinary(current.url, LIGHTBOX_TRANSFORM) ?? current.url;
  const showControls = total > 1;

  return (
    <>
      <div
        className="group relative aspect-[16/7] overflow-hidden rounded-xl shadow-lg"
        role={showControls ? 'group' : undefined}
        aria-roledescription={showControls ? 'carousel' : undefined}
        aria-label={showControls ? t('carouselAria', { title }) : undefined}
      >
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute inset-0 cursor-zoom-in"
          aria-label={t('openLargeAria', { alt: current.alt })}
        >
          <Image
            key={current.id}
            src={heroSrc}
            alt={current.alt}
            fill
            priority={safeIndex === 0}
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </button>

        {showControls && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label={t('prev')}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-surface/80 p-2 text-on-surface shadow-md backdrop-blur transition-opacity hover:bg-surface md:left-4"
            >
              <Icon name="chevron_left" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label={t('next')}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-surface/80 p-2 text-on-surface shadow-md backdrop-blur transition-opacity hover:bg-surface md:right-4"
            >
              <Icon name="chevron_right" />
            </button>

            <div className="absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-3 py-1 text-body-sm text-white backdrop-blur">
              {safeIndex + 1} / {total}
            </div>

            <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {slides.map((slide, i) => (
                <span
                  key={slide.id}
                  className={`h-1.5 rounded-full transition-all ${
                    i === safeIndex ? 'w-6 bg-white' : 'w-2 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showControls && (
        <ul className="mt-4 flex gap-3 overflow-x-auto pb-2" aria-label={t('thumbsAria')}>
          {slides.map((slide, i) => {
            const thumbSrc = transformCloudinary(slide.url, THUMB_TRANSFORM) ?? slide.url;
            const isActive = i === safeIndex;
            return (
              <li key={slide.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={t('viewThumbAria', { index: i + 1 })}
                  aria-current={isActive ? 'true' : undefined}
                  className={`relative block h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg border transition-all ${
                    isActive
                      ? 'border-primary ring-2 ring-primary/40'
                      : 'border-outline-variant hover:border-primary/60'
                  }`}
                >
                  <Image
                    src={thumbSrc}
                    alt={slide.alt}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxOpen(false);
          }}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label={t('close')}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <Icon name="close" />
          </button>
          {showControls && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label={t('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              >
                <Icon name="chevron_left" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label={t('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              >
                <Icon name="chevron_right" />
              </button>
            </>
          )}
          <div className="relative max-h-full max-w-6xl">
            <Image
              key={`lightbox-${current.id}`}
              src={lightboxSrc}
              alt={current.alt}
              width={1920}
              height={1080}
              sizes="100vw"
              className="max-h-[85vh] w-auto object-contain"
              unoptimized
            />
            {showControls && (
              <div className="mt-3 text-center text-body-sm text-white/80">
                {safeIndex + 1} / {total}
                {current.alt && current.alt !== title ? ` · ${current.alt}` : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

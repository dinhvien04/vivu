'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { Photo } from '@vivu/types';
import { HoverZoomImage } from './hover-zoom-image';
import { Icon } from './icon';
import { transformCloudinary } from '../lib/image';

interface PlaceGalleryProps {
  heroImageUrl: string | null;
  photos: Photo[];
  title: string;
}

interface Slide {
  id: string;
  url: string;
  alt: string;
}

interface LightboxPan {
  x: number;
  y: number;
}

const HERO_TRANSFORM = { width: 1600, height: 700 } as const;
const THUMB_TRANSFORM = { width: 240, height: 160 } as const;
const LIGHTBOX_TRANSFORM = { width: 1920, height: 1080, crop: 'fit' as const };
const LIGHTBOX_ZOOM_MIN = 1;
const LIGHTBOX_ZOOM_MAX = 3;
const LIGHTBOX_ZOOM_STEP = 0.25;

export function PlaceGallery({ heroImageUrl, photos, title }: PlaceGalleryProps) {
  const t = useTranslations('gallery');
  const [brokenSlideIds, setBrokenSlideIds] = useState<Set<string>>(() => new Set());
  const allSlides = useMemo<Slide[]>(() => {
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
  const slides = useMemo(
    () => allSlides.filter((slide) => !brokenSlideIds.has(slide.id)),
    [allSlides, brokenSlideIds],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState<LightboxPan>({ x: 0, y: 0 });
  const [isDraggingLightbox, setIsDraggingLightbox] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);
  const lightboxOpenerRef = useRef<HTMLElement | null>(null);
  const lightboxDragRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
  });

  const total = slides.length;
  const safeIndex = total === 0 ? 0 : ((activeIndex % total) + total) % total;
  const current = slides[safeIndex];

  const resetZoom = useCallback(() => {
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setIsDraggingLightbox(false);
  }, []);

  const markSlideBroken = useCallback((slideId: string) => {
    setBrokenSlideIds((current) => {
      if (current.has(slideId)) return current;
      const next = new Set(current);
      next.add(slideId);
      return next;
    });
  }, []);

  const goPrev = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((i) => (i + 1) % total);
  }, [total]);

  const zoomIn = useCallback(() => {
    setLightboxZoom((zoom) =>
      Math.min(LIGHTBOX_ZOOM_MAX, Number((zoom + LIGHTBOX_ZOOM_STEP).toFixed(2))),
    );
  }, []);

  const zoomOut = useCallback(() => {
    setLightboxZoom((zoom) => {
      const next = Math.max(LIGHTBOX_ZOOM_MIN, Number((zoom - LIGHTBOX_ZOOM_STEP).toFixed(2)));
      if (next === LIGHTBOX_ZOOM_MIN) setLightboxPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const openLightbox = useCallback(() => {
    resetZoom();
    setLightboxOpen(true);
  }, [resetZoom]);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const trapLightboxFocus = useCallback((event: KeyboardEvent) => {
    if (!lightboxRef.current) return;
    const focusable = Array.from(
      lightboxRef.current.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => {
      const disabled =
        element instanceof HTMLButtonElement ||
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
          ? element.disabled
          : false;
      return !disabled && element.getClientRects().length > 0;
    });
    if (focusable.length === 0) {
      event.preventDefault();
      lightboxRef.current.focus();
      return;
    }
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  const handleLightboxPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (lightboxZoom <= LIGHTBOX_ZOOM_MIN) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      lightboxDragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        panX: lightboxPan.x,
        panY: lightboxPan.y,
      };
      setIsDraggingLightbox(true);
    },
    [lightboxPan.x, lightboxPan.y, lightboxZoom],
  );

  const handleLightboxPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDraggingLightbox || lightboxDragRef.current.pointerId !== event.pointerId) return;
      event.preventDefault();
      setLightboxPan({
        x: lightboxDragRef.current.panX + event.clientX - lightboxDragRef.current.startX,
        y: lightboxDragRef.current.panY + event.clientY - lightboxDragRef.current.startY,
      });
    },
    [isDraggingLightbox],
  );

  const stopLightboxDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (lightboxDragRef.current.pointerId === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      lightboxDragRef.current.pointerId = -1;
    }
    setIsDraggingLightbox(false);
  }, []);

  const handleLightboxWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (event.deltaY < 0) zoomIn();
      else zoomOut();
    },
    [zoomIn, zoomOut],
  );

  useEffect(() => {
    resetZoom();
  }, [safeIndex, resetZoom]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      } else if (e.key === 'Tab') {
        trapLightboxFocus(e);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, closeLightbox, goPrev, goNext, resetZoom, trapLightboxFocus, zoomIn, zoomOut]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      lightboxCloseRef.current?.focus();
    }, 0);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      lightboxOpenerRef.current?.focus({ preventScroll: true });
      lightboxOpenerRef.current = null;
    };
  }, [lightboxOpen]);

  if (total === 0 || !current) {
    return (
      <div className="relative h-full min-h-[280px] overflow-hidden rounded-xl shadow-lg">
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-secondary-container to-surface-container-high text-primary">
          <span className="px-8 text-center font-h2 text-h2">{title}</span>
        </div>
      </div>
    );
  }

  const heroSrc = transformCloudinary(current.url, HERO_TRANSFORM) ?? current.url;
  const lightboxSrc = transformCloudinary(current.url, LIGHTBOX_TRANSFORM) ?? current.url;
  const showControls = total > 1;
  const lightbox =
    lightboxOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={lightboxRef}
            role="dialog"
            aria-modal="true"
            aria-label={current.alt}
            tabIndex={-1}
            data-testid="photo-lightbox"
            className="fixed inset-0 z-[1000] overflow-hidden bg-black/95 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeLightbox();
            }}
          >
            <button
              ref={lightboxCloseRef}
              type="button"
              onClick={closeLightbox}
              aria-label={t('close')}
              data-testid="photo-lightbox-close"
              className="absolute right-4 top-4 z-20 rounded-full bg-white/10 p-3 text-white shadow-lg ring-1 ring-white/10 transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/80"
            >
              <Icon name="close" />
            </button>

            {showControls && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label={t('prev')}
                  data-testid="photo-lightbox-prev"
                  className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white shadow-lg ring-1 ring-white/10 transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/80 sm:left-4"
                >
                  <Icon name="chevron_left" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label={t('next')}
                  data-testid="photo-lightbox-next"
                  className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white shadow-lg ring-1 ring-white/10 transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/80 sm:right-4"
                >
                  <Icon name="chevron_right" />
                </button>
              </>
            )}

            <div
              className={`absolute inset-x-4 bottom-24 top-16 flex touch-none items-center justify-center overflow-hidden sm:inset-x-20 ${
                lightboxZoom > LIGHTBOX_ZOOM_MIN
                  ? isDraggingLightbox
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : 'cursor-default'
              }`}
              onDoubleClick={() => {
                if (lightboxZoom > LIGHTBOX_ZOOM_MIN) resetZoom();
                else setLightboxZoom(2);
              }}
              onPointerDown={handleLightboxPointerDown}
              onPointerMove={handleLightboxPointerMove}
              onPointerUp={stopLightboxDrag}
              onPointerCancel={stopLightboxDrag}
              onWheel={handleLightboxWheel}
            >
              <Image
                key={`lightbox-${current.id}`}
                src={lightboxSrc}
                alt={current.alt}
                width={1920}
                height={1080}
                sizes="100vw"
                onError={() => markSlideBroken(current.id)}
                draggable={false}
                className="max-h-full max-w-full select-none object-contain transition-transform duration-150 ease-out"
                style={{
                  transform: `translate3d(${lightboxPan.x}px, ${lightboxPan.y}px, 0) scale(${lightboxZoom})`,
                }}
                unoptimized
              />
            </div>

            <div className="absolute bottom-5 left-1/2 z-20 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-950/80 px-2 py-1 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur">
              {showControls && (
                <span
                  data-testid="photo-lightbox-counter"
                  className="min-w-12 px-2 text-center text-sm font-semibold text-white/85"
                >
                  {safeIndex + 1}/{total}
                </span>
              )}
              {showControls && <span className="mx-1 h-6 w-px bg-white/15" />}
              <button
                type="button"
                onClick={zoomOut}
                disabled={lightboxZoom <= LIGHTBOX_ZOOM_MIN}
                aria-label={t('zoomOut')}
                className="rounded-full p-2 transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="zoom_out" />
              </button>
              <button
                type="button"
                onClick={resetZoom}
                aria-label={t('resetZoom')}
                data-testid="photo-lightbox-zoom"
                className="min-w-16 rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/80"
              >
                {Math.round(lightboxZoom * 100)}%
              </button>
              <button
                type="button"
                onClick={zoomIn}
                disabled={lightboxZoom >= LIGHTBOX_ZOOM_MAX}
                aria-label={t('zoomIn')}
                className="rounded-full p-2 transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="zoom_in" />
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        className="group relative h-full overflow-hidden rounded-xl shadow-lg"
        role={showControls ? 'group' : undefined}
        aria-roledescription={showControls ? 'carousel' : undefined}
        aria-label={showControls ? t('carouselAria', { title }) : undefined}
      >
        <button
          type="button"
          onClick={(event) => {
            lightboxOpenerRef.current = event.currentTarget;
            openLightbox();
          }}
          data-testid="gallery-open-image"
          className="absolute inset-0 cursor-zoom-in"
          aria-label={t('openLargeAria', { alt: current.alt })}
        >
          <HoverZoomImage
            key={current.id}
            src={heroSrc}
            alt={current.alt}
            fill
            onError={() => markSlideBroken(current.id)}
            priority={safeIndex === 0}
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
            zoomScale={1.28}
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
                    onError={() => markSlideBroken(slide.id)}
                    className="object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {lightbox}
    </>
  );
}

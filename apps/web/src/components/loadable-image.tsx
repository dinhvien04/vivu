'use client';

/* eslint-disable @next/next/no-img-element */
import type { ImgHTMLAttributes } from 'react';
import { useEffect, useRef, useState } from 'react';

type ImageStatus = 'loading' | 'loaded' | 'error';

interface LoadableImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'className' | 'src'> {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
}

export function LoadableImage({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  onLoad,
  onError,
  ...props
}: LoadableImageProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<ImageStatus>('loading');

  useEffect(() => {
    setStatus('loading');

    const image = imageRef.current;
    if (!image) return;

    if (image.complete) {
      setStatus(image.naturalWidth > 0 ? 'loaded' : 'error');
      return;
    }

    const timeout = window.setTimeout(() => {
      if (!image.complete) setStatus('error');
    }, 8000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [src]);

  const loaded = status === 'loaded';
  const failed = status === 'error';

  return (
    <span
      className={`relative block overflow-hidden bg-surface-container ${wrapperClassName}`}
      role={failed ? 'img' : undefined}
      aria-label={failed ? alt : undefined}
    >
      {!failed && (
        <img
          {...props}
          ref={imageRef}
          src={src}
          alt={alt}
          className={`${className} transition-[opacity,transform] duration-500 motion-reduce:transition-none ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={(event) => {
            setStatus('loaded');
            onLoad?.(event);
          }}
          onError={(event) => {
            setStatus('error');
            onError?.(event);
          }}
        />
      )}

      {!loaded && (
        <span
          className={`absolute inset-0 z-10 block ${
            failed
              ? 'bg-gradient-to-br from-surface-container-low via-surface-container to-primary-fixed/35'
              : 'animate-pulse bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-high'
          }`}
          aria-hidden="true"
        >
          <span className="absolute left-5 top-5 h-2.5 w-24 rounded-full bg-white/20 dark:bg-white/10" />
          <span className="absolute bottom-6 left-6 h-3 w-1/2 rounded-full bg-white/20 dark:bg-white/10" />
        </span>
      )}
    </span>
  );
}

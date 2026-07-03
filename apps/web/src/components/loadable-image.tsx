'use client';

/* eslint-disable @next/next/no-img-element */
import type { ImgHTMLAttributes } from 'react';
import { useEffect, useState } from 'react';
import { Icon } from './icon';

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
  const [status, setStatus] = useState<ImageStatus>('loading');

  useEffect(() => {
    setStatus('loading');
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
          className={`absolute inset-0 z-10 flex items-center justify-center ${
            failed
              ? 'bg-gradient-to-br from-surface-container-low via-surface-container to-primary-fixed/35'
              : 'animate-pulse bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-high'
          }`}
          aria-hidden="true"
        >
          <span className="absolute left-5 top-5 h-2.5 w-24 rounded-full bg-white/20 dark:bg-white/10" />
          <span className="absolute bottom-6 left-6 h-3 w-1/2 rounded-full bg-white/20 dark:bg-white/10" />
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest/80 text-primary shadow-sm backdrop-blur-sm">
            <Icon name={failed ? 'image_not_supported' : 'image'} size={24} />
          </span>
        </span>
      )}
    </span>
  );
}

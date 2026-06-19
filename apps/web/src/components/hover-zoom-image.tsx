'use client';

import Image, { type ImageProps } from 'next/image';
import type { CSSProperties, PointerEvent } from 'react';

type ZoomStyle = CSSProperties & {
  '--hover-zoom-scale'?: string;
};

interface HoverZoomImageProps extends ImageProps {
  zoomScale?: number;
  disabled?: boolean;
}

export function HoverZoomImage({
  alt,
  className = '',
  style,
  zoomScale = 1.22,
  disabled = false,
  ...props
}: HoverZoomImageProps) {
  const handlePointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (disabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.setProperty('--hover-zoom-origin', `${x}% ${y}%`);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLSpanElement>) => {
    if (disabled) return;
    event.currentTarget.style.setProperty('--hover-zoom-origin', '50% 50%');
  };

  const rootStyle: ZoomStyle = {
    '--hover-zoom-scale': String(zoomScale),
  };

  return (
    <span
      className="group/hover-zoom absolute inset-0 block overflow-hidden"
      style={rootStyle}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Image
        {...props}
        alt={alt}
        style={{
          ...style,
          transformOrigin: disabled ? style?.transformOrigin : 'var(--hover-zoom-origin, 50% 50%)',
        }}
        className={`${className} ${
          disabled
            ? ''
            : 'transition-transform duration-500 ease-out motion-reduce:transition-none group-hover/hover-zoom:scale-[var(--hover-zoom-scale)]'
        }`}
      />
    </span>
  );
}

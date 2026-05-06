import type { HTMLAttributes } from 'react';

interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  /** Optical size in px (Material Symbols `font-size`). */
  size?: number;
}

export function Icon({ name, className = '', size, style, ...rest }: IconProps) {
  const merged = size !== undefined ? { fontSize: `${size}px`, ...style } : style;
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={merged}
      {...rest}
    >
      {name}
    </span>
  );
}

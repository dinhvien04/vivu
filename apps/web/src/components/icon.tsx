import type { HTMLAttributes } from 'react';

interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
}

export function Icon({ name, className = '', ...rest }: IconProps) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined ${className}`} {...rest}>
      {name}
    </span>
  );
}

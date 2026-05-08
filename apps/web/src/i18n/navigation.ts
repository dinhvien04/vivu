import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware navigation primitives. Use these instead of the bare
 * `next/link` and `next/navigation` exports so URL prefixes are added/removed
 * automatically when the active locale changes.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

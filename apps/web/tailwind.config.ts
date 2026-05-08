import type { Config } from 'tailwindcss';

/**
 * Material Design 3 token palette for Vivu.
 * Color values resolve to CSS custom properties defined in `globals.css`,
 * so the same Tailwind utilities work in both light and dark mode.
 */
function token(name: string): string {
  return `rgb(var(--color-${name}) / <alpha-value>)`;
}

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Material Design 3 tokens (Vivu Discovery palette)
        surface: token('surface'),
        'surface-dim': token('surface-dim'),
        'surface-bright': token('surface-bright'),
        'surface-container-lowest': token('surface-container-lowest'),
        'surface-container-low': token('surface-container-low'),
        'surface-container': token('surface-container'),
        'surface-container-high': token('surface-container-high'),
        'surface-container-highest': token('surface-container-highest'),
        'surface-variant': token('surface-variant'),
        'surface-tint': token('surface-tint'),
        'on-surface': token('on-surface'),
        'on-surface-variant': token('on-surface-variant'),
        'inverse-surface': token('inverse-surface'),
        'inverse-on-surface': token('inverse-on-surface'),
        outline: token('outline'),
        'outline-variant': token('outline-variant'),
        primary: token('primary'),
        'on-primary': token('on-primary'),
        'primary-container': token('primary-container'),
        'on-primary-container': token('on-primary-container'),
        'inverse-primary': token('inverse-primary'),
        'primary-fixed': token('primary-fixed'),
        'primary-fixed-dim': token('primary-fixed-dim'),
        'on-primary-fixed': token('on-primary-fixed'),
        'on-primary-fixed-variant': token('on-primary-fixed-variant'),
        secondary: token('secondary'),
        'on-secondary': token('on-secondary'),
        'secondary-container': token('secondary-container'),
        'on-secondary-container': token('on-secondary-container'),
        'secondary-fixed': token('secondary-fixed'),
        'secondary-fixed-dim': token('secondary-fixed-dim'),
        'on-secondary-fixed': token('on-secondary-fixed'),
        'on-secondary-fixed-variant': token('on-secondary-fixed-variant'),
        tertiary: token('tertiary'),
        'on-tertiary': token('on-tertiary'),
        'tertiary-container': token('tertiary-container'),
        'on-tertiary-container': token('on-tertiary-container'),
        'tertiary-fixed': token('tertiary-fixed'),
        'tertiary-fixed-dim': token('tertiary-fixed-dim'),
        'on-tertiary-fixed': token('on-tertiary-fixed'),
        'on-tertiary-fixed-variant': token('on-tertiary-fixed-variant'),
        error: token('error'),
        'on-error': token('on-error'),
        'error-container': token('error-container'),
        'on-error-container': token('on-error-container'),
        background: token('background'),
        'on-background': token('on-background'),
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-be-vietnam-pro)', 'system-ui', 'sans-serif'],
        h1: ['var(--font-be-vietnam-pro)', 'system-ui', 'sans-serif'],
        h2: ['var(--font-be-vietnam-pro)', 'system-ui', 'sans-serif'],
        h3: ['var(--font-be-vietnam-pro)', 'system-ui', 'sans-serif'],
        'body-lg': ['var(--font-inter)', 'system-ui', 'sans-serif'],
        'body-md': ['var(--font-inter)', 'system-ui', 'sans-serif'],
        'label-caps': ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h1: ['48px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        h2: ['32px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
        h3: ['24px', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
        'label-caps': ['12px', { lineHeight: '1.0', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.25rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      spacing: {
        unit: '8px',
        gutter: '24px',
        'margin-mobile': '16px',
        'margin-desktop': '40px',
        'section-gap': '80px',
      },
      maxWidth: {
        'container-max': '1280px',
      },
      boxShadow: {
        premium: '0 4px 20px rgba(0, 102, 204, 0.15)',
        hover: '0 8px 30px rgba(0, 102, 204, 0.2)',
      },
    },
  },
  plugins: [],
};

export default config;

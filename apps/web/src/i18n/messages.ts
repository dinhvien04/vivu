/**
 * Lightweight in-app message dictionaries for the Vivu portal.
 *
 * We do not yet split routes into a `[locale]` segment, so this file is the
 * single source of truth for translatable UI strings. Keys are flat (no
 * nesting) to keep the type system simple. Add new keys here and reference
 * them via `useTranslations()` from `locale-provider.tsx`.
 */

export type Locale = 'vi' | 'en';

export const LOCALES = ['vi', 'en'] as const satisfies readonly Locale[];

export const LOCALE_LABEL: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
};

export const LOCALE_SHORT_LABEL: Record<Locale, string> = {
  vi: 'VI',
  en: 'EN',
};

export type MessageKey =
  // Navigation
  | 'nav.home'
  | 'nav.explore'
  | 'nav.map'
  | 'nav.search'
  | 'nav.qa'
  | 'nav.collections'
  | 'nav.account'
  // Common UI
  | 'common.signIn'
  | 'common.signOut'
  | 'common.signUp'
  | 'common.search'
  | 'common.openMenu'
  | 'common.closeMenu'
  | 'common.notifications'
  | 'common.toggleTheme.toLight'
  | 'common.toggleTheme.toDark'
  | 'common.toggleLocale'
  // Footer
  | 'footer.about'
  | 'footer.contact'
  | 'footer.terms'
  | 'footer.privacy'
  | 'footer.tagline'
  | 'footer.copyright';

const VI: Record<MessageKey, string> = {
  'nav.home': 'Trang chủ',
  'nav.explore': 'Khám phá',
  'nav.map': 'Bản đồ',
  'nav.search': 'Tìm kiếm',
  'nav.qa': 'Hỏi đáp',
  'nav.collections': 'Sổ tay',
  'nav.account': 'Tài khoản',
  'common.signIn': 'Đăng nhập',
  'common.signOut': 'Đăng xuất',
  'common.signUp': 'Đăng ký',
  'common.search': 'Tìm kiếm',
  'common.openMenu': 'Mở menu',
  'common.closeMenu': 'Đóng menu',
  'common.notifications': 'Thông báo',
  'common.toggleTheme.toLight': 'Chuyển sang giao diện sáng',
  'common.toggleTheme.toDark': 'Chuyển sang giao diện tối',
  'common.toggleLocale': 'Đổi ngôn ngữ',
  'footer.about': 'Giới thiệu',
  'footer.contact': 'Liên hệ',
  'footer.terms': 'Điều khoản',
  'footer.privacy': 'Chính sách bảo mật',
  'footer.tagline': 'Khám phá vẻ đẹp Việt Nam',
  'footer.copyright': '© {year} Vivu. Phi thương mại.',
};

const EN: Record<MessageKey, string> = {
  'nav.home': 'Home',
  'nav.explore': 'Explore',
  'nav.map': 'Map',
  'nav.search': 'Search',
  'nav.qa': 'Q & A',
  'nav.collections': 'Collections',
  'nav.account': 'Account',
  'common.signIn': 'Sign in',
  'common.signOut': 'Sign out',
  'common.signUp': 'Sign up',
  'common.search': 'Search',
  'common.openMenu': 'Open menu',
  'common.closeMenu': 'Close menu',
  'common.notifications': 'Notifications',
  'common.toggleTheme.toLight': 'Switch to light mode',
  'common.toggleTheme.toDark': 'Switch to dark mode',
  'common.toggleLocale': 'Change language',
  'footer.about': 'About',
  'footer.contact': 'Contact',
  'footer.terms': 'Terms',
  'footer.privacy': 'Privacy',
  'footer.tagline': 'Discover the beauty of Vietnam',
  'footer.copyright': '© {year} Vivu. Non-commercial.',
};

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = {
  vi: VI,
  en: EN,
};

/** Replace `{token}` placeholders with values from `params`. */
export function format(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Icon } from './icon';

export function SiteFooter() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-outline-variant bg-surface-container">
      <div className="mx-auto flex w-full max-w-container-max flex-col items-start justify-between gap-12 px-margin-mobile py-section-gap md:flex-row md:px-margin-desktop">
        <div className="max-w-sm space-y-4">
          <Link href="/" className="flex items-center" aria-label="Vivu">
            <Image
              src="/vivu-logo.png"
              alt="Vivu"
              width={708}
              height={274}
              className="h-8 w-auto object-contain"
            />
          </Link>
          <p className="font-sans leading-relaxed text-on-secondary-fixed-variant">
            {t('footer.tagline', { year })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3">
          <div className="space-y-4">
            <h5 className="text-label-caps font-bold text-primary">{t('footer.about')}</h5>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/kham-pha"
                  className="text-on-secondary-fixed-variant transition-colors hover:text-primary hover:underline"
                >
                  {t('nav.explore')}
                </Link>
              </li>
              <li>
                <Link
                  href="/ban-do"
                  className="text-on-secondary-fixed-variant transition-colors hover:text-primary hover:underline"
                >
                  {t('nav.map')}
                </Link>
              </li>
              <li>
                <Link
                  href="/lich-trinh"
                  className="text-on-secondary-fixed-variant transition-colors hover:text-primary hover:underline"
                >
                  {t('nav.tripPlanner')}
                </Link>
              </li>
              <li>
                <Link
                  href="/tu-van"
                  className="text-on-secondary-fixed-variant transition-colors hover:text-primary hover:underline"
                >
                  {t('footer.consulting')}
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-chat"
                  className="text-on-secondary-fixed-variant transition-colors hover:text-primary hover:underline"
                >
                  {t('nav.aiChat')}
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="text-label-caps font-bold text-primary">{t('footer.terms')}</h5>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-on-secondary-fixed-variant transition-colors hover:text-primary hover:underline"
                >
                  {t('footer.terms')}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-on-secondary-fixed-variant transition-colors hover:text-primary hover:underline"
                >
                  {t('footer.privacy')}
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="text-label-caps font-bold text-primary">{t('footer.contact')}</h5>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-on-secondary-fixed-variant transition-colors hover:text-primary hover:underline"
                >
                  {t('footer.contact')}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-container-max border-t border-outline-variant/30 px-margin-mobile py-8 text-center md:px-margin-desktop">
        <div className="mb-4 flex justify-center gap-6">
          <a
            href="#"
            aria-label="Facebook"
            className="text-on-secondary-fixed-variant transition-colors hover:text-primary"
          >
            <Icon name="public" />
          </a>
          <a
            href="#"
            aria-label="Instagram"
            className="text-on-secondary-fixed-variant transition-colors hover:text-primary"
          >
            <Icon name="photo_camera" />
          </a>
          <a
            href="#"
            aria-label="YouTube"
            className="text-on-secondary-fixed-variant transition-colors hover:text-primary"
          >
            <Icon name="smart_display" />
          </a>
        </div>
        <p className="text-[12px] text-outline">{t('footer.copyright', { year })}</p>
      </div>
    </footer>
  );
}

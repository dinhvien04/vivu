'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Icon } from './icon';

interface PlaceShareActionsProps {
  title: string;
  variant?: 'icon' | 'panel';
}

export function PlaceShareActions({ title, variant = 'panel' }: PlaceShareActionsProps) {
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const isEn = locale === 'en';
  const labels = {
    share: isEn ? 'Share' : 'Chia sẻ',
    facebook: isEn ? 'Share on Facebook' : 'Chia sẻ Facebook',
    zalo: isEn ? 'Copy link for Zalo' : 'Sao chép link để gửi Zalo',
    copy: isEn ? 'Copy link' : 'Sao chép link',
    copied: isEn ? 'Copied' : 'Đã sao chép',
  };

  const getUrl = () => window.location.href;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const shareFacebook = () => {
    const href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getUrl())}`;
    window.open(href, '_blank', 'noopener,noreferrer,width=720,height=640');
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={copyLink}
        aria-label={`${labels.share}: ${title}`}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg"
      >
        <Icon name={copied ? 'check' : 'share'} />
      </button>
    );
  }

  return (
    <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
      <h3 className="font-h4 text-h4 text-on-surface">{labels.share}</h3>
      <p className="mt-1 text-body-sm text-on-surface-variant">{title}</p>
      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={shareFacebook}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 font-bold text-on-surface transition-all hover:border-primary hover:text-primary"
        >
          <Icon name="public" className="!text-base" />
          {labels.facebook}
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 font-bold text-on-surface transition-all hover:border-primary hover:text-primary"
        >
          <Icon name={copied ? 'check' : 'chat'} className="!text-base" />
          {labels.zalo}
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-bold text-on-primary transition-colors hover:bg-primary/90"
        >
          <Icon name={copied ? 'check' : 'link'} className="!text-base" />
          {copied ? labels.copied : labels.copy}
        </button>
      </div>
    </section>
  );
}

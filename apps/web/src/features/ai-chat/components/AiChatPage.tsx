'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
import { placeTitle } from '@/i18n/place';
import type { Locale } from '@/i18n/routing';
import { getPlaceBySlug } from '@/lib/api';
import { useAiChat } from '../hooks/useAiChat';
import { ChatInput } from './ChatInput';
import { ChatMessages } from './ChatMessages';

export function AiChatPage({ placeSlug }: { placeSlug?: string }) {
  const t = useTranslations('aiChat');
  const locale = useLocale() as Locale;
  const [contextPlaceTitle, setContextPlaceTitle] = useState<string | null>(null);
  const { isSending, messages, sendMessage } = useAiChat(t('error'));
  const suggestions = [t('suggestion1'), t('suggestion2'), t('suggestion3'), t('suggestion4')];
  const contextQuestion = contextPlaceTitle
    ? t('placeContextQuestion', { place: contextPlaceTitle })
    : null;

  useEffect(() => {
    let cancelled = false;
    setContextPlaceTitle(null);
    if (!placeSlug) return;

    getPlaceBySlug(placeSlug)
      .then((place) => {
        if (!cancelled) setContextPlaceTitle(placeTitle(place, locale));
      })
      .catch(() => {
        if (!cancelled) setContextPlaceTitle(null);
      });

    return () => {
      cancelled = true;
    };
  }, [locale, placeSlug]);

  const messageLabels = {
    emptyTitle: t('emptyTitle'),
    emptyLead: t('emptyLead'),
    assistant: t('assistant'),
    thinking: t('thinking'),
    userImage: t('userImage'),
    places: t('places'),
    matchedImages: t('matchedImages'),
    sources: t('sources'),
    showMore: t('showMore'),
    showLess: t('showLess'),
    score: t('score'),
    detectedPlace: t('detectedPlace'),
    askFollowUp: t('askFollowUp'),
    lowConfidence: (place: string, score: string) => t('lowConfidence', { place, score }),
  };

  return (
    <div className="mx-auto w-full max-w-[900px] py-6 sm:py-10">
      <header className="mb-5 px-1 text-center sm:mb-8">
        <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full bg-primary-fixed px-4 py-2 text-primary">
          <Icon name="auto_awesome" size={18} />
          <span className="text-label-caps uppercase">{t('eyebrow')}</span>
        </div>
        <h1 className="font-h2 text-h2 text-on-surface">{t('title')}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-body-md text-on-surface-variant">
          {t('description')}
        </p>
      </header>

      <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-low shadow-premium">
        {contextPlaceTitle && contextQuestion && (
          <div className="border-b border-outline-variant/40 bg-primary-fixed/40 px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-label-caps uppercase tracking-wide text-primary">
                  {t('placeContextEyebrow')}
                </p>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {t('placeContextLead', { place: contextPlaceTitle })}
                </p>
              </div>
              <button
                type="button"
                disabled={isSending}
                onClick={() => void sendMessage({ message: contextQuestion })}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon name="auto_awesome" size={18} />
                {t('placeContextAsk')}
              </button>
            </div>
          </div>
        )}
        <ChatMessages
          messages={messages}
          isSending={isSending}
          suggestions={suggestions}
          onSuggestion={(question) => void sendMessage({ message: question })}
          labels={messageLabels}
        />
        <ChatInput
          isSending={isSending}
          onSend={sendMessage}
          labels={{
            placeholder: t('placeholder'),
            upload: t('upload'),
            send: t('send'),
            removeImage: t('removeImage'),
            invalidType: t('invalidType'),
            tooLarge: t('tooLarge'),
          }}
        />
      </section>
      <div className="mt-4 flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-xs text-outline">{t('disclaimer')}</p>
        <Link
          href="/tu-van?source=ai_chat"
          className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-body-sm font-semibold text-primary transition hover:bg-primary-fixed"
        >
          <Icon name="support_agent" size={17} />
          {locale === 'en' ? 'Need human help? Request consultation' : 'Cần người tư vấn? Gửi yêu cầu'}
        </Link>
      </div>
    </div>
  );
}

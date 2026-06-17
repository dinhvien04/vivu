'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icon';
import { useAiChat } from '../hooks/useAiChat';
import { ChatInput } from './ChatInput';
import { ChatMessages } from './ChatMessages';

export function AiChatWidget() {
  const t = useTranslations('aiChat');
  const [open, setOpen] = useState(false);
  const { isSending, messages, sendMessage } = useAiChat(t('error'));
  const suggestions = [t('suggestion1'), t('suggestion2'), t('suggestion3')];

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

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
    <>
      {open && (
        <section
          id="ai-chat-widget"
          role="dialog"
          aria-modal="false"
          aria-label={t('title')}
          className="fixed inset-x-3 bottom-24 z-[80] flex h-[min(620px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface shadow-2xl sm:left-auto sm:right-5 sm:w-[400px]"
        >
          <header className="flex items-center gap-3 border-b border-outline-variant/40 bg-primary px-4 py-3 text-on-primary">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-on-primary/15">
              <Icon name="travel_explore" size={23} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-bold">{t('assistant')}</h2>
              <p className="flex items-center gap-1.5 text-xs text-on-primary/80">
                <span className="h-2 w-2 rounded-full bg-green-300" />
                {t('online')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('close')}
              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-on-primary/15"
            >
              <Icon name="close" size={21} />
            </button>
          </header>

          <ChatMessages
            compact
            messages={messages}
            isSending={isSending}
            suggestions={suggestions}
            onSuggestion={(question) => void sendMessage({ message: question })}
            labels={messageLabels}
          />
          <ChatInput
            compact
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
          <p className="border-t border-outline-variant/30 px-4 py-2 text-center text-[10px] text-outline">
            {t('disclaimer')}
          </p>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? t('close') : t('open')}
        aria-expanded={open}
        aria-controls="ai-chat-widget"
        className="fixed bottom-5 right-5 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-premium transition hover:scale-105 hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-16 sm:w-16"
      >
        <Icon name={open ? 'close' : 'forum'} size={open ? 26 : 30} />
        {!open && (
          <span className="absolute right-0 top-0 h-4 w-4 rounded-full border-2 border-surface bg-green-500" />
        )}
      </button>
    </>
  );
}

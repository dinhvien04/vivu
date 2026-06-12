'use client';

import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icon';
import { useAiChat } from '../hooks/useAiChat';
import { ChatInput } from './ChatInput';
import { ChatMessages } from './ChatMessages';

export function AiChatPage() {
  const t = useTranslations('aiChat');
  const { isSending, messages, sendMessage } = useAiChat(t('error'));
  const suggestions = [t('suggestion1'), t('suggestion2'), t('suggestion3'), t('suggestion4')];

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
      <p className="mt-3 text-center text-xs text-outline">{t('disclaimer')}</p>
    </div>
  );
}

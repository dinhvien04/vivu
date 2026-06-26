'use client';

import { useEffect, useRef } from 'react';
import { Icon } from '@/components/icon';
import type { ChatMessage } from '../types/ai-chat.types';
import { ChatBubble } from './ChatBubble';

interface ChatMessagesProps {
  compact?: boolean;
  messages: ChatMessage[];
  isSending: boolean;
  suggestions: string[];
  onSuggestion: (question: string) => void;
  onFeedback?: (message: ChatMessage, value: 'helpful' | 'wrong' | 'missing_info') => void;
  labels: {
    emptyTitle: string;
    emptyLead: string;
    assistant: string;
    thinking: string;
    userImage: string;
    places: string;
    matchedImages: string;
    sources: string;
    showMore: string;
    showLess: string;
    score: string;
    detectedPlace: string;
    askFollowUp: string;
    feedbackHelpful: string;
    feedbackWrong: string;
    feedbackMissing: string;
    feedbackThanks: string;
    lowConfidence: (place: string, score: string) => string;
  };
}

export function ChatMessages({
  compact = false,
  messages,
  isSending,
  suggestions,
  onSuggestion,
  onFeedback,
  labels,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  return (
    <div
      className={`flex-1 overflow-y-auto ${
        compact ? 'min-h-0 space-y-4 px-3 py-4' : 'min-h-[420px] space-y-5 px-4 py-6 sm:px-6'
      }`}
    >
      {messages.length === 0 ? (
        <div
          className={`flex flex-col items-center justify-center text-center ${
            compact ? 'min-h-[310px]' : 'min-h-[380px]'
          }`}
        >
          <div
            className={`flex items-center justify-center rounded-full bg-primary-fixed text-primary shadow-premium ${
              compact ? 'mb-3 h-14 w-14' : 'mb-5 h-20 w-20'
            }`}
          >
            <Icon name="travel_explore" size={compact ? 29 : 40} />
          </div>
          <h2
            className={
              compact ? 'text-lg font-bold text-on-surface' : 'font-h3 text-h3 text-on-surface'
            }
          >
            {labels.emptyTitle}
          </h2>
          <p
            className={`mt-2 text-on-surface-variant ${
              compact ? 'max-w-xs text-sm' : 'max-w-lg text-body-md'
            }`}
          >
            {labels.emptyLead}
          </p>
          <div
            className={`grid w-full gap-2 ${compact ? 'mt-5' : 'mt-7 max-w-2xl sm:grid-cols-2'}`}
          >
            {suggestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => onSuggestion(question)}
                className={`rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-left text-on-surface transition hover:border-primary/50 hover:bg-primary-fixed ${
                  compact ? 'px-3 py-2.5 text-sm' : 'px-4 py-3 text-body-sm'
                }`}
              >
                <Icon name="auto_awesome" size={17} className="mr-2 align-middle text-primary" />
                {question}
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <ChatBubble key={message.id} message={message} labels={labels} onFeedback={onFeedback} />
        ))
      )}

      {isSending && (
        <div className={`flex items-start ${compact ? 'gap-2' : 'gap-3'}`}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
            <Icon name="travel_explore" size={20} />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-on-surface-variant">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
            <span className="ml-1 text-body-sm">{labels.thinking}</span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

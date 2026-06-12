'use client';

import { useEffect, useRef } from 'react';
import { Icon } from '@/components/icon';
import type { ChatMessage } from '../types/ai-chat.types';
import { ChatBubble } from './ChatBubble';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isSending: boolean;
  suggestions: string[];
  onSuggestion: (question: string) => void;
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
  };
}

export function ChatMessages({
  messages,
  isSending,
  suggestions,
  onSuggestion,
  labels,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  return (
    <div className="min-h-[420px] flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6">
      {messages.length === 0 ? (
        <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed text-primary shadow-premium">
            <Icon name="travel_explore" size={40} />
          </div>
          <h2 className="font-h3 text-h3 text-on-surface">{labels.emptyTitle}</h2>
          <p className="mt-2 max-w-lg text-body-md text-on-surface-variant">{labels.emptyLead}</p>
          <div className="mt-7 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
            {suggestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => onSuggestion(question)}
                className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 text-left text-body-sm text-on-surface transition hover:border-primary/50 hover:bg-primary-fixed"
              >
                <Icon name="auto_awesome" size={17} className="mr-2 align-middle text-primary" />
                {question}
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((message) => <ChatBubble key={message.id} message={message} labels={labels} />)
      )}

      {isSending && (
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
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

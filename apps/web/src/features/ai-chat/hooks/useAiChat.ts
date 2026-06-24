'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import { sendAiChatMessage } from '../services/ai-chat.api';
import type { AiChatResponse, ChatMessage } from '../types/ai-chat.types';

const SESSION_STORAGE_KEY = 'vivu.aiChat.sessionId';
const MESSAGES_STORAGE_KEY = 'vivu.aiChat.messages';

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSessionId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : createId('session');
}

function createStoredSessionId(): string {
  if (typeof window === 'undefined') return createSessionId();
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const next = createSessionId();
    window.localStorage.setItem(SESSION_STORAGE_KEY, next);
    return next;
  } catch {
    return createSessionId();
  }
}

function loadStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((message) => ({ ...message, imagePreviewUrl: undefined }));
  } catch {
    return [];
  }
}

function persistMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  const serializable = messages.slice(-40).map((message) => ({
    ...message,
    imagePreviewUrl: undefined,
  }));
  try {
    window.localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    /* Ignore unavailable storage. */
  }
}

function topPlaceSlug(response?: AiChatResponse): string | undefined {
  return (
    response?.matched_images?.find((image) => image.place_slug)?.place_slug ??
    response?.places?.find((place) => place.slug)?.slug
  );
}

function hasMissingContext(response: AiChatResponse): boolean {
  const answer = response.answer.toLocaleLowerCase('vi-VN');
  return (
    answer.includes('không đủ dữ liệu') ||
    answer.includes('chưa có đủ dữ liệu') ||
    answer.includes('khong du du lieu') ||
    (response.input_type !== 'image_only' && (!response.sources || response.sources.length === 0))
  );
}

export function useAiChat(errorMessage: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(createStoredSessionId);
  const previewUrls = useRef(new Set<string>());
  const hasSkippedInitialPersist = useRef(false);
  const hasTrackedStart = useRef(false);

  useEffect(() => {
    const urls = previewUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    setMessages(loadStoredMessages());
  }, []);

  useEffect(() => {
    if (!hasSkippedInitialPersist.current) {
      hasSkippedInitialPersist.current = true;
      return;
    }
    persistMessages(messages);
  }, [messages]);

  const sendMessage = useCallback(
    async (params: { message?: string; image?: File | null }) => {
      const content = params.message?.trim() ?? '';
      if ((!content && !params.image) || isSending) return;

      const previewUrl = params.image ? URL.createObjectURL(params.image) : undefined;
      if (previewUrl) previewUrls.current.add(previewUrl);

      setMessages((current) => [
        ...current,
        {
          id: createId('user'),
          role: 'user',
          content,
          imagePreviewUrl: previewUrl,
          createdAt: new Date().toISOString(),
        },
      ]);
      setIsSending(true);
      if (!hasTrackedStart.current) {
        hasTrackedStart.current = true;
        void trackAnalyticsEvent('ai_chat_started', {
          metadata: { hasImage: Boolean(params.image), hasText: Boolean(content) },
        });
      }

      try {
        const response = await sendAiChatMessage({
          message: content,
          image: params.image,
          sessionId,
        });
        const assistantId = createId('assistant');
        if (hasMissingContext(response)) {
          void trackAnalyticsEvent('ai_missing_context', {
            placeSlug: topPlaceSlug(response),
            metadata: {
              messageId: assistantId,
              inputType: response.input_type,
              hasImage: Boolean(params.image),
              hasText: Boolean(content),
              hasSources: Boolean(response.sources?.length),
            },
          });
        }
        setMessages((current) => [
          ...current,
          {
            id: assistantId,
            role: 'assistant',
            content: response.answer,
            response,
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        const detail = error instanceof Error ? error.message : '';
        setMessages((current) => [
          ...current,
          {
            id: createId('assistant-error'),
            role: 'assistant',
            content: detail ? `${errorMessage}\n${detail}` : errorMessage,
            createdAt: new Date().toISOString(),
            error: true,
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [errorMessage, isSending, sessionId],
  );

  const submitFeedback = useCallback(
    async (message: ChatMessage, value: 'helpful' | 'wrong' | 'missing_info') => {
      await trackAnalyticsEvent('ai_feedback_submitted', {
        placeSlug: topPlaceSlug(message.response),
        metadata: {
          value,
          messageId: message.id,
          inputType: message.response?.input_type,
          hasSources: Boolean(message.response?.sources?.length),
          hasMatchedImages: Boolean(message.response?.matched_images?.length),
        },
      });
    },
    [],
  );

  return { isSending, messages, sendMessage, submitFeedback };
}

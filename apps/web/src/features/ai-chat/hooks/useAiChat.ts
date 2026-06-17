'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { sendAiChatMessage } from '../services/ai-chat.api';
import type { ChatMessage } from '../types/ai-chat.types';

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

export function useAiChat(errorMessage: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(createStoredSessionId);
  const previewUrls = useRef(new Set<string>());
  const hasSkippedInitialPersist = useRef(false);

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

      try {
        const response = await sendAiChatMessage({
          message: content,
          image: params.image,
          sessionId,
        });
        setMessages((current) => [
          ...current,
          {
            id: createId('assistant'),
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

  return { isSending, messages, sendMessage };
}

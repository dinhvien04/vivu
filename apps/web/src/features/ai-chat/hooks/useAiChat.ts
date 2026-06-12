'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { sendAiChatMessage } from '../services/ai-chat.api';
import type { ChatMessage } from '../types/ai-chat.types';

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSessionId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : createId('session');
}

export function useAiChat(errorMessage: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(createSessionId);
  const previewUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = previewUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

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

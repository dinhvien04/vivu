import type { AiChatResponse } from '../types/ai-chat.types';

export async function sendAiChatMessage(params: {
  message?: string;
  image?: File | null;
  sessionId?: string;
}): Promise<AiChatResponse> {
  const formData = new FormData();

  if (params.message?.trim()) formData.append('message', params.message.trim());
  if (params.sessionId) formData.append('session_id', params.sessionId);
  if (params.image) formData.append('image', params.image);

  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Failed to send AI chat message');
  }

  return (await res.json()) as AiChatResponse;
}

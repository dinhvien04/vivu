import type { LeadSource } from '@vivu/types';

export interface CreateLeadInput {
  name: string;
  phoneOrZalo: string;
  email?: string;
  interestedPlaceSlug?: string;
  interestedPlaceName?: string;
  area?: string;
  travelDate?: string;
  peopleCount?: number;
  budget?: string;
  note?: string;
  source?: LeadSource;
  website?: string;
}

interface ErrorPayload {
  message?: string | string[];
  error?: string;
}

function pickMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const message = (payload as ErrorPayload).message;
    if (Array.isArray(message) && message.length > 0) return message[0]!;
    if (typeof message === 'string') return message;
    if (typeof (payload as ErrorPayload).error === 'string') return (payload as ErrorPayload).error!;
  }
  return fallback;
}

export async function createLead(input: CreateLeadInput, bearer?: string | null): Promise<void> {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* empty */
  }
  if (!res.ok) {
    throw new Error(pickMessage(payload, 'Khong gui duoc thong tin tu van.'));
  }
}

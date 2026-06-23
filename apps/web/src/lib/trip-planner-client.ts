import type { TripPlan, TripPlanOutput } from '@vivu/types';

export interface GenerateTripPlanInput {
  area: string;
  days: number;
  peopleCount?: number;
  transport?: string;
  interests?: string[];
  budget?: string;
  note?: string;
  locale?: 'vi' | 'en';
}

export interface GeneratedTripPlan {
  id: string;
  title: string;
  output: TripPlanOutput;
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

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateTripPlan(
  input: GenerateTripPlanInput,
  bearer?: string | null,
): Promise<GeneratedTripPlan> {
  const res = await fetch('/api/trip-plans/generate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(pickMessage(payload, 'Khong tao duoc lich trinh. Vui long thu lai.'));
  }
  const body = payload as { data?: GeneratedTripPlan };
  if (!body?.data) throw new Error('Khong tao duoc lich trinh.');
  return body.data;
}

export async function listTripPlans(bearer: string): Promise<TripPlan[]> {
  const res = await fetch('/api/trip-plans', {
    method: 'GET',
    headers: { authorization: `Bearer ${bearer}` },
    cache: 'no-store',
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(pickMessage(payload, 'Không tải được lịch trình của bạn.'));
  }
  return ((payload as { data?: TripPlan[] })?.data ?? []) as TripPlan[];
}

export async function saveTripPlanToCollection(
  id: string,
  bearer: string,
): Promise<{ id: string; name: string; itemsCount: number }> {
  const res = await fetch(`/api/trip-plans/${id}/save-to-collection`, {
    method: 'POST',
    headers: { authorization: `Bearer ${bearer}` },
    cache: 'no-store',
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(pickMessage(payload, 'Khong luu duoc lich trinh vao so tay.'));
  }
  const body = payload as { data?: { id: string; name: string; itemsCount: number } };
  if (!body.data) throw new Error('Khong luu duoc lich trinh vao so tay.');
  return body.data;
}

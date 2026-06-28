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
  shareId?: string | null;
  isPublic?: boolean;
}

export interface SharedTripPlanResult {
  id: string;
  title: string;
  shareId: string | null;
  isPublic: boolean;
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
    if (typeof (payload as ErrorPayload).error === 'string')
      return (payload as ErrorPayload).error!;
  }
  return fallback;
}

export class TripPlannerError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'TripPlannerError';
  }
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
    throw new TripPlannerError(
      pickMessage(payload, 'Không tạo được lịch trình. Vui lòng thử lại.'),
      res.status,
    );
  }
  const body = payload as { data?: GeneratedTripPlan };
  if (!body?.data) throw new TripPlannerError('Không tạo được lịch trình.', res.status);
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
    throw new Error(pickMessage(payload, 'Không lưu được lịch trình vào sổ tay.'));
  }
  const body = payload as { data?: { id: string; name: string; itemsCount: number } };
  if (!body.data) throw new Error('Không lưu được lịch trình vào sổ tay.');
  return body.data;
}

export async function shareTripPlan(id: string, bearer: string): Promise<SharedTripPlanResult> {
  const res = await fetch(`/api/trip-plans/${id}/share`, {
    method: 'POST',
    headers: { authorization: `Bearer ${bearer}` },
    cache: 'no-store',
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(pickMessage(payload, 'Không tạo được liên kết chia sẻ lịch trình.'));
  }
  const body = payload as { data?: SharedTripPlanResult };
  if (!body.data?.shareId) throw new Error('Không tạo được liên kết chia sẻ lịch trình.');
  return body.data;
}

export async function unshareTripPlan(id: string, bearer: string): Promise<SharedTripPlanResult> {
  const res = await fetch(`/api/trip-plans/${id}/unshare`, {
    method: 'POST',
    headers: { authorization: `Bearer ${bearer}` },
    cache: 'no-store',
  });
  const payload = await readJson(res);
  if (!res.ok) {
    throw new Error(pickMessage(payload, 'Không tắt được chia sẻ lịch trình.'));
  }
  const body = payload as { data?: SharedTripPlanResult };
  if (!body.data) throw new Error('Không tắt được chia sẻ lịch trình.');
  return body.data;
}

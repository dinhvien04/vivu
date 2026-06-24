import type { DataReportType } from '@vivu/types';

export interface CreateDataReportInput {
  placeSlug: string;
  type: DataReportType;
  message: string;
  contact?: string;
  website?: string;
  turnstileToken?: string;
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

export async function createDataReport(input: CreateDataReportInput): Promise<void> {
  const res = await fetch('/api/data-reports', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
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
    throw new Error(pickMessage(payload, 'Không gửi được báo lỗi dữ liệu.'));
  }
}

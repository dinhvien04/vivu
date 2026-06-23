type AnalyticsEventType =
  | 'place_view'
  | 'ai_chat_started'
  | 'trip_plan_generated'
  | 'lead_submitted'
  | 'search_performed'
  | 'nearby_clicked';

const SESSION_KEY = 'vivu.analytics.sessionId';

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSessionId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = createSessionId();
    window.localStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return undefined;
  }
}

export async function trackAnalyticsEvent(
  type: AnalyticsEventType,
  input: { placeSlug?: string; metadata?: Record<string, unknown>; bearer?: string | null } = {},
): Promise<void> {
  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(input.bearer ? { authorization: `Bearer ${input.bearer}` } : {}),
      },
      body: JSON.stringify({
        type,
        placeSlug: input.placeSlug,
        sessionId: getSessionId(),
        metadata: input.metadata,
      }),
      cache: 'no-store',
      keepalive: true,
    });
  } catch {
    /* Analytics must never block the product flow. */
  }
}

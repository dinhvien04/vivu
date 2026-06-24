export type AnalyticsEventType =
  | 'place_view'
  | 'ai_chat_started'
  | 'home_trip_planner_cta_clicked'
  | 'home_consulting_cta_clicked'
  | 'trip_planner_preset_clicked'
  | 'trip_plan_generate_clicked'
  | 'trip_plan_generated'
  | 'trip_plan_failed'
  | 'trip_plan_feedback_submitted'
  | 'trip_plan_missing_data'
  | 'trip_plan_shared'
  | 'trip_plan_copied'
  | 'ai_feedback_submitted'
  | 'ai_missing_context'
  | 'lead_submitted'
  | 'lead_form_submitted'
  | 'detail_consulting_clicked'
  | 'detail_report_clicked'
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

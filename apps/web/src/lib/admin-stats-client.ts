/** Client helpers for the Admin Stats endpoint. */

export interface AdminStats {
  totalPlaces: number;
  totalReviews: number;
  activeUsers: number;
  computedAt: string;
  totalTripPlans: number;
  totalLeads: number;
  aiRequestsToday: number;
  tripPlansToday: number;
  newLeads: number;
  planningLeads: number;
  newDataReports: number;
  resolvedDataReports7d: number;
  aiFeedbackIssues: number;
  missingContextEvents: number;
  leadsByStatus: Array<{ status: string; count: number }>;
  topPlacesViewed: Array<{ placeSlug: string; count: number }>;
  topLeadPlaces: Array<{ placeSlug: string; count: number }>;
  topSearchQueries: Array<{ query: string; count: number }>;
}

interface ErrorPayload {
  message?: string | string[];
}

function pickMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const m = (payload as ErrorPayload).message;
    if (Array.isArray(m) && m.length > 0) return m[0]!;
    if (typeof m === 'string') return m;
  }
  return fallback;
}

export async function getAdminStats(bearer: string): Promise<AdminStats> {
  const res = await fetch('/api/admin/stats', {
    method: 'GET',
    headers: { authorization: `Bearer ${bearer}` },
    cache: 'no-store',
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty */
  }
  if (!res.ok) {
    throw new Error(pickMessage(data, 'Không tải được thống kê'));
  }
  const payload = data as { data?: AdminStats };
  if (!payload || !payload.data) {
    throw new Error('Không tải được thống kê');
  }
  return payload.data;
}

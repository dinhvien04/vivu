/** Client helpers for the Q&A (Hỏi đáp) API. */
import type { Answer, Paginated, Question } from '@vivu/types';

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

async function fetchJson<T>(
  path: string,
  init: { method?: string; body?: unknown; bearer?: string } = {},
  fallback = 'Có lỗi xảy ra',
): Promise<T> {
  const headers: Record<string, string> = {};
  if (init.bearer) headers.authorization = `Bearer ${init.bearer}`;
  if (init.body !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(path, {
    method: init.method ?? 'GET',
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  if (res.status === 204) return undefined as T;
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) throw new Error(pickMessage(data, fallback));
  return data as T;
}

export interface ListQuestionsParams {
  page?: number;
  pageSize?: number;
  placeSlug?: string;
}

function toQuery(p: ListQuestionsParams): string {
  const usp = new URLSearchParams();
  if (p.page) usp.set('page', String(p.page));
  if (p.pageSize) usp.set('pageSize', String(p.pageSize));
  if (p.placeSlug) usp.set('placeSlug', p.placeSlug);
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export async function listQuestions(
  params: ListQuestionsParams = {},
): Promise<Paginated<Question>> {
  return fetchJson<Paginated<Question>>(
    `/api/questions${toQuery(params)}`,
    {},
    'Không tải được danh sách câu hỏi',
  );
}

export async function listQuestionsForPlace(
  idOrSlug: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<Paginated<Question>> {
  const usp = new URLSearchParams();
  if (params.page) usp.set('page', String(params.page));
  if (params.pageSize) usp.set('pageSize', String(params.pageSize));
  const qs = usp.toString() ? `?${usp.toString()}` : '';
  return fetchJson<Paginated<Question>>(
    `/api/places/${encodeURIComponent(idOrSlug)}/questions${qs}`,
    {},
    'Không tải được câu hỏi cho địa điểm',
  );
}

export async function getQuestion(id: string): Promise<Question> {
  const r = await fetchJson<{ data: Question }>(
    `/api/questions/${id}`,
    {},
    'Không tải được câu hỏi',
  );
  return r.data;
}

export async function createQuestion(
  idOrSlug: string,
  content: string,
  bearer: string,
): Promise<Question> {
  const r = await fetchJson<{ data: Question }>(
    `/api/places/${encodeURIComponent(idOrSlug)}/questions`,
    { method: 'POST', body: { content }, bearer },
    'Không gửi được câu hỏi',
  );
  return r.data;
}

export async function deleteQuestion(id: string, bearer: string): Promise<void> {
  await fetchJson<void>(
    `/api/questions/${id}`,
    { method: 'DELETE', bearer },
    'Không xoá được câu hỏi',
  );
}

export async function createAnswer(
  questionId: string,
  content: string,
  bearer: string,
): Promise<Answer> {
  const r = await fetchJson<{ data: Answer }>(
    `/api/questions/${questionId}/answers`,
    { method: 'POST', body: { content }, bearer },
    'Không gửi được câu trả lời',
  );
  return r.data;
}

export async function deleteAnswer(id: string, bearer: string): Promise<void> {
  await fetchJson<void>(
    `/api/answers/${id}`,
    { method: 'DELETE', bearer },
    'Không xoá được câu trả lời',
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Lead, LeadStatus } from '@vivu/types';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import {
  listAdminLeads,
  updateLeadNote,
  updateLeadStatus,
  type ListLeadsOptions,
} from '@/lib/admin-leads-client';

const STATUSES: Array<{ value: LeadStatus | ''; label: string }> = [
  { value: '', label: 'Tat ca' },
  { value: 'new', label: 'Moi' },
  { value: 'contacted', label: 'Da lien he' },
  { value: 'planning', label: 'Dang tu van' },
  { value: 'booked', label: 'Da chot' },
  { value: 'cancelled', label: 'Huy' },
  { value: 'spam', label: 'Spam' },
];

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value));
}

function statusClass(status: LeadStatus): string {
  switch (status) {
    case 'new':
      return 'bg-primary-fixed text-primary';
    case 'contacted':
      return 'bg-secondary-container text-on-secondary-container';
    case 'planning':
      return 'bg-tertiary-container/60 text-on-tertiary-container';
    case 'booked':
      return 'bg-green-100 text-green-700';
    case 'cancelled':
      return 'bg-surface-container text-on-surface-variant';
    case 'spam':
      return 'bg-error-container text-on-error-container';
  }
}

export function AdminLeadsPage() {
  const { getAccessToken, user } = useAuth();
  const [rows, setRows] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const opts = useMemo<ListLeadsOptions>(() => ({ status, q: q.trim() || undefined, pageSize: 50 }), [
    q,
    status,
  ]);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Thieu access token.');
        const data = await listAdminLeads(token, opts);
        if (!cancelled) {
          setRows(data.data);
          setTotal(data.meta.total);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Khong tai duoc lead.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken, opts, user]);

  const changeStatus = async (lead: Lead, nextStatus: LeadStatus) => {
    const token = await getAccessToken();
    if (!token) return;
    setSavingId(lead.id);
    try {
      const updated = await updateLeadStatus(token, lead.id, nextStatus);
      setRows((current) => current.map((row) => (row.id === lead.id ? updated : row)));
    } finally {
      setSavingId(null);
    }
  };

  const saveNote = async (lead: Lead, internalNote: string) => {
    const token = await getAccessToken();
    if (!token) return;
    setSavingId(lead.id);
    try {
      const updated = await updateLeadNote(token, lead.id, internalNote);
      setRows((current) => current.map((row) => (row.id === lead.id ? updated : row)));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-overline uppercase tracking-overline text-primary">CRM</p>
          <h1 className="mt-1 font-h2 text-h2 text-on-surface">Lead tu van</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Quan ly yeu cau tu van tu trang chi tiet, AI Chat va lich trinh AI.
          </p>
        </div>
        <div className="rounded-full bg-surface-container px-4 py-2 text-body-sm text-on-surface-variant">
          {total} lead
        </div>
      </header>

      <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-outline-variant/40 bg-surface p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Tim ten, phone/Zalo, dia danh..."
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as LeadStatus | '')}
          className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {STATUSES.map((item) => (
            <option key={item.value || 'all'} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </section>

      {error && (
        <div className="mb-5 rounded-xl border border-error/30 bg-error-container px-4 py-3 text-on-error-container">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-sm">
        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-xl bg-surface-container" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">Chua co lead phu hop.</div>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {rows.map((lead) => (
              <li key={lead.id} className="grid gap-4 p-5 lg:grid-cols-[1.1fr,1fr,260px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-on-surface">{lead.name}</h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                        lead.status,
                      )}`}
                    >
                      {lead.status}
                    </span>
                    <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs text-on-surface-variant">
                      {lead.source}
                    </span>
                  </div>
                  <p className="mt-2 text-body-sm text-on-surface-variant">
                    Phone/Zalo: <span className="font-semibold text-on-surface">{lead.phoneOrZalo}</span>
                  </p>
                  {lead.email && (
                    <p className="text-body-sm text-on-surface-variant">
                      Email: <span className="font-semibold text-on-surface">{lead.email}</span>
                    </p>
                  )}
                  <p className="mt-2 text-body-sm text-on-surface-variant">
                    Tao luc {formatDate(lead.createdAt)}
                  </p>
                </div>

                <div className="space-y-1 text-body-sm text-on-surface-variant">
                  <p>
                    Dia danh:{' '}
                    <span className="font-semibold text-on-surface">
                      {lead.interestedPlaceName ?? lead.interestedPlaceSlug ?? '-'}
                    </span>
                  </p>
                  <p>Khu vuc: {lead.area ?? '-'}</p>
                  <p>Ngay di: {formatDate(lead.travelDate)}</p>
                  <p>So nguoi: {lead.peopleCount ?? '-'}</p>
                  <p>Ngan sach: {lead.budget ?? '-'}</p>
                  {lead.note && <p className="mt-2 rounded-lg bg-surface-container p-2">{lead.note}</p>}
                </div>

                <div className="space-y-3">
                  <select
                    value={lead.status}
                    disabled={savingId === lead.id}
                    onChange={(event) => void changeStatus(lead, event.target.value as LeadStatus)}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 outline-none focus:border-primary"
                  >
                    {STATUSES.filter((item) => item.value).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    defaultValue={lead.internalNote ?? ''}
                    rows={3}
                    placeholder="Ghi chu noi bo..."
                    className="w-full resize-none rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 outline-none focus:border-primary"
                    onBlur={(event) => {
                      if (event.target.value !== (lead.internalNote ?? '')) {
                        void saveNote(lead, event.target.value);
                      }
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

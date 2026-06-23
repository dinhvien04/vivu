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
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      setSelectedLead((current) => (current?.id === lead.id ? updated : current));
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
      setSelectedLead((current) => (current?.id === lead.id ? updated : current));
    } finally {
      setSavingId(null);
    }
  };

  const copyContact = async (lead: Lead) => {
    try {
      await navigator.clipboard.writeText(lead.phoneOrZalo);
      setCopiedId(lead.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setError('Khong copy duoc phone/Zalo. Hay copy thu cong.');
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
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => void copyContact(lead)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-outline-variant px-3 py-2 text-body-sm font-semibold text-on-surface-variant hover:border-primary hover:text-primary"
                    >
                      <Icon name={copiedId === lead.id ? 'check' : 'content_copy'} size={16} />
                      {copiedId === lead.id ? 'Da copy' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLead(lead)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary-fixed px-3 py-2 text-body-sm font-semibold text-primary hover:bg-primary-fixed-dim"
                    >
                      <Icon name="visibility" size={16} />
                      Chi tiet
                    </button>
                  </div>
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

      {selectedLead && (
        <div className="fixed inset-0 z-[100] bg-scrim/50" onClick={() => setSelectedLead(null)}>
          <aside
            className="ml-auto flex h-full w-full max-w-xl flex-col bg-surface p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-overline uppercase tracking-overline text-primary">
                  Chi tiet lead
                </p>
                <h2 className="mt-1 font-h3 text-h3 text-on-surface">{selectedLead.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant"
                aria-label="Dong"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 text-body-md text-on-surface-variant">
              <div className="rounded-2xl bg-surface-container p-4">
                <p className="font-semibold text-on-surface">Phone/Zalo</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span>{selectedLead.phoneOrZalo}</span>
                  <button
                    type="button"
                    onClick={() => void copyContact(selectedLead)}
                    className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1.5 text-body-sm font-semibold text-primary"
                  >
                    <Icon name={copiedId === selectedLead.id ? 'check' : 'content_copy'} size={16} />
                    {copiedId === selectedLead.id ? 'Da copy' : 'Copy'}
                  </button>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Info label="Email" value={selectedLead.email ?? '-'} />
                <Info label="Nguon" value={selectedLead.source} />
                <Info label="Dia danh" value={selectedLead.interestedPlaceName ?? selectedLead.interestedPlaceSlug ?? '-'} />
                <Info label="Khu vuc" value={selectedLead.area ?? '-'} />
                <Info label="Ngay di" value={formatDate(selectedLead.travelDate)} />
                <Info label="So nguoi" value={selectedLead.peopleCount ? String(selectedLead.peopleCount) : '-'} />
                <Info label="Ngan sach" value={selectedLead.budget ?? '-'} />
                <Info label="Tao luc" value={formatDate(selectedLead.createdAt)} />
              </dl>

              {selectedLead.note && (
                <div>
                  <p className="mb-2 font-semibold text-on-surface">Ghi chu khach hang</p>
                  <div className="whitespace-pre-line rounded-2xl bg-surface-container p-4">
                    {selectedLead.note}
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-[180px,1fr]">
                <label className="block">
                  <span className="text-label-md font-semibold text-on-surface">Trang thai</span>
                  <select
                    value={selectedLead.status}
                    disabled={savingId === selectedLead.id}
                    onChange={(event) =>
                      void changeStatus(selectedLead, event.target.value as LeadStatus)
                    }
                    className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 outline-none focus:border-primary"
                  >
                    {STATUSES.filter((item) => item.value).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-label-md font-semibold text-on-surface">Ghi chu noi bo</span>
                  <textarea
                    defaultValue={selectedLead.internalNote ?? ''}
                    rows={5}
                    placeholder="Ghi chu noi bo..."
                    className="mt-2 w-full resize-none rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 outline-none focus:border-primary"
                    onBlur={(event) => {
                      if (event.target.value !== (selectedLead.internalNote ?? '')) {
                        void saveNote(selectedLead, event.target.value);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3">
      <dt className="text-xs uppercase tracking-wide text-outline">{label}</dt>
      <dd className="mt-1 font-semibold text-on-surface">{value}</dd>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icon';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Link, useRouter } from '@/i18n/navigation';
import {
  AuthError,
  changePassword as apiChangePassword,
  deleteAccount as apiDeleteAccount,
  updateProfile as apiUpdateProfile,
} from '@/lib/auth-client';

type Section = 'tai-khoan' | 'mat-khau' | 'thong-bao' | 'rieng-tu';

type SectionDef = { id: Section; labelKey: string; icon: string };

const SECTIONS: SectionDef[] = [
  { id: 'tai-khoan', labelKey: 'secAccount', icon: 'person' },
  { id: 'mat-khau', labelKey: 'secSecurity', icon: 'lock' },
  { id: 'thong-bao', labelKey: 'secNotifications', icon: 'notifications' },
  { id: 'rieng-tu', labelKey: 'secPrivacy', icon: 'shield' },
];

export default function CaiDatPage() {
  const t = useTranslations('account');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [section, setSection] = useState<Section>('tai-khoan');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/dang-nhap?next=/tai-khoan/cai-dat');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-margin-desktop">
          <div className="h-72 animate-pulse rounded-2xl bg-surface-container" />
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-container-max px-margin-mobile py-10 md:px-margin-desktop md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
          <aside>
            <h2 className="mb-1 font-h3 text-h3 text-primary">{t('settingsHeading')}</h2>
            <p className="mb-6 text-body-md text-on-surface-variant">{user.email}</p>
            <nav aria-label={t('settingsMenuAria')} className="flex flex-col gap-1">
              {SECTIONS.map((s) => {
                const active = s.id === section;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSection(s.id)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                      active
                        ? 'bg-secondary-container font-semibold text-on-secondary-container'
                        : 'text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <Icon name={s.icon} size={20} />
                    {t(s.labelKey)}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="space-y-8">
            <h1 className="font-h1 text-h1 text-on-surface">
              {t(SECTIONS.find((s) => s.id === section)?.labelKey ?? 'secAccount')}
            </h1>

            {section === 'tai-khoan' && <ProfileSection />}
            {section === 'mat-khau' && <SecuritySection />}
            {section === 'thong-bao' && <NotificationsSection />}
            {section === 'rieng-tu' && <PrivacySection />}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function SectionCard({
  title,
  description,
  children,
  tone,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  return (
    <section
      className={`rounded-2xl border bg-surface-container-lowest p-6 shadow-sm md:p-8 ${
        tone === 'danger'
          ? 'border-t-4 border-error/20 border-x-outline-variant border-b-outline-variant'
          : 'border-outline-variant'
      }`}
    >
      <h3 className="font-h3 text-h3 text-on-surface">{title}</h3>
      {description && <p className="mt-1 text-body-md text-on-surface-variant">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ProfileSection() {
  const t = useTranslations('account');
  const { user, getAccessToken, reloadUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    setBio(user.bio ?? '');
    setLocation(user.location ?? '');
    setAvatarUrl(user.avatarUrl ?? '');
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const token = await getAccessToken();
    if (!token) {
      setError(t('errSessionExpired'));
      return;
    }
    setSaving(true);
    try {
      await apiUpdateProfile(token, {
        name: name.trim(),
        bio: bio.trim(),
        location: location.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      await reloadUser();
      setSuccess(t('saveSuccess'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('saveFail'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SectionCard title={t('profileBasicTitle')} description={t('profileBasicDesc')}>
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <Field label={t('fieldEmail')} hint={t('fieldEmailHint')}>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface-variant"
            />
          </Field>
          <Field label={t('fieldName')}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label={t('fieldLocation')} className="md:col-span-1">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={120}
              placeholder={t('fieldLocationPlaceholder')}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label={t('fieldAvatar')} className="md:col-span-1">
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              maxLength={500}
              placeholder={t('fieldAvatarPlaceholder')}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label={t('fieldBio')} className="md:col-span-2">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder={t('fieldBioPlaceholder')}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-right text-body-sm text-on-surface-variant">{bio.length}/500</p>
          </Field>

          {error && (
            <div
              role="alert"
              className="md:col-span-2 rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
            >
              {error}
            </div>
          )}
          {success && (
            <div
              role="status"
              className="md:col-span-2 rounded-lg border border-primary/30 bg-primary-fixed px-4 py-3 text-body-md text-on-primary-fixed"
            >
              {success}
            </div>
          )}

          <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-on-primary transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
            >
              {saving ? t('saving') : t('btnSave')}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title={t('linkedTitle')} description={t('linkedDesc')}>
        <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm">
              <Icon name="account_circle" size={28} className="text-on-surface-variant" />
            </div>
            <div>
              <p className="font-semibold text-on-surface">{t('linkedGoogle')}</p>
              <p className="text-body-sm text-on-surface-variant">{t('linkedNotConnected')}</p>
            </div>
          </div>
          <button
            type="button"
            disabled
            className="font-semibold text-on-surface-variant disabled:opacity-50"
          >
            {t('comingSoon')}
          </button>
        </div>
      </SectionCard>
    </>
  );
}

function SecuritySection() {
  const t = useTranslations('account');
  const { getAccessToken } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirm) {
      setError(t('errPasswordMismatch'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('errPasswordTooShort'));
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      setError(t('errSessionExpired'));
      return;
    }
    setBusy(true);
    try {
      await apiChangePassword(token, currentPassword, newPassword);
      setSuccess(t('passwordChangedSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : t('passwordChangeFail'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SectionCard title={t('passwordChangeTitle')} description={t('passwordChangeDesc')}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label={t('fieldCurrentPassword')}>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label={t('fieldNewPassword')} hint={t('fieldNewPasswordHint')}>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label={t('fieldConfirmPassword')}>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </Field>
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
            >
              {error}
            </div>
          )}
          {success && (
            <div
              role="status"
              className="rounded-lg border border-primary/30 bg-primary-fixed px-4 py-3 text-body-md text-on-primary-fixed"
            >
              {success}
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-on-primary transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
            >
              {busy ? t('btnProcessing') : t('btnChangePassword')}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title={t('twoFactorTitle')} description={t('twoFactorDesc')}>
        <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <div>
            <p className="font-semibold text-on-surface">{t('twoFactorOff')}</p>
            <p className="text-body-sm text-on-surface-variant">{t('twoFactorOffDesc')}</p>
          </div>
          <button
            type="button"
            disabled
            aria-pressed="false"
            className="relative h-6 w-11 rounded-full bg-surface-container-highest disabled:opacity-50"
          >
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-surface-container-lowest shadow" />
          </button>
        </div>
        <p className="mt-3 text-overline tracking-overline text-on-surface-variant">
          {t('twoFactorSoon')}
        </p>
      </SectionCard>

      <LinkedAccountsCard />

      <DangerZone />
    </>
  );
}

function DangerZone() {
  const t = useTranslations('account');
  const { getAccessToken, logout } = useAuth();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirmDelete(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const token = await getAccessToken();
    if (!token) {
      setError(t('errSessionExpired'));
      return;
    }
    setBusy(true);
    try {
      await apiDeleteAccount(token, password);
      await logout();
      router.replace('/');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : t('deleteFail'));
      setBusy(false);
    }
  }

  return (
    <SectionCard tone="danger" title={t('dangerTitle')} description={t('dangerDesc')}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          type="button"
          disabled
          className="flex flex-col items-start gap-1 rounded-xl border border-outline-variant px-6 py-4 text-left transition-all hover:bg-surface-container-high disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2 font-semibold text-on-surface">
            <Icon name="download" size={18} />
            {t('exportMyData')}
          </span>
          <span className="text-body-sm text-on-surface-variant">{t('exportMyDataDesc')}</span>
        </button>

        <button
          type="button"
          onClick={() => setConfirming((v) => !v)}
          className="flex flex-col items-start gap-1 rounded-xl border border-error/30 px-6 py-4 text-left transition-all hover:bg-error/5"
        >
          <span className="inline-flex items-center gap-2 font-semibold text-error">
            <Icon name="delete_forever" size={18} />
            {t('deleteAccountBtn')}
          </span>
          <span className="text-body-sm text-on-surface-variant">{t('deleteAccountDesc')}</span>
        </button>
      </div>

      {confirming && (
        <form
          className="mt-6 space-y-4 rounded-xl border border-error/30 bg-error/5 p-6"
          onSubmit={onConfirmDelete}
        >
          <p className="text-body-md text-on-surface">
            {t('deleteConfirmIntro')} <strong>{t('deleteIrreversible')}</strong>
          </p>
          <Field label={t('fieldPassword')}>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-error focus:outline-none"
            />
          </Field>
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-error/40 bg-error-container px-4 py-3 text-body-md text-on-error-container"
            >
              {error}
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setPassword('');
                setError(null);
              }}
              className="rounded-lg border border-outline-variant px-6 py-3 font-semibold text-on-surface transition-colors hover:bg-surface-container"
            >
              {t('btnCancel')}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-error px-6 py-3 font-semibold text-on-error transition-all hover:bg-error/90 disabled:opacity-50"
            >
              {busy ? t('btnDeleting') : t('btnConfirmDelete')}
            </button>
          </div>
        </form>
      )}
    </SectionCard>
  );
}

function NotificationsSection() {
  const t = useTranslations('account');
  const rows = [
    { label: t('notifNewPlacesLabel'), desc: t('notifNewPlacesDesc') },
    { label: t('notifRepliesLabel'), desc: t('notifRepliesDesc') },
    { label: t('notifNewsletterLabel'), desc: t('notifNewsletterDesc') },
  ];
  return (
    <SectionCard title={t('notifTitle')} description={t('notifDesc')}>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4"
          >
            <div>
              <p className="font-semibold text-on-surface">{row.label}</p>
              <p className="text-body-sm text-on-surface-variant">{row.desc}</p>
            </div>
            <button
              type="button"
              disabled
              className="relative h-6 w-11 rounded-full bg-surface-container-highest disabled:opacity-50"
              aria-pressed="false"
            >
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-surface-container-lowest shadow" />
            </button>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function PrivacySection() {
  const t = useTranslations('account');
  const rows = [
    { label: t('privacyPublicProfileLabel'), desc: t('privacyPublicProfileDesc') },
    { label: t('privacyPublicCollectionsLabel'), desc: t('privacyPublicCollectionsDesc') },
    { label: t('privacyAllowTagLabel'), desc: t('privacyAllowTagDesc') },
  ];
  return (
    <>
      <SectionCard title={t('privacyTitle')} description={t('privacyDesc')}>
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4"
            >
              <div>
                <p className="font-semibold text-on-surface">{row.label}</p>
                <p className="text-body-sm text-on-surface-variant">{row.desc}</p>
              </div>
              <button
                type="button"
                disabled
                className="relative h-6 w-11 rounded-full bg-surface-container-highest disabled:opacity-50"
                aria-pressed="false"
              >
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-surface-container-lowest shadow" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center gap-2">
          <Link
            href="/dang-nhap"
            className="inline-flex items-center gap-2 text-body-md font-semibold text-error hover:underline"
          >
            <Icon name="logout" size={18} />
            {t('logoutAllDevices')}
          </Link>
        </div>
      </SectionCard>

      <ExportDataCard />
    </>
  );
}

function LinkedAccountsCard() {
  const t = useTranslations('account');
  const [hint, setHint] = useState<string | null>(null);

  return (
    <SectionCard title={t('linkedTitle')} description={t('linkedDesc')}>
      <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest">
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </span>
          <div>
            <p className="font-semibold text-on-surface">{t('linkedGoogle')}</p>
            <p className="text-body-sm text-on-surface-variant">{t('linkedNotConnected')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setHint(t('linkedSoon'));
            window.setTimeout(() => setHint(null), 4000);
          }}
          className="rounded-lg border border-outline-variant px-4 py-2 text-body-sm font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
        >
          {t('linkedConnect')}
        </button>
      </div>
      {hint && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 rounded-lg bg-surface-container-low px-3 py-2 text-body-sm text-on-surface-variant"
        >
          {hint}
        </p>
      )}
    </SectionCard>
  );
}

function ExportDataCard() {
  const t = useTranslations('account');
  const [hint, setHint] = useState<string | null>(null);

  return (
    <SectionCard title={t('exportTitle')} description={t('exportDesc')}>
      <ul className="space-y-2 text-body-md text-on-surface">
        <li className="flex items-start gap-2">
          <Icon name="check_circle" className="!text-base text-emerald-500 mt-0.5" />
          {t('exportItemReviews')}
        </li>
        <li className="flex items-start gap-2">
          <Icon name="check_circle" className="!text-base text-emerald-500 mt-0.5" />
          {t('exportItemCollections')}
        </li>
        <li className="flex items-start gap-2">
          <Icon name="check_circle" className="!text-base text-emerald-500 mt-0.5" />
          {t('exportItemFavorites')}
        </li>
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setHint(t('exportSoon'));
            window.setTimeout(() => setHint(null), 4000);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 font-semibold text-primary transition-colors hover:bg-primary-container/40"
        >
          <Icon name="file_download" className="!text-base" />
          {t('exportJson')}
        </button>
        <button
          type="button"
          onClick={() => {
            setHint(t('exportSoon'));
            window.setTimeout(() => setHint(null), 4000);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
        >
          <Icon name="table_view" className="!text-base" />
          {t('exportCsv')}
        </button>
      </div>
      {hint && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 rounded-lg bg-surface-container-low px-3 py-2 text-body-sm text-on-surface-variant"
        >
          {hint}
        </p>
      )}
    </SectionCard>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className ?? ''}`}>
      <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      {children}
      {hint && <span className="text-body-sm text-on-surface-variant">{hint}</span>}
    </label>
  );
}

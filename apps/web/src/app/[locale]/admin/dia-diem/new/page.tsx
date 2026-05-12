import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PlaceForm } from '@/components/admin/place-form';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { listCategories, listRegions } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<{ title: string }> {
  const t = await getTranslations({ locale: params.locale, namespace: 'admin' });
  return { title: t('newPlaceTitle') };
}

interface AdminPlaceNewProps {
  params: { locale: Locale };
}

export default async function AdminPlaceNew({ params }: AdminPlaceNewProps) {
  setRequestLocale(params.locale);
  const t = await getTranslations('admin');
  const [regions, categories] = await Promise.all([
    listRegions().catch(() => []),
    listCategories().catch(() => []),
  ]);

  return (
    <>
      <header className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link
            href="/admin/dia-diem"
            className="inline-flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary"
          >
            <Icon name="arrow_back" className="!text-base" />
            {t('placesList')}
          </Link>
          <h1 className="mt-2 font-h2 text-h2 text-on-surface">{t('newPlaceTitle')}</h1>
          <p className="mt-1 max-w-xl text-body-md text-on-surface-variant">{t('newPlaceLead')}</p>
        </div>
      </header>
      <PlaceForm mode="create" regions={regions} categories={categories} />
    </>
  );
}

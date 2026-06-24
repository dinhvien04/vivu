import type { Metadata } from 'next';
import { Icon } from '@/components/icon';
import { Link } from '@/i18n/navigation';
import { absoluteUrl } from '@/lib/site-url';
import type { TripPlanOutput } from '@vivu/types';

export const dynamic = 'force-dynamic';

interface SharedTripPlan {
  id: string;
  title: string;
  output: TripPlanOutput;
  shareId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: Promise<{ locale: string; shareId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareId } = await params;
  const plan = await getSharedTripPlan(shareId);
  return {
    title: plan ? `${plan.output.title} · Vivu` : 'Lịch trình chia sẻ · Vivu',
    description: plan?.output.summary ?? 'Lịch trình du lịch Gia Lai được chia sẻ từ Vivu.',
  };
}

async function getSharedTripPlan(shareId: string): Promise<SharedTripPlan | null> {
  const res = await fetch(absoluteUrl(`/api/trip-plans/shared/${shareId}`), {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const payload = (await res.json().catch(() => null)) as { data?: SharedTripPlan } | null;
  return payload?.data ?? null;
}

export default async function SharedTripPlanPage({ params }: PageProps) {
  const { locale, shareId } = await params;
  const plan = await getSharedTripPlan(shareId);
  const vi = locale !== 'en';

  if (!plan) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-container text-on-error-container">
          <Icon name="link_off" size={34} />
        </div>
        <h1 className="mt-5 font-h2 text-h2 text-on-surface">
          {vi ? 'Không tìm thấy lịch trình chia sẻ' : 'Shared itinerary not found'}
        </h1>
        <p className="mt-3 text-body-md text-on-surface-variant">
          {vi
            ? 'Liên kết có thể đã bị tắt hoặc không còn tồn tại.'
            : 'This link may have been disabled or no longer exists.'}
        </p>
        <Link
          href="/lich-trinh"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-on-primary"
        >
          <Icon name="route" size={18} />
          {vi ? 'Tạo lịch trình mới' : 'Create a new itinerary'}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm sm:p-8">
        <p className="text-overline uppercase tracking-overline text-primary">
          {vi ? 'Lịch trình chia sẻ' : 'Shared itinerary'}
        </p>
        <h1 className="mt-2 font-h1 text-h1 text-on-surface">{plan.output.title}</h1>
        <p className="mt-3 max-w-3xl text-body-lg text-on-surface-variant">
          {plan.output.summary}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/lich-trinh"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-on-primary"
          >
            <Icon name="auto_awesome" size={18} />
            {vi ? 'Tạo lịch trình AI' : 'Create AI itinerary'}
          </Link>
          <Link
            href="/tu-van?source=trip_planner"
            className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-5 py-3 font-semibold text-on-surface-variant hover:border-primary hover:text-primary"
          >
            <Icon name="support_agent" size={18} />
            {vi ? 'Nhờ Vivu tư vấn' : 'Ask Vivu for help'}
          </Link>
        </div>
      </header>

      <div className="mt-8 space-y-5">
        {plan.output.days.map((day) => (
          <section
            key={day.day}
            className="rounded-3xl border border-outline-variant/40 bg-surface p-5 shadow-sm sm:p-6"
          >
            <h2 className="font-h3 text-h3 text-on-surface">
              {vi ? 'Ngày' : 'Day'} {day.day}: {day.theme}
            </h2>
            <ol className="mt-4 space-y-4">
              {day.items.map((item, index) => (
                <li key={`${day.day}-${index}`} className="rounded-2xl bg-surface-container-lowest p-4">
                  <p className="text-overline uppercase tracking-overline text-primary">
                    {item.timeOfDay} · {item.suggestedDuration}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-on-surface">{item.placeName}</h3>
                  <p className="mt-2 text-body-md text-on-surface-variant">{item.reason}</p>
                  {item.travelNote && (
                    <p className="mt-3 rounded-xl bg-secondary-container/60 px-3 py-2 text-body-sm text-on-secondary-container">
                      {item.travelNote}
                    </p>
                  )}
                  {item.placeSlug && (
                    <Link
                      href={`/dia-diem/${item.placeSlug}`}
                      className="mt-3 inline-flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1.5 text-body-sm font-semibold text-primary"
                    >
                      {vi ? 'Xem địa danh' : 'View place'}
                      <Icon name="arrow_forward" size={16} />
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {(plan.output.generalTips.length > 0 || plan.output.missingDataNote) && (
        <aside className="mt-8 rounded-3xl border border-primary/20 bg-primary-fixed/30 p-5 sm:p-6">
          {plan.output.generalTips.length > 0 && (
            <>
              <h2 className="font-bold text-on-surface">
                {vi ? 'Lưu ý chung' : 'General tips'}
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-body-sm text-on-surface-variant">
                {plan.output.generalTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </>
          )}
          {plan.output.missingDataNote && (
            <p className="mt-4 text-body-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">
                {vi ? 'Ghi chú dữ liệu: ' : 'Data note: '}
              </span>
              {plan.output.missingDataNote}
            </p>
          )}
        </aside>
      )}
    </main>
  );
}

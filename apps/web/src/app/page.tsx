import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
      <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-wider text-slate-500">
        v0.0.0 — scaffold
      </span>
      <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900">
        Vivu <span className="text-brand-600">·</span> Du lịch Việt Nam
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Portal tra cứu địa điểm du lịch: khám phá theo vùng miền, chủ đề và mùa, kèm bản đồ tương
        tác và đánh giá cộng đồng. Không bán tour, không đặt phòng — chỉ là tra cứu thuần tuý.
      </p>
      <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        <Feature title="Tìm kiếm nhanh" desc="Typeahead, lọc theo vùng/loại/mùa." />
        <Feature title="Bản đồ tương tác" desc="POI cluster, lọc trực quan trên bản đồ." />
        <Feature title="Sổ tay cá nhân" desc="Lưu địa điểm, tạo collection, viết review." />
      </div>
      <Link
        href="/kham-pha"
        className="mt-10 inline-flex items-center rounded-full bg-brand-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
      >
        Bắt đầu khám phá →
      </Link>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
    </div>
  );
}

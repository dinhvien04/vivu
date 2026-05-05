export const metadata = { title: 'Khám phá' };

export default function KhamPhaPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Khám phá</h1>
      <p className="mt-2 text-slate-600">
        Trang khám phá sẽ liệt kê các chủ đề, vùng miền, và địa điểm nổi bật theo mùa.
      </p>
      <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
        TODO: kết nối API <code>/api/v1/places</code> và hiển thị danh sách có filter, search.
      </p>
    </main>
  );
}

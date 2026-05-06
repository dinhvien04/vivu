import { StatusPage } from '@/components/status-page';

export const metadata = {
  title: 'Đang bảo trì',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <StatusPage
      icon="construction"
      tone="warning"
      overline="Bảo trì"
      title="Đang bảo trì hệ thống"
      description={
        'Vivu đang được nâng cấp để mang đến trải nghiệm tốt hơn. Chúng tôi sẽ quay lại sớm nhất có thể — cảm ơn bạn đã kiên nhẫn.'
      }
      actions={[{ label: 'Tải lại trang', href: '/', variant: 'primary', icon: 'refresh' }]}
    >
      <dl className="mx-auto grid grid-cols-1 gap-4 rounded-2xl border border-outline-variant bg-surface-container/40 p-6 text-left sm:grid-cols-2">
        <div>
          <dt className="text-overline uppercase tracking-overline text-secondary">Trạng thái</dt>
          <dd className="mt-1 font-h4 text-h4 text-on-surface">Tạm ngoại tuyến</dd>
          <dd className="text-body-sm text-on-surface-variant">Đang cập nhật cơ sở dữ liệu</dd>
        </div>
        <div>
          <dt className="text-overline uppercase tracking-overline text-secondary">
            Dự kiến hoạt động lại
          </dt>
          <dd className="mt-1 font-h4 text-h4 text-primary">Trong vài giờ tới</dd>
          <dd className="text-body-sm text-on-surface-variant">Theo dõi cập nhật trên fanpage</dd>
        </div>
      </dl>
    </StatusPage>
  );
}

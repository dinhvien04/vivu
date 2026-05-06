import { StatusPage } from '@/components/status-page';

export const metadata = { title: '404 — Không tìm thấy trang' };

export default function NotFound() {
  return (
    <StatusPage
      icon="explore_off"
      tone="info"
      overline="Lỗi 404"
      title="Trang bạn tìm không tồn tại"
      description="Có vẻ như chuyến đi của bạn rẽ nhầm hướng. Đường dẫn có thể đã bị thay đổi hoặc địa điểm đã được lưu trữ."
      actions={[
        { label: 'Về trang chủ', href: '/', variant: 'primary', icon: 'home' },
        { label: 'Khám phá địa điểm', href: '/kham-pha', variant: 'secondary' },
      ]}
    />
  );
}

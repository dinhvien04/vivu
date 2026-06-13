import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vivu - Khám phá Gia Lai',
    short_name: 'Vivu',
    description: 'Tra cứu địa danh, hình ảnh và hỏi đáp du lịch Gia Lai bằng AI.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0061a4',
    icons: [
      {
        src: '/vivu-logo.png',
        sizes: '708x274',
        type: 'image/png',
      },
    ],
  };
}

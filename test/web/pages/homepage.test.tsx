import { render, screen } from '@testing-library/react';
import HomePage from '../../../apps/web/src/app/page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('HomePage', () => {
  beforeEach(() => {
    render(<HomePage />);
  });

  it('should render the main heading', () => {
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Vivu · Du lịch Việt Nam');
  });

  it('should render the tagline', () => {
    const tagline = screen.getByText(/Portal tra cứu địa điểm du lịch/);
    expect(tagline).toBeInTheDocument();
    expect(tagline).toHaveTextContent(
      'Portal tra cứu địa điểm du lịch: khám phá theo vùng miền, chủ đề và mùa, kèm bản đồ tương tác và đánh giá cộng đồng. Không bán tour, không đặt phòng — chỉ là tra cứu thuần tuý.'
    );
  });

  it('should render version badge', () => {
    const badge = screen.getByText('v0.0.0 — scaffold');
    expect(badge).toBeInTheDocument();
  });

  it('should render feature cards', () => {
    const features = [
      'Tìm kiếm nhanh',
      'Bản đồ tương tác', 
      'Sổ tay cá nhân'
    ];

    features.forEach(feature => {
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
  });

  it('should render feature descriptions', () => {
    expect(screen.getByText('Typeahead, lọc theo vùng/loại/mùa.')).toBeInTheDocument();
    expect(screen.getByText('POI cluster, lọc trực quan trên bản đồ.')).toBeInTheDocument();
    expect(screen.getByText('Lưu địa điểm, tạo collection, viết review.')).toBeInTheDocument();
  });

  it('should render CTA button with correct link', () => {
    const ctaButton = screen.getByRole('link', { name: /Bắt đầu khám phá/ });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', '/kham-pha');
  });

  it('should have proper semantic structure', () => {
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('mx-auto', 'flex', 'min-h-screen');
  });

  it('should render all feature cards in a grid', () => {
    const featureCards = screen.getAllByText(/Tìm kiếm nhanh|Bản đồ tương tác|Sổ tay cá nhân/);
    expect(featureCards).toHaveLength(3);
  });

  it('should have responsive classes', () => {
    const main = screen.getByRole('main');
    expect(main).toHaveClass('max-w-5xl', 'px-6', 'py-16');
  });

  it('should render brand dot separator', () => {
    const separator = screen.getByText('·');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('text-brand-600');
  });
});
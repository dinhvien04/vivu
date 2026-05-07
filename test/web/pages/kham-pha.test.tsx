import { render, screen } from '@testing-library/react';
import KhamPhaPage from '../../../apps/web/src/app/kham-pha/page';

describe('KhamPhaPage', () => {
  beforeEach(() => {
    render(<KhamPhaPage />);
  });

  it('should render the main heading', () => {
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Khám phá');
  });

  it('should render the description', () => {
    const description = screen.getByText(
      'Trang khám phá sẽ liệt kê các chủ đề, vùng miền, và địa điểm nổi bật theo mùa.'
    );
    expect(description).toBeInTheDocument();
  });

  it('should render TODO note', () => {
    const todoNote = screen.getByText(/TODO: kết nối API/);
    expect(todoNote).toBeInTheDocument();
    expect(todoNote).toHaveTextContent(
      'TODO: kết nối API /api/v1/places và hiển thị danh sách có filter, search.'
    );
  });

  it('should have proper semantic structure', () => {
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('mx-auto', 'max-w-5xl', 'px-6', 'py-16');
  });

  it('should render API endpoint in code format', () => {
    const codeElement = screen.getByText('/api/v1/places');
    expect(codeElement).toBeInTheDocument();
    expect(codeElement.tagName).toBe('CODE');
  });

  it('should have TODO note with proper styling', () => {
    const todoNote = screen.getByText(/TODO: kết nối API/);
    expect(todoNote).toHaveClass('rounded-lg', 'bg-slate-50', 'p-4', 'text-sm', 'text-slate-500');
  });

  it('should have responsive layout classes', () => {
    const main = screen.getByRole('main');
    expect(main).toHaveClass('mx-auto', 'max-w-5xl');
  });

  it('should render description with proper text color', () => {
    const description = screen.getByText(/Trang khám phá sẽ liệt kê/);
    expect(description).toHaveClass('text-slate-600');
  });

  it('should have proper heading styling', () => {
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('text-3xl', 'font-bold', 'text-slate-900');
  });
});
import { render } from '@testing-library/react';
import RootLayout from '../../apps/web/src/app/layout';

describe('RootLayout', () => {
  it('should render children correctly', () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;
    
    const { getByTestId } = render(
      <RootLayout>
        <TestChild />
      </RootLayout>
    );

    expect(getByTestId('test-child')).toBeInTheDocument();
    expect(getByTestId('test-child')).toHaveTextContent('Test Content');
  });

  it('should render html element with correct lang attribute', () => {
    const TestChild = () => <div>Test</div>;
    
    render(
      <RootLayout>
        <TestChild />
      </RootLayout>
    );

    const htmlElement = document.documentElement;
    expect(htmlElement).toHaveAttribute('lang', 'vi');
  });

  it('should render body element', () => {
    const TestChild = () => <div data-testid="body-content">Body Content</div>;
    
    render(
      <RootLayout>
        <TestChild />
      </RootLayout>
    );

    const bodyContent = document.querySelector('[data-testid="body-content"]');
    expect(bodyContent).toBeInTheDocument();
  });

  it('should have proper document structure', () => {
    const TestChild = () => <div>Content</div>;
    
    const { container } = render(
      <RootLayout>
        <TestChild />
      </RootLayout>
    );

    // Check that the layout renders the basic HTML structure
    expect(container.firstChild).toBeTruthy();
  });
});
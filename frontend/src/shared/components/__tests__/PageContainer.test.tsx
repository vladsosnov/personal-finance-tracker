import { render, screen } from '@/__tests__/test-utils';
import { PageContainer } from '../page-container';

describe('PageContainer', () => {
  it('renders children', () => {
    render(
      <PageContainer>
        <div>Test content</div>
      </PageContainer>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('wraps children in a Container', () => {
    const { container } = render(
      <PageContainer>
        <div>Test content</div>
      </PageContainer>
    );

    const containerElement = container.querySelector('[class*="Container"]');
    expect(containerElement).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <PageContainer>
        <div>First child</div>
        <div>Second child</div>
        <div>Third child</div>
      </PageContainer>
    );

    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
    expect(screen.getByText('Third child')).toBeInTheDocument();
  });
});

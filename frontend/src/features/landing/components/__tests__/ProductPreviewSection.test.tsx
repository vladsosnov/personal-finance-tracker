import { render, screen } from '@/__tests__/test-utils';
import { ProductPreviewSection } from '../ProductPreviewSection';

const mockIntersectionObserver = jest.fn().mockReturnValue({
  observe: () => null, unobserve: () => null, disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as any;

describe('ProductPreviewSection', () => {
  it('renders the section heading', () => {
    render(<ProductPreviewSection />);

    expect(screen.getByRole('heading', { level: 2, name: /built for real goal tracking/i })).toBeInTheDocument();
  });

  it('renders the Product preview label', () => {
    render(<ProductPreviewSection />);

    expect(screen.getByText('Product preview')).toBeInTheDocument();
  });

  it('renders product workflow list items', () => {
    render(<ProductPreviewSection />);

    expect(screen.getByText(/goal cards with drag and drop/i)).toBeInTheDocument();
    expect(screen.getByText(/operations log with edit/i)).toBeInTheDocument();
    expect(screen.getByText(/progress chart with filters/i)).toBeInTheDocument();
    expect(screen.getByText(/import flow, profile settings/i)).toBeInTheDocument();
  });

  it('renders dashboard and profile navigation buttons', () => {
    render(<ProductPreviewSection />);

    expect(screen.getByRole('link', { name: /view dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view profile/i })).toBeInTheDocument();
  });

  it('renders the dashboard preview image', () => {
    render(<ProductPreviewSection />);

    expect(screen.getByAltText(/dashboard demo/i)).toBeInTheDocument();
  });

  it('has proper accessibility with labelledby', () => {
    render(<ProductPreviewSection />);

    const section = screen.getByLabelText(/built for real goal tracking/i);
    expect(section.tagName).toBe('SECTION');
  });
});

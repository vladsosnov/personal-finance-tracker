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

  it('renders dashboard snapshot card', () => {
    render(<ProductPreviewSection />);

    expect(screen.getByText('Dashboard snapshot')).toBeInTheDocument();
    expect(screen.getByLabelText('Dashboard preview example')).toBeInTheDocument();
  });

  it('renders snapshot stat labels', () => {
    render(<ProductPreviewSection />);

    expect(screen.getByText('Active goals')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders emergency fund progress bar', () => {
    render(<ProductPreviewSection />);

    expect(screen.getByText('Emergency fund')).toBeInTheDocument();
    expect(screen.getByText('68.0%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /emergency fund progress/i })).toBeInTheDocument();
  });

  it('renders recent activity items', () => {
    render(<ProductPreviewSection />);

    expect(screen.getByText('Salary transfer')).toBeInTheDocument();
    expect(screen.getByText('+$500')).toBeInTheDocument();
    expect(screen.getByText('Unexpected expense')).toBeInTheDocument();
    expect(screen.getByText('-$80')).toBeInTheDocument();
  });

  it('has proper accessibility with labelledby', () => {
    render(<ProductPreviewSection />);

    const section = screen.getByLabelText(/built for real goal tracking/i);
    expect(section.tagName).toBe('SECTION');
  });
});

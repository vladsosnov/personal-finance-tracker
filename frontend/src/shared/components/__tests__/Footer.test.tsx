import { render, screen } from '@/__tests__/test-utils';
import { Footer } from '../footer';

describe('Footer', () => {
  it('renders footer text', () => {
    render(<Footer />);

    expect(screen.getByText(/Financial Goals Tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/Build goals, update progress, stay accountable/i)).toBeInTheDocument();
  });

  it('renders as footer element', () => {
    const { container } = render(<Footer />);

    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('app-footer');
  });

  it('centers text', () => {
    render(<Footer />);

    const text = screen.getByText(/Financial Goals Tracker/i);
    expect(text).toBeInTheDocument();
  });
});

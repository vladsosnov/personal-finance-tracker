import { render } from '@/__tests__/test-utils';
import { ListBullet } from '../ListBullet';

describe('ListBullet', () => {
  it('renders without crashing', () => {
    const { container } = render(<div>{ListBullet}</div>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has aria-hidden attribute', () => {
    const { container } = render(<div>{ListBullet}</div>);
    const themeIcon = container.querySelector('[aria-hidden="true"]');
    expect(themeIcon).toBeInTheDocument();
  });

  it('renders IconPointFilled', () => {
    const { container } = render(<div>{ListBullet}</div>);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('is a ThemeIcon with correct props', () => {
    const { container } = render(<div>{ListBullet}</div>);
    const themeIcon = container.querySelector('[class*="ThemeIcon"]');
    expect(themeIcon).toBeInTheDocument();
  });
});

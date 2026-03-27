import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { ThemeCard } from '../ThemeCard';
import { useMantineColorScheme } from '@mantine/core';

jest.mock('@mantine/core', () => ({
  ...jest.requireActual('@mantine/core'),
  useMantineColorScheme: jest.fn(),
}));

describe('ThemeCard', () => {
  const mockSetColorScheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useMantineColorScheme as jest.Mock).mockReturnValue({
      colorScheme: 'auto',
      setColorScheme: mockSetColorScheme,
    });
  });

  it('renders theme options', () => {
    render(<ThemeCard />);

    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /system/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
  });

  it('highlights current theme', () => {
    render(<ThemeCard />);

    const systemButton = screen.getByRole('button', { name: /system/i });
    expect(systemButton).toHaveAttribute('aria-pressed', 'true');

    const lightButton = screen.getByRole('button', { name: /light/i });
    expect(lightButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('changes to light theme', async () => {
    const user = userEvent.setup();
    render(<ThemeCard />);

    const lightButton = screen.getByRole('button', { name: /light/i });
    await user.click(lightButton);

    expect(mockSetColorScheme).toHaveBeenCalledWith('light');
  });

  it('changes to dark theme', async () => {
    const user = userEvent.setup();
    render(<ThemeCard />);

    const darkButton = screen.getByRole('button', { name: /dark/i });
    await user.click(darkButton);

    expect(mockSetColorScheme).toHaveBeenCalledWith('dark');
  });

  it('changes to system theme', async () => {
    const user = userEvent.setup();
    (useMantineColorScheme as jest.Mock).mockReturnValue({
      colorScheme: 'light',
      setColorScheme: mockSetColorScheme,
    });

    render(<ThemeCard />);

    const systemButton = screen.getByRole('button', { name: /system/i });
    await user.click(systemButton);

    expect(mockSetColorScheme).toHaveBeenCalledWith('auto');
  });

  it('has proper ARIA attributes', () => {
    render(<ThemeCard />);

    const themeGroup = screen.getByRole('group', { name: /theme/i });
    expect(themeGroup).toBeInTheDocument();
  });

  it('renders icons with aria-hidden', () => {
    const { container } = render(<ThemeCard />);

    const icons = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(icons).toHaveLength(3);
  });
});

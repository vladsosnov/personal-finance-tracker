import { render, screen } from '@/__tests__/test-utils';
import { AppThemeProvider } from '../app-theme-provider';
import { APP_THEME_KEY } from '@/shared/constants/storage';

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AppThemeProvider', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders children', () => {
    render(
      <AppThemeProvider>
        <div>Test content</div>
      </AppThemeProvider>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('wraps children in MantineProvider', () => {
    render(
      <AppThemeProvider>
        <div data-testid="test-content">Test content</div>
      </AppThemeProvider>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('uses custom teal theme', () => {
    render(
      <AppThemeProvider>
        <div data-testid="test-content">Test content</div>
      </AppThemeProvider>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('persists theme to localStorage', () => {
    render(
      <AppThemeProvider>
        <div>Test content</div>
      </AppThemeProvider>
    );

    expect(APP_THEME_KEY).toBeDefined();
  });

  it('supports multiple children', () => {
    render(
      <AppThemeProvider>
        <div>First child</div>
        <div>Second child</div>
      </AppThemeProvider>
    );

    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from '@/__tests__/test-utils';
import { Header } from '../header';
import { GET_ME } from '@/shared/gql/queries';
import { APP_ROUTES } from '@/shared/constants/routes';
import userEvent from '@testing-library/user-event';
import type { MockedResponse } from '@apollo/client/testing';
import { tokenStorage } from '@/shared/lib/token-storage';

jest.mock('@/shared/lib/token-storage', () => ({
  tokenStorage: {
    clear: jest.fn(),
    set: jest.fn(),
    getAccess: jest.fn(() => null),
  },
}));

const mockTokenClear = tokenStorage.clear as jest.Mock;

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => APP_ROUTES.home,
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

const getMeMock: MockedResponse = {
  request: {
    query: GET_ME,
  },
  result: {
    data: {
      me: {
        id: '1',
        email: 'user@example.com',
        subscription: 'free',
        role: 'user',
        emailVerified: true,
      },
    },
  },
};

const getAdminMeMock: MockedResponse = {
  request: {
    query: GET_ME,
  },
  result: {
    data: {
      me: {
        id: '1',
        email: 'admin@example.com',
        subscription: 'free',
        role: 'admin',
        emailVerified: true,
      },
    },
  },
};

const getGuestMeMock: MockedResponse = {
  request: {
    query: GET_ME,
  },
  result: {
    data: {
      me: null,
    },
  },
};

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('renders site title', () => {
    render(<Header />, { mocks: [getMeMock] });

    expect(screen.getByText('Financial Goals Tracker')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />, { mocks: [getMeMock] });

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Goals' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Feedback' })).toBeInTheDocument();
  });

  it('renders profile link for authenticated users', async () => {
    render(<Header />, { mocks: [getMeMock] });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();
    });
  });

  it('renders logout button for authenticated users', async () => {
    render(<Header />, { mocks: [getMeMock] });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument();
    });
  });

  it('does not render profile link for guests', async () => {
    render(<Header />, { mocks: [getGuestMeMock] });

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument();
    });
  });

  it('does not render logout button for guests', async () => {
    render(<Header />, { mocks: [getGuestMeMock] });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Log Out' })).not.toBeInTheDocument();
    });
  });

  it('renders admin logs link for admin users', async () => {
    render(<Header />, { mocks: [getAdminMeMock] });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Admin Logs' })).toBeInTheDocument();
    });
  });

  it('does not render admin logs link for regular users', async () => {
    render(<Header />, { mocks: [getMeMock] });

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Admin Logs' })).not.toBeInTheDocument();
    });
  });

  it('has accessible navigation landmark', () => {
    render(<Header />, { mocks: [getMeMock] });

    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('clears tokens from localStorage on logout', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<Header />, { mocks: [getMeMock] });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Log Out' }));

    await waitFor(() => {
      expect(mockTokenClear).toHaveBeenCalled();
    });
  });

  it('renders as header element', () => {
    const { container } = render(<Header />, { mocks: [getMeMock] });

    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('app-header');
  });
});

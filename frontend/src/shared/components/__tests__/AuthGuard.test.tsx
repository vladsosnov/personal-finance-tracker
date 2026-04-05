import { waitFor } from '@testing-library/react';
import { render } from '@/__tests__/test-utils';
import { AuthGuard } from '../auth-guard';
import { GET_ME } from '@/shared/gql/queries';
import type { MockedResponse } from '@apollo/client/testing';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: () => ({ replace: mockReplace }),
}));

import { usePathname } from 'next/navigation';
const mockUsePathname = usePathname as jest.Mock;

const authedMock: MockedResponse = {
  request: { query: GET_ME },
  result: { data: { me: { id: '1' } } },
};

const unauthedMock: MockedResponse = {
  request: { query: GET_ME },
  result: { data: { me: null } },
};

beforeEach(() => {
  mockReplace.mockClear();
});

describe('AuthGuard', () => {
  it('renders children', () => {
    mockUsePathname.mockReturnValue('/');
    const { getByText } = render(
      <AuthGuard><div>content</div></AuthGuard>,
      { mocks: [unauthedMock] }
    );
    expect(getByText('content')).toBeInTheDocument();
  });

  it('redirects unauthenticated user from protected path to /auth', async () => {
    mockUsePathname.mockReturnValue('/goals');
    render(<AuthGuard><div>content</div></AuthGuard>, { mocks: [unauthedMock] });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth'));
  });

  it('redirects authenticated user from /auth to /goals', async () => {
    mockUsePathname.mockReturnValue('/auth');
    render(<AuthGuard><div>content</div></AuthGuard>, { mocks: [authedMock] });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/goals'));
  });

  it('does not redirect authenticated user on protected path', async () => {
    mockUsePathname.mockReturnValue('/goals');
    render(<AuthGuard><div>content</div></AuthGuard>, { mocks: [authedMock] });
    await waitFor(() => expect(mockReplace).not.toHaveBeenCalled());
  });

  it('does not redirect unauthenticated user on public path', async () => {
    mockUsePathname.mockReturnValue('/');
    render(<AuthGuard><div>content</div></AuthGuard>, { mocks: [unauthedMock] });
    await waitFor(() => expect(mockReplace).not.toHaveBeenCalled());
  });

  it('allows unauthenticated user on bypass paths', async () => {
    for (const path of ['/auth/verify-email', '/auth/forgot-password', '/auth/reset-password']) {
      mockReplace.mockClear();
      mockUsePathname.mockReturnValue(path);
      render(<AuthGuard><div>content</div></AuthGuard>, { mocks: [unauthedMock] });
      await waitFor(() => expect(mockReplace).not.toHaveBeenCalled());
    }
  });

  it('redirects unauthenticated user from /profile to /auth', async () => {
    mockUsePathname.mockReturnValue('/profile');
    render(<AuthGuard><div>content</div></AuthGuard>, { mocks: [unauthedMock] });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth'));
  });
});

import { waitFor } from '@testing-library/react';
import { render } from '@/__tests__/test-utils';
import { AuthGuard } from '../auth-guard';
import { GET_ME } from '@/shared/gql/queries';
import type { MockedResponse } from '@apollo/client/testing';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
  useRouter: () => ({ replace: mockReplace }),
}));

import { usePathname, useSearchParams } from 'next/navigation';
const mockUsePathname = usePathname as jest.Mock;
const mockUseSearchParams = useSearchParams as jest.Mock;

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
  mockUseSearchParams.mockReturnValue({
    get: () => null,
    toString: () => '',
  });
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
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth?next=%2Fgoals'));
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
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth?next=%2Fprofile'));
  });

  it('redirects unauthenticated user from /expenses to /auth', async () => {
    mockUsePathname.mockReturnValue('/expenses');
    render(<AuthGuard><div>content</div></AuthGuard>, { mocks: [unauthedMock] });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth?next=%2Fexpenses'));
  });

  it('preserves query params when redirecting protected upgrade routes to auth', async () => {
    mockUsePathname.mockReturnValue('/profile');
    mockUseSearchParams.mockReturnValue({
      get: () => null,
      toString: () => 'upgrade=pro',
    });

    render(<AuthGuard><div>content</div></AuthGuard>, { mocks: [unauthedMock] });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth?next=%2Fprofile%3Fupgrade%3Dpro'));
  });

  it('redirects authenticated user from /auth to next when present', async () => {
    mockUsePathname.mockReturnValue('/auth');
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => key === 'next' ? '/profile?upgrade=pro' : null,
      toString: () => 'next=%2Fprofile%3Fupgrade%3Dpro',
    });

    render(<AuthGuard><div>content</div></AuthGuard>, { mocks: [authedMock] });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/profile?upgrade=pro'));
  });
});

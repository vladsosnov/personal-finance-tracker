import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockedResponse } from '@apollo/client/testing';
import { MantineProvider } from '@mantine/core';

interface WrapperProps {
  children: React.ReactNode;
  mocks?: readonly MockedResponse[];
}

function TestProviders({ children, mocks = [] }: WrapperProps) {
  return (
    <MockedProvider mocks={mocks}>
      <MantineProvider>{children}</MantineProvider>
    </MockedProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  mocks?: readonly MockedResponse[];
}

export function renderWithProviders(
  ui: ReactElement,
  { mocks = [], ...renderOptions }: CustomRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => <TestProviders mocks={mocks}>{children}</TestProviders>,
    ...renderOptions,
  });
}

export * from '@testing-library/react';
export { renderWithProviders as render };

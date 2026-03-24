"use client";

import { ApolloProvider } from "@apollo/client/react";
import { ToastViewport } from "@/shared/components/toast-viewport";
import { apolloClient } from "@/shared/lib/apollo-client";

type ProvidersProps = {
  children: React.ReactNode;
};

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
      <ToastViewport />
    </ApolloProvider>
  );
};

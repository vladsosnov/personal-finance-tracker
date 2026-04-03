"use client";

import { ApolloProvider } from "@apollo/client/react";
import { ToastViewport } from "@/shared/components/toast-viewport";
import { AuthGuard } from "@/shared/components/auth-guard";
import { apolloClient } from "@/shared/lib/apollo-client";

type ProvidersProps = {
  children: React.ReactNode;
};

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthGuard>
        {children}
      </AuthGuard>
      <ToastViewport />
    </ApolloProvider>
  );
};

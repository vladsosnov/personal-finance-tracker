"use client";

import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, Observable } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { API_BASE_URL } from "@/shared/constants/auth";
import { GET_ME } from "@/shared/gql/queries";
import { tokenStorage } from "@/shared/lib/token-storage";

const graphQLEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? `${API_BASE_URL}/graphql`;

const httpLink = new HttpLink({
  uri: graphQLEndpoint,
  credentials: "include",
});

// Attach Bearer token from localStorage when available (cross-site environments
// where cookies are blocked by Safari ITP / mobile browsers).
const authLink = new ApolloLink((operation, forward) => {
  const token = tokenStorage.getAccess();
  if (token) {
    operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
      headers: { ...headers, authorization: `Bearer ${token}` },
    }));
  }
  return forward(operation);
});

const clearFallbackTokens = () => {
  tokenStorage.clear();
};

const refreshSession = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    clearFallbackTokens();
    throw new Error("Session refresh failed");
  }

  const data = (await response.json().catch(() => null)) as { accessToken?: string; refreshToken?: string } | null;
  if (data?.accessToken) {
    tokenStorage.set(data.accessToken);
    return;
  }

  clearFallbackTokens();
  throw new Error("Session refresh failed");
};

let inflightRefresh: Promise<void> | null = null;

const deduplicatedRefresh = () => {
  if (!inflightRefresh) {
    inflightRefresh = refreshSession().finally(() => { inflightRefresh = null; });
  }
  return inflightRefresh;
};

// eslint-disable-next-line prefer-const
let apolloClient: ApolloClient;

const errorLink = new ErrorLink(({ error, operation, forward }) => {
  const unauthorized =
    error?.message?.includes("Unauthorized") || error?.message?.includes("Access token expired") || false;

  const alreadyRetried = operation.getContext().retried === true;
  if (!unauthorized || alreadyRetried) {
    return undefined;
  }

  // Skip refresh for GET_ME itself
  if (operation.operationName === "Me") {
    return undefined;
  }

  // Skip refresh if GET_ME cache already shows no session - user is logged out
  const cached = apolloClient.readQuery<{ me: { id: string } | null }>({ query: GET_ME });
  if (cached?.me === null || cached?.me === undefined) {
    return undefined;
  }

  return new Observable((observer) => {
    deduplicatedRefresh()
      .then(() => {
        operation.setContext({ ...operation.getContext(), retried: true });
        const subscription = forward(operation).subscribe(observer);
        return () => subscription.unsubscribe();
      })
      .catch(() => {
        clearFallbackTokens();
        // Refresh failed - just propagate the error, let the UI handle it
        observer.error(error);
      });
  });
});

apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Goal: { keyFields: ["id"] },
      GoalOperation: { keyFields: ["id"] },
    },
  }),
});

export { apolloClient };
export const __private__ = { refreshSession };

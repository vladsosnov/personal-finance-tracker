"use client";

import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, Observable } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { API_BASE_URL } from "@/shared/constants/auth";

const graphQLEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? `${API_BASE_URL}/graphql`;

const httpLink = new HttpLink({
  uri: graphQLEndpoint,
  credentials: "include",
});

const refreshSession = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Session refresh failed");
  }
};

const errorLink = new ErrorLink(({ error, operation, forward }) => {
  const unauthorized =
    error?.message?.includes("Unauthorized") || error?.message?.includes("Access token expired") || false;

  const alreadyRetried = operation.getContext().retried === true;
  if (!unauthorized || alreadyRetried) {
    return undefined;
  }

  // Only attempt refresh for authenticated-only operations (not GET_ME)
  if (operation.operationName === "Me") {
    return undefined;
  }

  return new Observable((observer) => {
    refreshSession()
      .then(() => {
        operation.setContext({ ...operation.getContext(), retried: true });
        const subscription = forward(operation).subscribe(observer);
        return () => subscription.unsubscribe();
      })
      .catch(() => {
        // Refresh failed — just propagate the error, let the UI handle it
        observer.error(error);
      });
  });
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Goal: { keyFields: ["id"] },
      GoalOperation: { keyFields: ["id"] },
    },
  }),
});

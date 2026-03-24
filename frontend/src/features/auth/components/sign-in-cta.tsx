"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { Button, Group } from "@mantine/core";
import { GET_ME } from "@/shared/gql/queries";
import { APP_ROUTES } from "@/shared/constants/routes";

export const SignInCta = () => {
  const { data, loading } = useQuery<{ me: { id: string } | null }>(GET_ME);
  const isAuthed = Boolean(data?.me);

  if (loading) {
    return null;
  }

  return (
    <Group justify="center" mt="sm">
      {isAuthed ? (
        <Button component={Link} href={APP_ROUTES.dashboard} size="md">
          Open dashboard
        </Button>
      ) : (
        <>
          <Button component={Link} href={APP_ROUTES.auth} size="md">
            Get started
          </Button>
          <Button component={Link} href={APP_ROUTES.auth} size="md" variant="light">
            Sign in
          </Button>
        </>
      )}
    </Group>
  );
};

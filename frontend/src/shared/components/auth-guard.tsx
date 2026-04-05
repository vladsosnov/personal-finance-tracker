"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { GET_ME } from "@/shared/gql/queries";

const PROTECTED_PATHS = ["/goals", "/profile", "/admin"];
const AUTH_ONLY_PATHS = ["/auth"];
const AUTH_BYPASS_PATHS = ["/auth/verify-email", "/auth/forgot-password", "/auth/reset-password"];

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data, loading } = useQuery<{ me: { id: string } | null }>(GET_ME, {
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (loading) return;

    const isAuthed = Boolean(data?.me);
    const isProtected = PROTECTED_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    const isBypass = AUTH_BYPASS_PATHS.some((p) => pathname === p);
    const isAuthOnly =
      !isBypass && AUTH_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

    if (isProtected && !isAuthed) {
      router.replace("/auth");
    } else if (isAuthOnly && isAuthed) {
      router.replace("/goals");
    }
  }, [pathname, router, data, loading]);

  return <>{children}</>;
};

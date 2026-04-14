"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { GET_ME, type MeQueryData } from "@/shared/gql/queries";

const PROTECTED_PATHS = ["/goals", "/profile", "/expenses", "/admin"];
const AUTH_ONLY_PATHS = ["/auth"];
const AUTH_BYPASS_PATHS = ["/auth/verify-email", "/auth/forgot-password", "/auth/reset-password"];

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data, loading } = useQuery<MeQueryData>(GET_ME, {
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
    const rawSearch = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(rawSearch);
    const currentUrl = `${pathname}${rawSearch}`;
    const nextTarget = params.get("next");

    if (isProtected && !isAuthed) {
      router.replace(`/auth?next=${encodeURIComponent(currentUrl)}`);
    } else if (isAuthOnly && isAuthed) {
      router.replace(nextTarget || "/goals");
    }
  }, [pathname, router, data, loading]);

  return <>{children}</>;
};
